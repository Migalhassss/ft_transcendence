import { FastifyPluginAsync } from 'fastify';
import { fetchRoomMessages, handleIncomingMessage } from './chatService';
import { joinRoom, leaveRoom } from './messageStore'

interface TokenPayload {
  username: string;
}

export const chatGateway: FastifyPluginAsync = async (fastify) => {
  fastify.get('/chat', { websocket: true }, (socket, request) => {
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let username = '';

    try {
      const payload = fastify.jwt.verify(token) as TokenPayload;
      username = payload.username;
      console.log(`User connected: ${username}`);
    } catch (err) {
      console.error('Invalid token');
      socket.close();
      return;
    }

    socket.on('message', (raw) => {
      console.log('Received raw message:', raw.toString());
      try {
        const parsed = JSON.parse(raw.toString());

        if (parsed.event === 'message') {
          const savedMessage = handleIncomingMessage(parsed.data);
          console.log('Processed message:', savedMessage);

          socket.send(JSON.stringify({
            event: 'message',
            data: savedMessage
          }));
        }
        else if (parsed.event === 'getPreviousMessages') {
          const roomName = parsed.data.room;
          const messages = fetchRoomMessages(roomName);
    
          socket.send(JSON.stringify({
            event: 'previousMessages',
            data: messages
          }));
        }
        else if (parsed.event === 'ping') {
          socket.send(JSON.stringify({ event: 'pong' }));
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
        socket.send(JSON.stringify({
          event: 'error',
          data: 'Invalid message format'
        }));
      }
    });

    socket.on('joinRoom', (roomName) => {
      joinRoom(socket, roomName);
      const messages = fetchRoomMessages(roomName);
      socket.emit('previousMessages', messages);
    });

    socket.on('leaveRoom', (roomName) => {
      leaveRoom(socket, roomName);
    })

    socket.on('close', () => {
      console.log('Client disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('pong', () => {
      console.log('Pong received');
    });
  });
};
