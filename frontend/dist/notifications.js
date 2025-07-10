// Get references to DOM elements
const toggleBtn = document.getElementById('toggleNotifications');
const notificationPanel = document.getElementById('notificationsPanel');
// Toggle logic for the 🔔 button
toggleBtn === null || toggleBtn === void 0 ? void 0 : toggleBtn.addEventListener('click', () => {
    if (!notificationPanel) {
        console.log("no notification Panel");
        return;
    }
    console.log("yo wassup");
    const isHidden = notificationPanel.classList.contains('hidden');
    notificationPanel.classList.toggle('hidden', !isHidden);
    // Hide all other .view elements (but notificationPanel is NOT one of them)
    const views = document.querySelectorAll('.view');
    views.forEach((view) => view.classList.add('hidden'));
});
// Add a notification to the list
export function addNotification(message) {
    const list = document.getElementById('notificationList');
    if (!list)
        return;
    const li = document.createElement('li');
    li.textContent = message;
    list.appendChild(li);
}
// Close notifications when clicking outside
document.addEventListener('click', (event) => {
    if (!notificationPanel || !toggleBtn)
        return;
    const target = event.target;
    if (!notificationPanel.contains(target) &&
        target !== toggleBtn &&
        !notificationPanel.classList.contains('hidden')) {
        notificationPanel.classList.add('hidden');
    }
});
//# sourceMappingURL=notifications.js.map