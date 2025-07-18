import { FastifyPluginAsync } from 'fastify';
import { userSocketMap, userChannels } from '../chat/chatGateway'; // import from your chat system

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
const connectedPlayers = new Map<string, Player>();
const pendingFriendInvites = new Map<string, string>(); // invitedUsername -> inviterUsername

function resetBall(state: GameState, direction: 1 | -1) {
  state.ball.x = 300;
  state.ball.y = 1000;
  state.ball.vx = 5 * direction;
  state.ball.vy = 0;
}

function startGame(player1: Player, player2: Player) {
  const WINNING_SCORE = 5;

  const gameState: GameState = {
    ball: { x: 300, y: 1000, vx: 5, vy: 0 },
    paddles: { left: 1000, right: 1000 },
    scores: { left: 0, right: 0 }
  };

  player1.socket.send(JSON.stringify({ type: 'start', role: 'left', opponent: player2.username }));
  player2.socket.send(JSON.stringify({ type: 'start', role: 'right', opponent: player1.username }));

  const inputs = { left: 'stop', right: 'stop' };

  const handleMessage = (player: 'left' | 'right') => (msg: any) => {
    const data = JSON.parse(msg.toString());
    if (data.type === 'move') {
      inputs[player] = data.direction;
    }
  };

  player1.socket.on('message', handleMessage('left'));
  player2.socket.on('message', handleMessage('right'));

  const interval = setInterval(() => {
    // Movement logic
    if (inputs.left === 'up') gameState.paddles.left -= 15;
    if (inputs.left === 'down') gameState.paddles.left += 15;
    if (inputs.right === 'up') gameState.paddles.right -= 15;
    if (inputs.right === 'down') gameState.paddles.right += 15;

    const GAME_HEIGHT = 2000;
    const PADDLE_HEIGHT = 150;
    gameState.paddles.left = Math.max(0, Math.min(gameState.paddles.left, GAME_HEIGHT - PADDLE_HEIGHT));
    gameState.paddles.right = Math.max(0, Math.min(gameState.paddles.right, GAME_HEIGHT - PADDLE_HEIGHT));

    // Ball physics
    gameState.ball.x += gameState.ball.vx;
    gameState.ball.y += gameState.ball.vy;

    if (gameState.ball.y <= 0 || gameState.ball.y >= 2000) {
      gameState.ball.vy *= -1;
    }

    // Paddle collisions
    if (
      gameState.ball.x <= 20 &&
      gameState.ball.y >= gameState.paddles.left &&
      gameState.ball.y <= gameState.paddles.left + 150
    ) {
      gameState.ball.vx *= -1;
      const relativeY = (gameState.ball.y - gameState.paddles.left) / 150;
      gameState.ball.vy = relativeY < 0.5 ? -5 : 5;
    }

    if (
      gameState.ball.x >= 580 &&
      gameState.ball.y >= gameState.paddles.right &&
      gameState.ball.y <= gameState.paddles.right + 150
    ) {
      gameState.ball.vx *= -1;
      const relativeY = (gameState.ball.y - gameState.paddles.right) / 150;
      gameState.ball.vy = relativeY < 0.5 ? -5 : 5;
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

    // ✅ Game over logic (updated)
    if (gameState.scores.left >= WINNING_SCORE || gameState.scores.right >= WINNING_SCORE) {
      const winner = gameState.scores.left >= WINNING_SCORE ? 'left' : 'right';
      const winnerUsername = winner === 'left' ? player1.username : player2.username;
    
      const gameOverMessage = JSON.stringify({
        type: 'gameOver',
        winner,
        winnerUsername
      });
    
      player1.socket.send(gameOverMessage);
      player2.socket.send(gameOverMessage);


      clearInterval(interval);

      return;
    }

    // State update
    const stateUpdate = JSON.stringify({
      type: 'state',
      ball: gameState.ball,
      paddles: gameState.paddles,
      scores: gameState.scores
    });

    player1.socket.send(stateUpdate);
    player2.socket.send(stateUpdate);
  }, 1000 / 30);

  const cleanup = () => {
    clearInterval(interval);
    try { player2.socket.close(); } catch {}
    try { player1.socket.close(); } catch {}
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
      console.log(`User connected to Pong: ${username}`);
    } catch (err) {
      console.error('Invalid token');
      socket.close();
      return;
    }

    const player: Player = { socket, username };
    connectedPlayers.set(username, player);

    socket.send(JSON.stringify({ type: 'joined', message: 'Welcome to Pong' }));

    socket.on('message', (msg: any) => {
      const data = JSON.parse(msg.toString());

      if (data.type === 'friendInvite') {
        const friendId = data.friendId;
        const userInfo = userChannels.get(userSocketMap.get(username)!);
        if (!userInfo || !userInfo.friends.includes(friendId)) {
          socket.send(JSON.stringify({ type: 'error', message: 'User is not your friend' }));
          return;
        }

        const friendSocket = userSocketMap.get(friendId);
        if (!friendSocket) {
          socket.send(JSON.stringify({ type: 'error', message: 'Friend is not online' }));
          return;
        }

        pendingFriendInvites.set(friendId, username);

        friendSocket.send(JSON.stringify({
          event: 'pongInvite',
          data: { from: username }
        }));

        socket.send(JSON.stringify({ type: 'info', message: `Invite sent to ${friendId}` }));
      }

      if (data.type === 'friendAccept') {
        const inviterUsername = pendingFriendInvites.get(username);
        if (!inviterUsername) {
          socket.send(JSON.stringify({ type: 'error', message: 'No pending invite found' }));
          return;
        }

        const inviter = connectedPlayers.get(inviterUsername);
        const invitee = connectedPlayers.get(username);

        if (inviter && invitee) {
          pendingFriendInvites.delete(username);
          startGame(inviter, invitee);
        } else {
          socket.send(JSON.stringify({ type: 'error', message: 'Both players must be online' }));
        }
      }

      if (data.type === 'startMatchmaking') {
        console.log(`${username} wants to start matchmaking`);

        if (waitingPlayers.some(p => p.username === username)) return;

        waitingPlayers.push(player);

        if (waitingPlayers.length >= 2) {
          const p1 = waitingPlayers.shift()!;
          const p2 = waitingPlayers.shift()!;
          console.log(`🎮 Starting game between ${p1.username} and ${p2.username}`);
          startGame(p1, p2);
        }
      }
    });

    socket.on('close', () => {
      console.log(`Player ${username} disconnected`);
      connectedPlayers.delete(username);

      const index = waitingPlayers.findIndex(p => p.username === username);
      if (index !== -1) waitingPlayers.splice(index, 1);
    });
  });
};
