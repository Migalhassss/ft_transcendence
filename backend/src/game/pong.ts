import { FastifyPluginAsync } from 'fastify';

interface TokenPayload {
    username: string;
}

type Player = {
    socket: any;
    username: string;
};

interface GameState {
    ball: { x: number; y: number; vx: number; vy: number };
    paddles: { left: number; right: number };
    scores: { left: number; right: number };
}

const waitingPlayers: Player[] = [];

function resetBall(state: GameState, direction: 1 | -1) {
    state.ball.x = 300;
    state.ball.y = 200;
    state.ball.vx = 2 * direction;
    state.ball.vy = 2;
}

function startGame(player1: Player, player2: Player) {
  const gameState: GameState = {
    ball: { x: 300, y: 200, vx: 2, vy: 2 },
    paddles: { left: 200, right: 200 },
    scores: { left: 0, right: 0 }
  };

  // Send start event
  player1.socket.send(JSON.stringify({ type: 'start', role: 'left', opponent: player2.username }));
  player2.socket.send(JSON.stringify({ type: 'start', role: 'right', opponent: player1.username }));

  const inputs = {
    left: 'stop',
    right: 'stop'
  };

  // Listen for player messages
  const handleMessage = (player: 'left' | 'right') => (msg: any) => {
    const data = JSON.parse(msg.toString());
    if (data.type === 'move') {
      inputs[player] = data.direction;
    }
  };

  player1.socket.on('message', handleMessage('left'));
  player2.socket.on('message', handleMessage('right'));

  const interval = setInterval(() => {
    // Move paddles
    if (inputs.left === 'up') gameState.paddles.left -= 5;
    if (inputs.left === 'down') gameState.paddles.left += 5;
    if (inputs.right === 'up') gameState.paddles.right -= 5;
    if (inputs.right === 'down') gameState.paddles.right += 5;

    // Move ball
    gameState.ball.x += gameState.ball.vx;
    gameState.ball.y += gameState.ball.vy;

    // Wall collision
    if (gameState.ball.y <= 0 || gameState.ball.y >= 400) {
      gameState.ball.vy *= -1;
    }

    // Paddle collision
    if (
      gameState.ball.x <= 20 &&
      gameState.ball.y >= gameState.paddles.left &&
      gameState.ball.y <= gameState.paddles.left + 80
    ) {
      gameState.ball.vx *= -1;
    }
    if (
      gameState.ball.x >= 580 &&
      gameState.ball.y >= gameState.paddles.right &&
      gameState.ball.y <= gameState.paddles.right + 80
    ) {
      gameState.ball.vx *= -1;
    }

    // Scoring
    if (gameState.ball.x < 0) {
      gameState.scores.right += 1;
      resetBall(gameState, -1);
    }
    if (gameState.ball.x > 600) {
      gameState.scores.left += 1;
      resetBall(gameState, 1);
    }

    // Send state to clients
    const stateUpdate = JSON.stringify({
      type: 'state',
      ball: gameState.ball,
      paddles: gameState.paddles,
      scores: gameState.scores
    });

    player1.socket.send(stateUpdate);
    player2.socket.send(stateUpdate);
  }, 1000 / 30); // 30 FPS

  // Cleanup on disconnect
  const cleanup = () => {
    clearInterval(interval);
    try { player1.socket.close(); } catch {}
    try { player2.socket.close(); } catch {}
  };

  player1.socket.on('close', cleanup);
  player2.socket.on('close', cleanup);
}

export const pongGateway: FastifyPluginAsync = async (fastify) => {
    fastify.get('/pong', { websocket: true }, (socket, request) => {
      const url = new URL(request.url, 'http://localhost');
      const token = url.searchParams.get('token');
  
      let username = '';

      try {
        const payload = fastify.jwt.verify(token) as TokenPayload;
        username = payload.username;
        (socket as any).username = username;
        console.log(`User connected: ${username}`);
      } catch (err) {
        console.error('Invalid token');
        socket.close();
        return;
      }

      const player: Player = { socket, username };

        const opponent = waitingPlayers.shift();
        if (opponent) {
        startGame(player, opponent);
        } else {
        waitingPlayers.push(player);
        }
  
      socket.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        // Handle paddle movement, sync position, etc.
      });
  
      socket.on('close', () => {
        // Handle disconnects
      });
  
      socket.send(JSON.stringify({ type: 'joined', message: 'Welcome to Pong' }));
    });
  };
  
  
  