window.addEventListener('DOMContentLoaded', () => {
  const socket = new WebSocket('ws://localhost:3000/ws/chat');

  socket.onopen = () => {
    console.log('WebSocket readyState:', socket.readyState); // Should be 1 (OPEN)
    console.log(Date.now())
      setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ event: 'ping' }));
        }
      }, 30000); // every 30 seconds
      console.log('Connected to chat');
      sendMessage('Alice', 'general', 'Hello after 1 second!');
      console.log('Message sent');
    };
  
    
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.event === 'message') {
      console.log('Message received:', msg.data);
    } else if (msg.event === 'error') {
      console.error('Error:', msg.data);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = (event) => {
    console.log(Date.now())
    console.error('Error:', event);
    console.warn('Socket closed:', event.code, event.reason);
  };  
  
  function sendMessage(user, room, text) {
    const message = {
      event: 'message',
      data: { user, room, text, timestamp: Date.now() }
    };
    console.log('sending message');
    socket.send(JSON.stringify(message));
  }
});
