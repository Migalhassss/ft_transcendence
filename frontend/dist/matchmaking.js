export function initMatchmaking() {
    console.log("🔁 Initializing matchmaking setup");
    let socket = null;
    const startBtn = document.getElementById('startMatchmaking');
    const cancelBtn = document.getElementById('cancelMatchmaking');
    const statusText = document.getElementById('matchStatus');
    const matchResult = document.getElementById('matchResult');
    const gameContainer = document.getElementById('gameContainer');
    const matchmaking = document.getElementById('matchmaking');
    const chatContainer = document.getElementById('chatContainer');
    const toggleElementsChat = [
        '#chat',
        '#roomList',
        '.invite-button',
        '#addFriendModal',
        '#chatContainer',
        '.chat-container'
    ];
    const toggleElements = [
        '#matchmakingView',
        '#startMatchmaking',
        '#matchStatus',
        '#cancelMatchmaking'
    ];
    if (!startBtn || !cancelBtn) {
        console.warn("Matchmaking buttons not found.");
        return;
    }
    startBtn.addEventListener('click', () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('No auth token found');
            return;
        }
        statusText.textContent = '🔍 Searching for a match...';
        startBtn.classList.add('hidden');
        cancelBtn.classList.remove('hidden');
        socket = new WebSocket(`ws://localhost:3000/game/pong?token=${token}`);
        socket.onopen = () => {
            console.log('🔌 Connected to matchmaking');
        };
        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'start') {
                console.log('🎮 Match found, starting game...');
                matchResult.textContent = `✅ Match found! You are playing as ${data.role}`;
                // matchResult.classList.remove('hidden');
                // matchmakingView.classList.add('hidden');
                toggleElements.forEach((selector) => {
                    const el = matchmaking?.querySelector(selector);
                    if (el) {
                        const isHidden = getComputedStyle(el).display === 'none';
                        el.style.display = isHidden ? 'block' : 'none';
                    }
                });
                toggleElementsChat.forEach((selector) => {
                    const el = chatContainer?.querySelector(selector);
                    if (el) {
                        const isHidden = getComputedStyle(el).display === 'none';
                        el.style.display = isHidden ? 'block' : 'none';
                    }
                });
                const res = await fetch('game.html');
                const html = await res.text();
                gameContainer.innerHTML = html;
                gameContainer.classList.remove('hidden');
                const canvas = gameContainer.querySelector('#gameCanvas');
                if (canvas) {
                    const { default: initGame } = await import('./game.js');
                    console.log("check2");
                    initGame(canvas, socket);
                }
            }
        };
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
        statusText.textContent = 'Matchmaking cancelled.';
        resetUI();
    });
    function resetUI() {
        startBtn.classList.remove('hidden');
        cancelBtn.classList.add('hidden');
        matchResult.classList.add('hidden');
    }
}
initMatchmaking();
//# sourceMappingURL=matchmaking.js.map