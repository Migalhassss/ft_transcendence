window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('jwtToken');  // or wherever you store your token
  const socket = new WebSocket(`ws://localhost:3000/ws/chat?token=${token}`);

  const messagesDiv = document.getElementById('messages');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const savedDiv = document.getElementById('savedMessages');
  const loadSavedBtn = document.getElementById('loadSavedBtn');

  socket.onopen = () => {
    console.log('WebSocket readyState:', socket.readyState); // Should be 1 (OPEN)
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.event === 'message') {
      const { user, text, timestamp } = msg.data;

      const msgEl = document.createElement('div');
      msgEl.className = 'message';
      msgEl.textContent = `${user}: ${text}`;
      messagesDiv.appendChild(msgEl);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } else if (msg.event === 'previousMessages') {
      savedDiv.innerHTML = '';
      msg.data.forEach(({ user, text }) => {
        const el = document.createElement('div');
        el.className = 'message';
        el.textContent = `${user}: ${text}`;
        savedDiv.appendChild(el);
      });
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log(Date.now());
    console.error('Error:', event);
    console.warn('Socket closed:', event.code, event.reason);
  };

  function sendMessage(user, room, text) {
    const message = {
      event: 'message',
      data: { user, room, text, timestamp: Date.now() },
    };
    console.log('sending message');
    socket.send(JSON.stringify(message));
  }

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;

    sendMessage('Alice', 'general', text); // hardcoded user/room for now
    input.value = '';
  });

  // Send message on Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  loadSavedBtn.addEventListener('click', () => {
    savedDiv.innerHTML = '<em>Loading saved messages...</em>';

    // Send a WS event to request previous messages from server for room 'general'
    socket.send(
      JSON.stringify({
        event: 'getPreviousMessages',
        data: { room: 'general' },
      })
    );
  });
});

