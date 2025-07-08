const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const chatContainer = document.getElementById('chatContainer');

navButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const target = btn.getAttribute('data-view');

    if (target === 'chat') {
      // Load chat.html ONCE
      if (chatContainer && !chatContainer.dataset.loaded) {
        try {
          const res = await fetch('chat.html');
          const html = await res.text();
          chatContainer.innerHTML = html;
          chatContainer.dataset.loaded = 'true';

          const script = document.createElement('script');
          script.src = 'chat.js';
          script.defer = true;
          document.body.appendChild(script);
          const hideElements = chatContainer.querySelectorAll(
            '#roomList, .invite-button, #addFriendModal, .chat-container, .saved-container'
          );
          hideElements.forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        } catch (err) {
          console.error('Failed to load chat.html or chat.js', err);
        }
      }

      // Toggle visibility of chat sub-elements
      const toggleElements = [
        '#roomList',
        '.invite-button',
        '#addFriendModal',
        '.chat-container',
        '.saved-container'
      ];

      toggleElements.forEach((selector) => {
        const el = chatContainer?.querySelector(selector) as HTMLElement;
        if (el) {
          const isHidden = getComputedStyle(el).display === 'none';
          el.style.display = isHidden ? 'block' : 'none';
        }
      });

      return; // Exit early — don't switch view like the others
    }

    // If not 'chat', switch views normally
    views.forEach((view) => view.classList.add('hidden'));

    const targetView = document.getElementById(target!);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    // Optional: hide chat UI when switching to other views
    if (chatContainer) {
      const hideElements = chatContainer.querySelectorAll(
        '#roomList, .invite-button, #addFriendModal, .chat-container, .saved-container'
      );
      hideElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    }
  });
});
