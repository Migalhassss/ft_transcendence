export function initMatchmaking() {
    console.log("🔁 Initializing matchmaking setup");
  
    let socket: WebSocket | null = null;
  
    const startBtn = document.getElementById('startMatchmaking') as HTMLButtonElement;
    const cancelBtn = document.getElementById('cancelMatchmaking') as HTMLButtonElement;
    const statusText = document.getElementById('matchStatus')!;
    const matchResult = document.getElementById('matchResult')!;
    const gameContainer = document.getElementById('gameContainer')!;
    const matchmakingView = document.getElementById('matchmakingView')!;
  
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
          matchResult.classList.remove('hidden');
  
          matchmakingView.classList.add('hidden');
  
          const res = await fetch('game.html');
          const html = await res.text();
          gameContainer.innerHTML = html;
          gameContainer.classList.remove('hidden');
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
  