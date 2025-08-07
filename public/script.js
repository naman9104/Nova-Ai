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

// Typing effect message appender
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (sender === 'bot') {
    let i = 0;
    const speed = 20;

    function typeWriter() {
      if (i < text.length) {
        msgDiv.textContent += text.charAt(i);
        i++;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        setTimeout(typeWriter, speed);
      }
    }

    typeWriter();
  } else {
    msgDiv.textContent = text;
  }
}

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage('user', message);
  messages.push({ role: 'user', text: message });
  userInput.value = '';

  try {
    // Show loader
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bot';
    loadingDiv.textContent = 'Nova is typing...';
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await res.json();

    // Remove loader and show typed message
    setTimeout(() => {
      loadingDiv.remove();
      appendMessage('bot', data.reply);
      messages.push({ role: 'bot', text: data.reply });
      saveCurrentChat();
      updateSidebar();
    }, 600);

  } catch (err) {
    appendMessage('bot', 'Oops! Something went wrong.');
  }
});

// Save current chat
function saveCurrentChat() {
  if (messages.length === 0) return;
  const id = currentChatId || `chat_${++chatCounter}`;
  localStorage.setItem(id, JSON.stringify(messages));
  localStorage.setItem('chatCounter', chatCounter);
  currentChatId = id;
}

// Load a specific chat from sidebar
function loadChat(id) {
  const stored = localStorage.getItem(id);
  if (!stored) return;
  messages = JSON.parse(stored);
  currentChatId = id;
  messagesDiv.innerHTML = '';
  messages.forEach(msg => appendMessage(msg.role, msg.text));
}

// Update sidebar with chat list
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

// Toggle sidebar visibility
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// New Chat clears current conversation
newChatBtn.addEventListener('click', () => {
  saveCurrentChat();
  messages = [];
  currentChatId = null;
  messagesDiv.innerHTML = '';
});

updateSidebar();

// =================== Eye Follow Effect ===================
const botFace = document.getElementById('bot-face');
const leftEye = document.querySelector('.eye:nth-child(1)');
const rightEye = document.querySelector('.eye:nth-child(2)');

document.addEventListener('mousemove', (event) => {
  const faceRect = botFace.getBoundingClientRect();
  const centerX = faceRect.left + faceRect.width / 2;
  const centerY = faceRect.top + faceRect.height / 2;

  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;

  const maxMove = 15;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const scale = Math.min(maxMove / distance, 1);

  const moveX = deltaX * scale;
  const moveY = deltaY * scale;

  leftEye.style.transform = `translate(${moveX}px, ${moveY}px)`;
  rightEye.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

