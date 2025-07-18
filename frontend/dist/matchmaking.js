const startBtn = document.getElementById('startMatchmaking');
const cancelBtn = document.getElementById('cancelMatchmaking');
const FriendInvite = document.getElementById('inviteFriend');
// const FriendMatch = document.getElementById('FriendMatch')!;
const statusText = document.getElementById('matchStatus');
const matchResult = document.getElementById('matchResult');
const gameContainer = document.getElementById('gameContainer');
const matchmaking = document.getElementById('matchmaking');
export function initMatchmaking() {
    console.log("🔁 Initializing matchmaking setup");
    let socket = null;
    let cleanup = null; // Declare cleanup function outside
    const toggleElements = [
        '#matchmakingView',
    ];
    if (!startBtn || !cancelBtn) {
        console.warn("Matchmaking buttons not found.");
        return;
    }
    FriendInvite.addEventListener('click', async () => {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            alert('No auth token found');
            return;
        }
        statusText.textContent = 'waiting for Friend';
        FriendInvite.style.display = 'none';
        startBtn.style.display = 'none';
        socket = new WebSocket(`ws://localhost:3000/game/pong?token=${token}`);
        socket.onopen = () => {
            console.log('🔌 Connected to matchmaking');
            const friendId = document.getElementById('FriendMatchInput')?.value;
            socket.send(JSON.stringify({ type: 'friendInvite', friendId }));
        };
        socket.addEventListener('message', async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'start') {
                console.log('🎮 Match found, starting game...');
                matchResult.textContent = `✅ Match found! You are playing as ${data.role}`;
                toggleElements.forEach((selector) => {
                    const el = matchmaking?.querySelector(selector);
                    if (el) {
                        const isHidden = getComputedStyle(el).display === 'none';
                        el.style.display = isHidden ? 'block' : 'none';
                    }
                });
                // Await the fetch and text reading
                const res = await fetch('game.html');
                const html = await res.text();
                gameContainer.innerHTML = html;
                gameContainer.classList.remove('hidden');
                const canvas = gameContainer.querySelector('#gameCanvas');
                if (canvas) {
                    // Await dynamic import
                    const { default: initGame } = await import('./game.js');
                    console.log("check2");
                    cleanup = initGame(canvas, socket);
                }
            }
            else if (data.type === 'gameOver') {
                console.log("message received");
                alert(`🏆 Game Over! Winner: ${data.winner.toUpperCase()}`);
                console.log("🏁 Game ended. Cleaning up...");
                if (cleanup)
                    cleanup();
                socket?.close();
                resetUI();
            }
            else if (data.type === 'end') {
                console.log("🏁 Game ended. Cleaning up...");
                if (cleanup)
                    cleanup();
                socket?.close();
                resetUI();
            }
            else if (data.type === 'error') {
                alert(data.message);
                resetUI();
                socket?.close();
            }
        });
        socket.onerror = (err) => {
            console.error('WebSocket error:', err);
            statusText.textContent = '❌ WebSocket error. Try again.';
            resetUI();
        };
        socket.onclose = () => {
            console.log('🔌 WebSocket closed');
            resetUI();
        };
    });
    startBtn.addEventListener('click', async () => {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            alert('No auth token found');
            return;
        }
        statusText.textContent = '🔍 Searching for a match...';
        FriendInvite.style.display = 'none';
        startBtn.style.display = 'none';
        cancelBtn.classList.remove('hidden');
        socket = new WebSocket(`ws://localhost:3000/game/pong?token=${token}`);
        socket.onopen = () => {
            console.log('🔌 Connected to matchmaking');
            socket.send(JSON.stringify({ type: 'startMatchmaking' }));
        };
        socket.addEventListener('message', async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'start') {
                console.log('🎮 Match found, starting game...');
                matchResult.textContent = `✅ Match found! You are playing as ${data.role}`;
                toggleElements.forEach((selector) => {
                    const el = matchmaking?.querySelector(selector);
                    if (el) {
                        const isHidden = getComputedStyle(el).display === 'none';
                        el.style.display = isHidden ? 'block' : 'none';
                    }
                });
                // Await the fetch and text reading
                const res = await fetch('game.html');
                const html = await res.text();
                gameContainer.innerHTML = html;
                gameContainer.classList.remove('hidden');
                const canvas = gameContainer.querySelector('#gameCanvas');
                if (canvas) {
                    // Await dynamic import
                    const { default: initGame } = await import('./game.js');
                    console.log("check2");
                    cleanup = initGame(canvas, socket);
                }
            }
            else if (data.type === 'gameOver') {
                console.log("message received");
                alert(`🏆 Game Over! Winner: ${data.winner.toUpperCase()}`);
                console.log("🏁 Game ended. Cleaning up...");
                if (cleanup)
                    cleanup();
                socket?.close();
                resetUI();
            }
            else if (data.type === 'end') {
                console.log("🏁 Game ended. Cleaning up...");
                if (cleanup)
                    cleanup();
                socket?.close();
                resetUI();
            }
        });
        socket.onerror = (err) => {
            console.error('WebSocket error:', err);
            statusText.textContent = '❌ WebSocket error. Try again.';
            resetUI();
        };
        socket.onclose = () => {
            console.log('🔌 WebSocket closed');
            resetUI();
        };
    });
    cancelBtn.addEventListener('click', () => {
        socket?.close();
        startBtn.style.display = 'block';
        FriendInvite.style.display = 'block';
        statusText.textContent = 'Matchmaking cancelled.';
        resetUI();
    });
}
export function resetUI() {
    statusText.textContent = 'Click the button below to enter matchmaking.';
    startBtn.style.display = 'block';
    FriendInvite.style.display = 'block';
    gameContainer.classList.add('hidden');
    matchResult.classList.remove('hidden');
}
initMatchmaking();
//# sourceMappingURL=matchmaking.js.map