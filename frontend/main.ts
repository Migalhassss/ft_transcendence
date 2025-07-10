const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const chatContainer = document.getElementById('chatContainer');

navButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const target = btn.getAttribute('data-view');
    if (target === 'profile'){

    }
    else if (target === 'matchmaking'){

    }
    else if (target === 'chat') {
      // Load chat.html ONCE
      if (chatContainer && !chatContainer.dataset.loaded) {
        try {
          const res = await fetch('chat.html');
          const html = await res.text();
          chatContainer.innerHTML = html;
          chatContainer.dataset.loaded = 'true';

          const script = document.createElement('script');
          script.src = '/dist/chat.js';
          script.type = 'module'; 
          script.defer = true;
          document.body.appendChild(script);
          const hideElements = chatContainer.querySelectorAll(
            '#roomList, .invite-button, #addFriendModal, .chat-container'
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
        '#chatContainer',
        '.chat-container'
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

// Get references to DOM elements
const toggleBtn = document.getElementById('toggleNotifications') as HTMLButtonElement | null;
const notificationPanel = document.getElementById('notificationsPanel') as HTMLElement | null;

// Toggle logic for the 🔔 button
toggleBtn?.addEventListener('click', () => {
    if (!notificationPanel){
        console.log("no notification Panel");
        return;
    }
  
    console.log("yo wassup");   
    const isHidden = notificationPanel.style.display === 'none' || getComputedStyle(notificationPanel).display === 'none';
    notificationPanel.style.display = isHidden ? 'block' : 'none';
  
    // Hide all other .view elements (but notificationPanel is NOT one of them)
    const views = document.querySelectorAll('.view');
    views.forEach((view) => view.classList.add('hidden'));
  });

// Add a notification to the list
export function addNotification(message: string, onAccept?: () => void, onDecline?: () => void) {
  console.log("addNotification called with message:", message);

  const list = document.getElementById('notificationList') as HTMLUListElement | null;
  console.log("notificationList exists:", list);
  if (!list) return;

  const li = document.createElement('li');
  li.className = "flex flex-col space-y-2";

  const text = document.createElement('span');
  text.textContent = message;
  li.appendChild(text);

  if (onAccept || onDecline) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex justify-end space-x-2';

    if (onAccept) {
      const acceptBtn = document.createElement('button');
      acceptBtn.textContent = 'Accept';
      acceptBtn.className = 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded';
      acceptBtn.onclick = () => {
        onAccept();
        li.remove(); // remove the notification
      };
      buttonContainer.appendChild(acceptBtn);
    }

    if (onDecline) {
      const declineBtn = document.createElement('button');
      declineBtn.textContent = 'Decline';
      declineBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded';
      declineBtn.onclick = () => {
        onDecline();
        li.remove(); // remove the notification
      };
      buttonContainer.appendChild(declineBtn);
    }

    li.appendChild(buttonContainer);
  }

  list.appendChild(li);
  console.log("Notification appended:", li);
}


// Close notifications when clicking outside
document.addEventListener('click', (event) => {
  if (!notificationPanel || !toggleBtn) return;

  const target = event.target as HTMLElement;

  if (
    !notificationPanel.contains(target) &&
    target !== toggleBtn &&
    !notificationPanel.classList.contains('hidden')
  ) {
    notificationPanel.classList.add('hidden');
  }
});
