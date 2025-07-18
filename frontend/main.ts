const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const chatContainer = document.getElementById('chatContainer')!;
const matchmaking = document.getElementById('matchmaking')!;

// Inject HTML and script once
async function injectHTMLAndScript(container: HTMLElement, htmlPath: string, scriptPath: string, innerWrapperClass?: string) {
  if (container.dataset.loaded) return;
  try {
    const res = await fetch(htmlPath);
    const html = await res.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll('script').forEach(script => script.remove());
    container.innerHTML = innerWrapperClass
      ? `<div class="${innerWrapperClass}">${tempDiv.innerHTML}</div>`
      : tempDiv.innerHTML;
    container.dataset.loaded = 'true';

    const script = document.createElement('script');
    script.src = scriptPath;
    script.type = 'module';
    script.defer = true;
    document.body.appendChild(script);

    console.log(`✅ Injected ${htmlPath} and ${scriptPath}`);
  } catch (err) {
    console.error(`❌ Failed to load ${htmlPath} or ${scriptPath}:`, err);
  }
}

// ✅ Preload everything at startup
document.addEventListener('DOMContentLoaded', async () => {
  await injectHTMLAndScript(matchmaking, 'matchmaking.html', '/dist/matchmaking.js', 'inner-matchmaking');
  await injectHTMLAndScript(chatContainer, 'chat.html', '/dist/chat.js');

  // Optionally: Hide elements initially
  const chatHideEls = chatContainer.querySelectorAll('#roomList, .invite-button, #addFriendModal, .chat-container');
  chatHideEls.forEach((el) => (el as HTMLElement).style.display = 'none');
});

// ✅ Handle nav clicks
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-view');

    // Hide all views
    views.forEach((view) => view.classList.add('hidden'));

    // Handle chat tab
    if (target === 'chat') {
      const chat = document.getElementById('chat');
      if (chat) chat.classList.toggle('hidden');

      const toggleElements = [
        '#chat',
        '#roomList',
        '.invite-button',
        '#addFriendModal',
        '#chatContainer',
        '.chat-container'
      ];
      toggleElements.forEach((selector) => {
        const el = chatContainer.querySelector(selector) as HTMLElement;
        if (el) {
          const isHidden = getComputedStyle(el).display === 'none';
          el.style.display = isHidden ? 'block' : 'none';
        }
      });
      return;
    }

    // Handle matchmaking tab
    if (target === 'matchmaking') {
      const toggleElements = [
        '#matchmakingView',
      ];
      toggleElements.forEach((selector) => {
        const el = matchmaking.querySelector(selector) as HTMLElement;
        if (el) {
          const isHidden = getComputedStyle(el).display === 'none';
          el.style.display = isHidden ? 'block' : 'none';
        }
      });
      return;
    }

    // Default view switch
    const targetView = document.getElementById(target!);
    if (targetView) targetView.classList.remove('hidden');

    const hideElements = chatContainer.querySelectorAll(
      '#roomList, .invite-button, #addFriendModal, .chat-container, .saved-container'
    );
    hideElements.forEach((el) => (el as HTMLElement).style.display = 'none');
  });
});

// 🔔 Notification toggle
const toggleBtn = document.getElementById('toggleNotifications') as HTMLButtonElement | null;
const notificationPanel = document.getElementById('notificationsPanel') as HTMLElement | null;

toggleBtn?.addEventListener('click', () => {
  if (!notificationPanel) return;
  const isHidden = notificationPanel.style.display === 'none' || getComputedStyle(notificationPanel).display === 'none';
  notificationPanel.style.display = isHidden ? 'block' : 'none';

  views.forEach((view) => view.classList.add('hidden'));
});

// 🔔 Add notification
export function addNotification(message: string, onAccept?: () => void, onDecline?: () => void) {
  const list = document.getElementById('notificationList') as HTMLUListElement | null;
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
        li.remove();
      };
      buttonContainer.appendChild(acceptBtn);
    }

    if (onDecline) {
      const declineBtn = document.createElement('button');
      declineBtn.textContent = 'Decline';
      declineBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded';
      declineBtn.onclick = () => {
        onDecline();
        li.remove();
      };
      buttonContainer.appendChild(declineBtn);
    }

    li.appendChild(buttonContainer);
  }

  list.appendChild(li);
}

// 🔔 Close notification panel if clicking outside
document.addEventListener('click', (event) => {
  if (!notificationPanel || !toggleBtn) return;
  const target = event.target as HTMLElement;
  if (
    !notificationPanel.contains(target) &&
    target !== toggleBtn &&
    getComputedStyle(notificationPanel).display !== 'none'
  ) {
    notificationPanel.style.display = 'none';
  }
});
