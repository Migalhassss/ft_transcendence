(() => {
  const token = sessionStorage.getItem('authToken');
  let username = '';
  let currentRoom: string = 'general';

  function parseJwt(token: string): { username: string } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
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
  } else {
    console.error('No username in token');
    window.location.href = '/login.html';
    throw new Error('Invalid token payload. Redirecting...');
  }

  const socket = new WebSocket(`ws://localhost:3000/ws/chat?token=${token}`);

  // DOM Elements
  const messagesDiv = document.getElementById('messages') as HTMLDivElement | null;
  const input = document.getElementById('messageInput') as HTMLInputElement | null;
  const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement | null;
  const openAddFriendBtn = document.getElementById('openAddFriend') as HTMLButtonElement | null;
  const addFriendModal = document.getElementById('addFriendModal') as HTMLDivElement | null;
  const confirmAddFriendBtn = document.getElementById('confirmAddFriend') as HTMLButtonElement | null;
  const friendUsernameInput = document.getElementById('friendUsernameInput') as HTMLInputElement | null;

  // Guard against missing elements
  if (!messagesDiv || !input || !sendBtn || !openAddFriendBtn || !addFriendModal || !confirmAddFriendBtn || !friendUsernameInput) {
    console.error('Some DOM elements are missing');
    return;
  }

  openAddFriendBtn.addEventListener('click', () => {
    addFriendModal.style.display = 'block';
    friendUsernameInput.focus();
  });

  confirmAddFriendBtn.addEventListener('click', () => {
    const friendUsername = friendUsernameInput.value.trim();
    if (!friendUsername) return;

    socket.send(
      JSON.stringify({
        event: 'addFriend',
        data: { friendUsername },
      })
    );

    friendUsernameInput.value = '';
    addFriendModal.style.display = 'none';
  });

  socket.onopen = () => {
    console.log('WebSocket readyState:', socket.readyState);
    socket.send(JSON.stringify({ event: 'getUserRoomsAndFriends' }));
  };

  socket.onmessage = (event: MessageEvent) => {
    const msg = JSON.parse(event.data);

    if (msg.event === 'message') {
      appendMessage(msg.data.user, msg.data.text, Date.now());
    } else if (msg.event === 'previousMessages') {
      messagesDiv.innerHTML = '';
      msg.data.forEach(({ user, text }: { user: string; text: string }) => {
        const el = document.createElement('div');
        el.className = 'message';
        el.textContent = `${user}: ${text}`;
        messagesDiv.appendChild(el);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

    } else if (msg.event === 'userRooms') {
        const roomList = document.getElementById('roomList') as HTMLUListElement | null;
      if (!roomList) return;

      roomList.innerHTML = '';

      msg.data.rooms.forEach((room: string) => {
        const li = document.createElement('li');
        li.dataset.room = room;
        li.textContent = `# ${room}`;
        roomList.appendChild(li);
      });

      msg.data.friends.forEach((friend: string) => {
        const li = document.createElement('li');
        li.dataset.room = `@${friend}`;
        li.textContent = `@ ${friend}`;
        roomList.appendChild(li);
      });

      setupRoomListeners();
    } else if (msg.event === 'friendAdded') {
      alert(`Friend added: ${msg.data.username}`);
    } else if (msg.event === 'friendInvite') {
      const fromUser = msg.data.from;
      // Show your custom friend invite modal/pop-up here
      if (confirm(`${fromUser} sent you a friend request. Accept?`)) {
        socket.send(JSON.stringify({ event: 'respondFriendInvite', data: { from: fromUser, accepted: true } }));
      } else {
        socket.send(JSON.stringify({ event: 'respondFriendInvite', data: { from: fromUser, accepted: false } }));
      }
    }
  };

  socket.onerror = (error: Event) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = (event: CloseEvent) => {
    console.error('Socket closed:', event.code, event.reason);
  };

  function sendMessage(user: string, room: string, text: string) {
    const message = {
      event: 'message',
      data: { user, room, text, timestamp: Date.now() },
    };
    socket.send(JSON.stringify(message));
  }

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text || !currentRoom) return;

    sendMessage(username, currentRoom, text);
    input.value = '';
  });

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  function appendMessage(user: string, text: string, timestamp?: number) {
    if (!messagesDiv) return;
  
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
    const roomItems = document.querySelectorAll<HTMLLIElement>('#roomList li');
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
          socket.send(
            JSON.stringify({
              event: 'joinRoom',
              data: { room: currentRoom },
            })
          );
        }
      });
    });
  }
})();
