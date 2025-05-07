const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messages = document.getElementById('messages');
const newChatBtn = document.getElementById('new-chat');
const sidebar = document.getElementById('chatHistorySidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const historyList = document.getElementById('historyList');
const botFace = document.getElementById('bot-face');
const leftEye = document.querySelector('.left-eye');
const rightEye = document.querySelector('.right-eye');

// Eye follow cursor
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

// Load chat history
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('cutieHistory') || '[]');
  historyList.innerHTML = '';
  history.forEach((entry, index) => {
    const li = document.createElement('li');
    li.textContent = `Chat ${index + 1}`;
    li.addEventListener('click', () => {
      messages.innerHTML = entry;
    });
    historyList.appendChild(li);
  });
}

// Save chat
function saveHistory() {
  const history = JSON.parse(localStorage.getItem('cutieHistory') || '[]');
  history.push(messages.innerHTML);
  localStorage.setItem('cutieHistory', JSON.stringify(history));
  loadHistory();
}

// Add message
function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  msgDiv.textContent = text;
  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;
}

// Handle chat submit
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  userInput.value = '';

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    addMessage(data.reply, 'bot');
  } catch (error) {
    addMessage("❌ Cutie got an error! Try again later.", 'bot');
    console.error('Error:', error);
  }
});

// New chat
newChatBtn.addEventListener('click', () => {
  if (messages.innerHTML.trim()) {
    saveHistory();
  }
  messages.innerHTML = '';
});

// Sidebar toggle
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

loadHistory();
