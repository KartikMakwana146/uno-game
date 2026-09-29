// src/ui/chat.js - Skribbl.io styled chat & system events panel

export class ChatPanel {
  constructor(containerEl, onSendMessage) {
    this.container = containerEl;
    this.onSendMessage = onSendMessage;
    this.messagesListEl = null;
    this.inputEl = null;
    this.formEl = null;
    this.setupDOM();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div class="chat-panel">
        <div class="chat-panel__messages" id="chat-messages-box"></div>
        <form class="chat-panel__form" id="chat-form">
          <input 
            type="text" 
            class="chat-panel__input" 
            id="chat-input" 
            placeholder="Type your message here..." 
            maxlength="100" 
            autocomplete="off"
          />
        </form>
      </div>
    `;

    this.messagesListEl = this.container.querySelector('#chat-messages-box');
    this.inputEl = this.container.querySelector('#chat-input');
    this.formEl = this.container.querySelector('#chat-form');

    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.inputEl.value.trim();
      if (text) {
        this.onSendMessage(text);
        this.inputEl.value = '';
      }
    });
  }

  focus() {
    this.inputEl?.focus();
  }

  clear() {
    if (this.messagesListEl) {
      this.messagesListEl.innerHTML = '';
    }
  }

  /**
   * Adds a regular chat message from a user
   */
  addUserMessage(senderName, text, isYou = false) {
    const row = document.createElement('div');
    row.className = `chat-msg chat-msg--user ${isYou ? 'chat-msg--you' : ''}`;
    row.innerHTML = `<b>${this.escapeHTML(senderName)}:</b> ${this.escapeHTML(text)}`;
    this.appendMessage(row);
  }

  /**
   * Adds a colored system event message
   * type: 'info' | 'negative' | 'owner' | 'success'
   */
  addSystemMessage(text, type = 'info') {
    const row = document.createElement('div');
    row.className = `chat-msg chat-msg--system chat-msg--${type}`;
    row.textContent = text;
    this.appendMessage(row);
  }

  appendMessage(el) {
    if (!this.messagesListEl) return;
    this.messagesListEl.appendChild(el);
    // Scroll to bottom
    this.messagesListEl.scrollTop = this.messagesListEl.scrollHeight;
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
