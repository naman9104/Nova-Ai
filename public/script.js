// Chatbot logic
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messagesDiv = document.getElementById('messages');
const historyList = document.getElementById('historyList');
const sidebar = document.getElementById('chatHistorySidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const newChatBtn = document.getElementById('new-chat');

let chatCounter = localStorage.getItem('chatCounter') || 0;
let currentChatId = null;
let messages = [];
let sessionId = localStorage.getItem('mathsNerdSessionId');
if (!sessionId) {
  sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('mathsNerdSessionId', sessionId);
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  messages.push({ role: 'user', text: message });
  userInput.value = '';

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await res.json();
    appendMessage('bot', data.reply);
    messages.push({ role: 'bot', text: data.reply });
    saveCurrentChat();
    updateSidebar();
  } catch (err) {
    appendMessage('bot', 'Oops! Something went wrong.');
  }
});

function appendMessage(sender, text) {
  const div = document.createElement('div');
  div.className = sender;
  div.innerText = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function saveCurrentChat() {
  if (messages.length === 0) return;
  const id = currentChatId || `chat_${++chatCounter}`;
  localStorage.setItem(id, JSON.stringify(messages));
  localStorage.setItem('chatCounter', chatCounter);
  currentChatId = id;
}

function loadChat(id) {
  const stored = localStorage.getItem(id);
  if (!stored) return;
  messages = JSON.parse(stored);
  currentChatId = id;
  messagesDiv.innerHTML = '';
  messages.forEach(msg => appendMessage(msg.role, msg.text));
}

function updateSidebar() {
  historyList.innerHTML = '';
  for (let i = chatCounter; i >= 1; i--) {
    const id = `chat_${i}`;
    const chatData = localStorage.getItem(id);
    if (chatData) {
      const chatArr = JSON.parse(chatData);
      const summary = chatArr.find(m => m.role === 'user')?.text || 'No text';
      const li = document.createElement('li');
      li.innerHTML = `📚 <strong></strong> ${summary}`;
      li.onclick = () => loadChat(id);
      historyList.appendChild(li);
    }
  }
}

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

newChatBtn.addEventListener('click', () => {
  saveCurrentChat();
  messages = [];
  currentChatId = null;
  messagesDiv.innerHTML = '';
});

updateSidebar();

// 👀 Eye tracking using mouse only
const leftEye = document.querySelector('.left-eye');
const rightEye = document.querySelector('.right-eye');

document.addEventListener('mousemove', (e) => {
  moveEyes(e.clientX, e.clientY);
});

function moveEyes(x, y) {
  [leftEye, rightEye].forEach((eye) => {
    const rect = eye.getBoundingClientRect();
    const centerX = rect.left + rect.width / 90;
    const centerY = rect.top + rect.height / 90;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.min(rect.width / 2, Math.hypot(deltaX, deltaY) / 2);

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
}
