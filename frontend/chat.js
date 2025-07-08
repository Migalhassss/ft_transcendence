(() => {
  const token = sessionStorage.getItem('authToken');  // or wherever you store your token
  let username = '';
  let currentRoom = 'general';

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1]; // payload is the second part
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Invalid token format', e);
      return null;
    }
  }

  if (!token) {
    window.location.href = '/login.html';
  } else {
    const payload = parseJwt(token);
    username = payload.username;
    console.log('Logged in as:', username);
  }

  const socket = new WebSocket(`ws://localhost:3000/ws/chat?token=${token}`);

  const messagesDiv = document.getElementById('messages');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const savedDiv = document.getElementById('savedMessages');
  const loadSavedBtn = document.getElementById('loadSavedBtn');

  //---------------------------------------------------------------//
  const openAddFriendBtn = document.getElementById('openAddFriend');
  const addFriendModal = document.getElementById('addFriendModal');
  const confirmAddFriendBtn = document.getElementById('confirmAddFriend');
  const friendUsernameInput = document.getElementById('friendUsernameInput');

  openAddFriendBtn.addEventListener('click', () => {
    addFriendModal.style.display = 'block';
    friendUsernameInput.focus();
  });

  confirmAddFriendBtn.addEventListener('click', () => {
    const friendUsername = friendUsernameInput.value.trim();
    if (!friendUsername) return;

    socket.send(JSON.stringify({
      event: 'addFriend',
      data: { friendUsername }
    }));

    friendUsernameInput.value = '';
    addFriendModal.style.display = 'none';
  });
  //----------------------------------------------------------//

  socket.onopen = () => {
    console.log('WebSocket readyState:', socket.readyState);
    socket.send(JSON.stringify({
      event: 'getUserRoomsAndFriends',
    }));
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
    } else if (msg.event === 'userRooms') {
      const roomList = document.getElementById('roomList');
      roomList.innerHTML = '';

      msg.data.rooms.forEach(room => {
        const li = document.createElement('li');
        li.dataset.room = room;
        li.textContent = `# ${room}`;
        roomList.appendChild(li);
      });

      msg.data.friends.forEach(friend => {
        const li = document.createElement('li');
        li.dataset.room = `@${friend}`;
        li.textContent = `@ ${friend}`;
        roomList.appendChild(li);
      });

      setupRoomListeners();
    } else if (msg.event === 'friendAdded') {
      alert(`Friend added: ${msg.data.username}`);
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
    if (!text || !currentRoom) return;

    sendMessage(username, currentRoom, text);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  loadSavedBtn.addEventListener('click', () => {
    savedDiv.innerHTML = '<em>Loading saved messages...</em>';
    socket.send(
      JSON.stringify({
        event: 'getPreviousMessages',
        data: { room: 'general' },
      })
    );
  });

  function setupRoomListeners() {
    const roomItems = document.querySelectorAll('#roomList li');

    roomItems.forEach(item => {
      item.addEventListener('click', () => {
        roomItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const selectedRoom = item.getAttribute('data-room');
        currentRoom = selectedRoom;

        socket.send(JSON.stringify({
          event: 'joinRoom',
          data: { room: currentRoom }
        }));
      });
    });
  }
})();
