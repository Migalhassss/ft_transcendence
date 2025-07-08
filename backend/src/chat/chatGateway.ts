import { FastifyPluginAsync } from 'fastify';
import { fetchRoomMessages, handleIncomingMessage } from './chatService';
import { joinRoom, leaveRoom } from './messageStore'

interface TokenPayload {
  username: string;
}

const userSocketMap = new Map<string, WebSocket>();

type friendsAndRooms = {
  friends : string[];
  rooms : string[];
};

const userChannels = new Map<WebSocket, friendsAndRooms>();

export const chatGateway: FastifyPluginAsync = async (fastify) => {
  fastify.get('/chat', { websocket: true }, (socket, request) => {
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

    userSocketMap.set(username, socket);

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
        } else if (parsed.event === 'getUserRoomsAndFriends') {
          const username = socket.username; // <-- from decoded JWT or session
      
          // Fetch rooms and friends from DB
          const rooms = getRoomsForUser(username, socket);
          const friends = getFriendsForUser(username);
      
          // Send back to client
          socket.send(JSON.stringify({
            event: 'userRooms',
            data: {
              rooms,
              friends
            }
          }));
        }
        else if (parsed.event === 'addFriend') {
          const requester = (socket as any).username;
          const friendUsername = parsed.data.friendUsername;
        
          const requesterData = userChannels.get(socket) ?? { friends: [], rooms: [] };
          if (!requesterData.friends.includes(friendUsername)) {
            requesterData.friends.push(friendUsername);
          }
          userChannels.set(socket, requesterData);
        
          socket.send(JSON.stringify({
            event: 'friendAdded',
            data: { username: friendUsername }
          }));
        
          const friendSocket = userSocketMap.get(friendUsername);
          if (friendSocket) {
            const friendData = userChannels.get(friendSocket) ?? { friends: [], rooms: [] };
            if (!friendData.friends.includes(requester)) {
              friendData.friends.push(requester);
            }
            userChannels.set(friendSocket, friendData);
        
            friendSocket.send(JSON.stringify({
              event: 'friendAdded',
              data: { username: requester }
            }));
          }
        }
        else if (parsed.event === 'ping') {
          socket.send(JSON.stringify({ event: 'pong' }));
        }
        else if (parsed.event === 'joinRoom') {
          const roomName = parsed.data.room;
          joinRoom(socket, roomName);
        
          const messages = fetchRoomMessages(roomName);
          socket.send(JSON.stringify({
            event: 'previousMessages',
            data: messages
          }));
        }
        else if(parsed.event === 'leaveRoom') {
          const roomName = parsed.data.room;
          leaveRoom(socket, roomName);
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
        socket.send(JSON.stringify({
          event: 'error',
          data: 'Invalid message format'
        }));
      }
    });

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

function getRoomsForUser(username: string, socket: WebSocket): string[] {
  // Start everyone with "general"
  const entry = userChannels.get(socket);

  if (entry) {
    return entry.rooms;
  }

  // If not already set, default to ["general"]
  const defaultRooms = ['general'];
  userChannels.set(socket, { rooms: defaultRooms, friends: [] });
  return defaultRooms;
};

function getFriendsForUser(socket: WebSocket): string[] {
  const entry = userChannels.get(socket);
  return entry?.friends ?? [];
};

