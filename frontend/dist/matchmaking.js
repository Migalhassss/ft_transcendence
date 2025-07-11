var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function initMatchmaking() {
    console.log("🔁 Initializing matchmaking setup");
    let socket = null;
    const startBtn = document.getElementById('startMatchmaking');
    const cancelBtn = document.getElementById('cancelMatchmaking');
    const statusText = document.getElementById('matchStatus');
    const matchResult = document.getElementById('matchResult');
    const gameContainer = document.getElementById('gameContainer');
    const matchmakingView = document.getElementById('matchmakingView');
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
        socket.onmessage = (event) => __awaiter(this, void 0, void 0, function* () {
            const data = JSON.parse(event.data);
            if (data.type === 'start') {
                console.log('🎮 Match found, starting game...');
                matchResult.textContent = `✅ Match found! You are playing as ${data.role}`;
                matchResult.classList.remove('hidden');
                matchmakingView.classList.add('hidden');
                const res = yield fetch('game.html');
                const html = yield res.text();
                gameContainer.innerHTML = html;
                gameContainer.classList.remove('hidden');
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
        socket === null || socket === void 0 ? void 0 : socket.close();
        statusText.textContent = 'Matchmaking cancelled.';
        resetUI();
    });
    function resetUI() {
        startBtn.classList.remove('hidden');
        cancelBtn.classList.add('hidden');
        matchResult.classList.add('hidden');
    }
}
//# sourceMappingURL=matchmaking.js.map