import { addNotification } from './main.js';
import { resetUI } from './matchmaking.js';
(() => {
    const token = sessionStorage.getItem('authToken');
    let username = '';
    let currentRoom = 'general';
    let cleanup = null; // Declare cleanup function outside
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''));
            return JSON.parse(jsonPayload);
        }
        catch (e) {
            console.error('Invalid token format', e);
            return null;
        }
    }
    if (!token) {
        window.location.href = '/login.html';
        throw new Error('Token not found. Redirecting...');
    }
    const payload = parseJwt(token);
    if (payload?.username) {
        username = payload.username;
        console.log('Logged in as:', username);
    }
    else {
        console.error('No username in token');
        window.location.href = '/login.html';
        throw new Error('Invalid token payload. Redirecting...');
    }
    const socket = new WebSocket(`ws://localhost:3000/ws/chat?token=${token}`);
    // DOM Elements
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const openAddFriendBtn = document.getElementById('openAddFriend');
    const addFriendModal = document.getElementById('addFriendModal');
    const confirmAddFriendBtn = document.getElementById('confirmAddFriend');
    const friendUsernameInput = document.getElementById('friendUsernameInput');
    // Guard against missing elements
    if (!messagesDiv || !input || !sendBtn || !openAddFriendBtn || !addFriendModal || !confirmAddFriendBtn || !friendUsernameInput) {
        console.error('Some DOM elements are missing');
        return;
    }
    openAddFriendBtn.addEventListener('click', () => {
        if (addFriendModal.style.display === 'block')
            addFriendModal.style.display = 'none';
        else {
            addFriendModal.style.display = 'block';
            friendUsernameInput.focus();
        }
    });
    confirmAddFriendBtn.addEventListener('click', () => {
        const friendUsername = friendUsernameInput.value.trim();
        if (!friendUsername)
            return;
        socket.send(JSON.stringify({
            event: 'addFriend',
            data: { friendUsername },
        }));
        friendUsernameInput.value = '';
        addFriendModal.style.display = 'none';
    });
    socket.onopen = () => {
        console.log('WebSocket readyState:', socket.readyState);
        socket.send(JSON.stringify({ event: 'getUserRoomsAndFriends' }));
    };
    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.event === 'message') {
            appendMessage(msg.data.user, msg.data.text, Date.now());
        }
        else if (msg.event === 'previousMessages') {
            messagesDiv.innerHTML = '';
            msg.data.forEach(({ user, text }) => {
                const el = document.createElement('div');
                el.className = 'message';
                el.textContent = `${user}: ${text}`;
                messagesDiv.appendChild(el);
            });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        else if (msg.event === 'userRooms') {
            const roomList = document.getElementById('roomList');
            if (!roomList)
                return;
            roomList.innerHTML = '';
            msg.data.rooms.forEach((room) => {
                const li = document.createElement('li');
                li.dataset.room = room;
                li.textContent = `# ${room}`;
                roomList.appendChild(li);
            });
            msg.data.friends.forEach((friend) => {
                const li = document.createElement('li');
                li.dataset.room = `@${friend}`;
                li.textContent = `@ ${friend}`;
                roomList.appendChild(li);
            });
            setupRoomListeners();
        }
        else if (msg.event === 'requestingFriend') {
            console.log("inviting friend");
            addNotification(`${msg.data.username} has sent you a friend request.`, () => {
                socket.send(JSON.stringify({
                    event: 'respondFriendInvite',
                    data: { from: msg.data.username, accepted: true }
                }));
            }, () => {
                socket.send(JSON.stringify({
                    event: 'respondFriendInvite',
                    data: { from: msg.data.username, accepted: false }
                }));
            });
        }
        else if (msg.event === 'addingFriend') {
            addRoomOrFriend(`@${msg.data.username}`, true);
        }
        else if (msg.event === 'friendInviteDeclined') {
        }
        else if (msg.event === 'pongInvite') {
            const fromUser = msg.data.from;
            // Add a notification (like friend requests)
            addNotification(`${fromUser} has invited you to a Pong game.`, async () => {
                const token = sessionStorage.getItem('authToken');
                if (!token) {
                    alert("Auth token missing, can't join game.");
                    return;
                }
                const pongSocket = new WebSocket(`ws://localhost:3000/game/pong?token=${token}`);
                pongSocket.onopen = () => {
                    console.log('Connected to Pong game server');
                    pongSocket.send(JSON.stringify({ type: 'friendAccept' }));
                };
                pongSocket.addEventListener('message', async (event) => {
                    const pongMsg = JSON.parse(event.data);
                    if (pongMsg.type === 'start') {
                        const gameContainer = document.getElementById('gameContainer');
                        if (gameContainer) {
                            document.getElementById('matchmakingView')?.classList.add('hidden');
                            const startBtn = document.getElementById('startMatchmaking');
                            const FriendInvite = document.getElementById('inviteFriend');
                            FriendInvite.style.display = 'none';
                            startBtn.style.display = 'none';
                            const res = await fetch('game.html');
                            const html = await res.text();
                            gameContainer.innerHTML = html;
                            gameContainer.classList.remove('hidden');
                            const canvas = gameContainer.querySelector('#gameCanvas');
                            console.log("here");
                            if (canvas) {
                                const { default: initGame } = await import('./game.js');
                                console.log("hello");
                                cleanup = initGame(canvas, pongSocket);
                                console.log("hello");
                            }
                        }
                    }
                    else if (pongMsg.type === 'gameOver') {
                        console.log("message received");
                        alert(`🏆 Game Over! Winner: ${pongMsg.winner.toUpperCase()}`);
                        console.log("🏁 Game ended. Cleaning up...");
                        if (cleanup)
                            cleanup();
                        resetUI();
                        pongSocket?.close();
                    }
                    else if (pongMsg.type === 'end') {
                        console.log("🏁 Game ended. Cleaning up...");
                        if (cleanup)
                            cleanup();
                        resetUI();
                        pongSocket?.close();
                    }
                    else if (pongMsg.type === 'error') {
                        alert(pongMsg.message);
                        resetUI();
                        pongSocket?.close();
                    }
                });
                pongSocket.onerror = (err) => {
                    console.error('Pong WebSocket error:', err);
                    alert('Error connecting to Pong game.');
                };
                pongSocket.onclose = () => {
                    console.log('Pong WebSocket closed');
                };
            }, () => {
                // Decline pong game invite
                socket.send(JSON.stringify({
                    event: 'pongInviteResponse',
                    data: { accepted: false, from: fromUser }
                }));
            });
            // Simulate a direct message in the chat window
            sendMessage(fromUser, `@${username}`, "has invited you to a Pong game. Check your notifications to accept or decline.");
        }
    };
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    socket.onclose = (event) => {
        console.error('Socket closed:', event.code, event.reason);
    };
    function sendMessage(user, room, text) {
        const message = {
            event: 'message',
            data: { user, room, text, timestamp: Date.now() },
        };
        socket.send(JSON.stringify(message));
    }
    sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text || !currentRoom)
            return;
        sendMessage(username, currentRoom, text);
        input.value = '';
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')
            sendBtn.click();
    });
    function appendMessage(user, text, timestamp) {
        if (!messagesDiv)
            return;
        const msgEl = document.createElement('div');
        msgEl.className = 'message';
        const timeStr = timestamp
            ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
        msgEl.textContent = `[${timeStr}] ${user}: ${text}`;
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    function setupRoomListeners() {
        const roomItems = document.querySelectorAll('#roomList li');
        roomItems.forEach((item) => {
            item.addEventListener('click', () => {
                roomItems.forEach((i) => i.classList.remove('active'));
                item.classList.add('active');
                const selectedRoom = item.getAttribute('data-room');
                if (selectedRoom) {
                    currentRoom = selectedRoom;
                    if (messagesDiv) {
                        messagesDiv.innerHTML = ''; // Clear old messages only if element exists
                    }
                    socket.send(JSON.stringify({
                        event: 'joinRoom',
                        data: { room: currentRoom },
                    }));
                }
            });
        });
    }
    function addRoomOrFriend(label, isFriend) {
        const roomList = document.getElementById('roomList');
        if (!roomList)
            return;
        // Prevent duplicates
        const existing = Array.from(roomList.children).find((child) => child.dataset.room === label);
        if (existing)
            return;
        const li = document.createElement('li');
        li.dataset.room = label;
        li.textContent = isFriend ? `@ ${label.replace('@', '')}` : `# ${label}`;
        roomList.appendChild(li);
        li.addEventListener('click', () => {
            const roomItems = document.querySelectorAll('#roomList li');
            roomItems.forEach((i) => i.classList.remove('active'));
            li.classList.add('active');
            currentRoom = label;
            if (messagesDiv) {
                messagesDiv.innerHTML = '';
            }
            socket.send(JSON.stringify({
                event: 'joinRoom',
                data: { room: currentRoom },
            }));
        });
    }
})();
//# sourceMappingURL=chat.js.map