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

// Submit form handler
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
      body: JSON.stringify({ message }),
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

// Append message to DOM
function appendMessage(sender, text) {
  const div = document.createElement('div');
  div.className = sender;
  div.innerText = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Save current chat to localStorage
function saveCurrentChat() {
  if (messages.length === 0) return;
  const id = currentChatId || `chat_${++chatCounter}`;
  localStorage.setItem(id, JSON.stringify(messages));
  localStorage.setItem('chatCounter', chatCounter);
  currentChatId = id;
}

// Load chat into view
function loadChat(id) {
  const stored = localStorage.getItem(id);
  if (!stored) return;
  messages = JSON.parse(stored);
  currentChatId = id;
  messagesDiv.innerHTML = '';
  messages.forEach(msg => appendMessage(msg.role, msg.text));
}

// Generate chat summaries for sidebar
function updateSidebar() {
  historyList.innerHTML = '';
  for (let i = chatCounter; i >= 1; i--) {
    const id = `chat_${i}`;
    const chatData = localStorage.getItem(id);
    if (chatData) {
      const chatArr = JSON.parse(chatData);
      const summary = chatArr.find(m => m.role === 'user')?.text || 'No text';
      const li = document.createElement('li');
      li.innerHTML = `💌 <strong></strong> ${summary}`;
      li.onclick = () => loadChat(id);
      historyList.appendChild(li);
    }
  }
}

// Toggle sidebar visibility
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// New Chat button
newChatBtn.addEventListener('click', () => {
  saveCurrentChat();
  messages = [];
  currentChatId = null;
  messagesDiv.innerHTML = '';
});

// Load summaries on page load
updateSidebar();
