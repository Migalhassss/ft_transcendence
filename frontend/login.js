document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  
    const data = await res.json();
  
    if (data.token) {
      localStorage.setItem('authToken', data.token); // 🔐 Save JWT token
  
      if (data.requires2FA) {
        // Redirect to 2FA if needed
        window.location.href = '/2fa.html';
      } else {
        // Redirect to chat or main page
        window.location.href = '/chat.html';
      }
    } else {
      alert('Login failed.');
    }
  });