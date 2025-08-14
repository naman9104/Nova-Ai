// One-time nova activation flag: when true, next bot reply will be typed+spoken once
let novaOneTime = true; // default ON for a fresh page load/new chat

// Chatbot logic
const chatForm = document.getElementById('chat-form');
const micBtn = document.getElementById('mic-btn');
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

let recognition;
let recognizing = false;

// Setup Speech Recognition (one-shot, on mic button click)
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    recognizing = true;
    micBtn.classList.add('listening');
  };

  recognition.onend = () => {
    recognizing = false;
    micBtn.classList.remove('listening');
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    recognizing = false;
    micBtn.classList.remove('listening');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log('Recognized:', transcript);
   
    processUserMessage(transcript); // auto-send mic input
  };
} else {
  micBtn.style.display = 'none'; // Hide mic button if not supported
}

// Mic button click toggles recognition (one-shot)
micBtn.addEventListener('click', () => {
  if (recognizing) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

// Append message with typewriter and TTS if novaOneTime
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (sender === 'bot') {
    if (novaOneTime) {
      novaOneTime = false; // turn OFF after first use
      let i = 0;
      const speed = 20;
      function typeWriter() {
        if (i < text.length) {
          msgDiv.textContent += text.charAt(i);
          i++;
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
          setTimeout(typeWriter, speed);
        } else {
          speakText(text);
        }
      }
      typeWriter();
    } else {
      msgDiv.textContent = text;
    }
  } else {
    msgDiv.textContent = text;
  }
}


// Process user message (typed or from mic)
function processUserMessage(message) {
  if (!message) return;
  appendMessage('user', message);
  messages.push({ role: 'user', text: message });
  sendToAPI(message);
}

// Handle form submit (send typed input)
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;
  processUserMessage(message);
  userInput.value = '';
});

// Send message to backend and handle reply
async function sendToAPI(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'bot';
  loadingDiv.textContent = 'NOVA is typing...';
  messagesDiv.appendChild(loadingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
    });

    const data = await res.json();

    setTimeout(() => {
      loadingDiv.remove();
      appendMessage('bot', data.reply);
      messages.push({ role: 'bot', text: data.reply });
      saveCurrentChat();
      updateSidebar();
    }, 600);
  } catch (err) {
    loadingDiv.remove();
    appendMessage('bot', 'Oops! Something went wrong.');
    console.error(err);
  }
}

// Save current chat
function saveCurrentChat() {
  if (messages.length === 0) return;
  const id = currentChatId || `chat_${++chatCounter}`;
  localStorage.setItem(id, JSON.stringify(messages));
  localStorage.setItem('chatCounter', chatCounter);
  currentChatId = id;
}

// Load chat by id from sidebar
function loadChat(id) {
  const stored = localStorage.getItem(id);
  if (!stored) return;
  messages = JSON.parse(stored);
  currentChatId = id;
  messagesDiv.innerHTML = '';
  novaOneTime = false; // never typewriter for old chats
  messages.forEach(msg => appendMessage(msg.role, msg.text));
}

// Update sidebar chat list
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

// Toggle sidebar
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// New chat resets state
newChatBtn.addEventListener('click', () => {
  saveCurrentChat();
  messages = [];
  currentChatId = null;
  messagesDiv.innerHTML = '';
  novaOneTime = true; // enable typewriter again for new chat
});

// =============== Eye Follow Effect (face-api) ===============

// Fallback mouse tracking when no face tracking
document.addEventListener('mousemove', event => {
  const faceRect = botFace.getBoundingClientRect();
  const centerX = faceRect.left + faceRect.width / 2;
  const centerY = faceRect.top + faceRect.height / 2;

  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;

  const maxMove = 25;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const scale = Math.min(maxMove / Math.max(distance, 1), 1);

  const moveX = deltaX * scale;
  const moveY = deltaY * scale;

  leftEye.style.transform = `translate(${moveX}px, ${moveY}px)`;
  rightEye.style.transform = `translate(${moveX}px, ${moveY}px)`;
});



