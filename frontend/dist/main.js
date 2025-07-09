"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const chatContainer = document.getElementById('chatContainer');
navButtons.forEach((btn) => {
    btn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const target = btn.getAttribute('data-view');
        if (target === 'chat') {
            // Load chat.html ONCE
            if (chatContainer && !chatContainer.dataset.loaded) {
                try {
                    const res = yield fetch('chat.html');
                    const html = yield res.text();
                    chatContainer.innerHTML = html;
                    chatContainer.dataset.loaded = 'true';
                    const script = document.createElement('script');
                    script.src = '/dist/chat.js';
                    script.defer = true;
                    document.body.appendChild(script);
                    const hideElements = chatContainer.querySelectorAll('#roomList, .invite-button, #addFriendModal, .chat-container, .saved-container');
                    hideElements.forEach((el) => {
                        el.style.display = 'none';
                    });
                }
                catch (err) {
                    console.error('Failed to load chat.html or chat.js', err);
                }
            }
            // Toggle visibility of chat sub-elements
            const toggleElements = [
                '#roomList',
                '.invite-button',
                '#addFriendModal',
                '#chatContainer',
                '.chat-container',
                '.saved-container'
            ];
            toggleElements.forEach((selector) => {
                const el = chatContainer === null || chatContainer === void 0 ? void 0 : chatContainer.querySelector(selector);
                if (el) {
                    const isHidden = getComputedStyle(el).display === 'none';
                    el.style.display = isHidden ? 'block' : 'none';
                }
            });
            return; // Exit early — don't switch view like the others
        }
        // If not 'chat', switch views normally
        views.forEach((view) => view.classList.add('hidden'));
        const targetView = document.getElementById(target);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        // Optional: hide chat UI when switching to other views
        if (chatContainer) {
            const hideElements = chatContainer.querySelectorAll('#roomList, .invite-button, #addFriendModal, .chat-container, .saved-container');
            hideElements.forEach((el) => {
                el.style.display = 'none';
            });
        }
    }));
});
//# sourceMappingURL=main.js.map