// ================= Typewriter Setup =================
let typewriterActive = sessionStorage.getItem('typewriterActive') === '1'; // true if previously set

function isTypewriterActive() {
  return sessionStorage.getItem('typewriterActive') === '1';
}

function disableTypewriter() {
  sessionStorage.setItem('typewriterActive', '0');
}

// ================= Chatbot Logic =================
const chatForm = document.getElementById('chat-form');
const micBtn = document.getElementById('mic-btn');
const userInput = document.getElementById('user-input');
const messagesDiv = document.getElementById('messages');
const historyList = document.getElementById('historyList');
const sidebar = document.getElementById('chatHistorySidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const newChatBtn = document.getElementById('new-chat');
const botFace = document.getElementById('bot-face'); 
const leftEye = document.getElementById('left-eye');
const rightEye = document.getElementById('right-eye');

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

// ================= Speech Recognition =================
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => { recognizing = true; micBtn.classList.add('listening'); };
  recognition.onend = () => { recognizing = false; micBtn.classList.remove('listening'); };
  recognition.onerror = (event) => { recognizing = false; micBtn.classList.remove('listening'); console.error(event.error); };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    userInput.value = transcript;
    processUserMessage(transcript);
  };
} else {
  micBtn.style.display = 'none';
}

micBtn.addEventListener('click', () => {
  if (recognizing) recognition.stop();
  else recognition.start();
});

// ================= Append Message =================
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (sender === 'bot' && isTypewriterActive()) {
    let i = 0;
    const speed = 20;
    function typeWriter() {
      if (i < text.length) {
        msgDiv.textContent += text.charAt(i);
        i++;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        setTimeout(typeWriter, speed);
      } else {
        disableTypewriter(); // Stop persistence after first reply
      }
    }
    typeWriter();
  } else {
    msgDiv.textContent = text;
  }
}

// ================= Process User Message =================
function processUserMessage(message) {
  if (!message) return;
  appendMessage('user', message);
  messages.push({ role: 'user', text: message });

  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("open the game") || 
      lowerMsg.includes("start game") || 
      lowerMsg.includes("play snake") ||
      lowerMsg.includes("open d game")) {
    appendMessage('bot', "🎮 Opening Snake Byte Game for you...");
    setTimeout(() => { window.location.href = "SNAKE BYTE.html"; }, 1200);
    return;
  }

  sendToAPI(message);
}

// ================= Form Submit =================
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;
  processUserMessage(message);
  userInput.value = '';
});

// ================= Online + Offline Hybrid =================
async function sendToAPI(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'bot';
  loadingDiv.textContent = 'NOVA is typing...';
  messagesDiv.appendChild(loadingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const forceOffline = localStorage.getItem('NOVA_FORCE_OFFLINE') === '1';
    if (!forceOffline && navigator.onLine) {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
      });
      if (!res.ok) throw new Error('API not OK');
      const data = await res.json();
      setTimeout(() => {
        loadingDiv.remove();
        appendMessage('bot', data.reply);
        messages.push({ role: 'bot', text: data.reply });
        saveCurrentChat();
        updateSidebar();
      }, 600);
      return;
    }
    throw new Error('Go offline');
  } catch (err) {
    loadingDiv.remove();
    const reply = await offlineRespond(message);
    appendMessage('bot', reply);
    messages.push({ role: 'bot', text: reply });
    saveCurrentChat();
    updateSidebar();
  }
}

// ================= Chat Storage =================
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
  sessionStorage.setItem('typewriterActive', '0'); // Loaded chat won't use typewriter
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

// ================= Sidebar Toggle =================
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// ================= New Chat =================
newChatBtn.addEventListener('click', () => {
  saveCurrentChat();
  messages = [];
  currentChatId = null;
  messagesDiv.innerHTML = '';
  sessionStorage.setItem('typewriterActive','1'); // Enable typewriter for first reply
});

// ================= Eye Follow =================
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

// ================= Offline Knowledge Base =================
const OFFLINE_KB = {
  greetings: [
    "Hey there 👋 I'm Nova — online ho ya offline, always here!",
    "Hello! Nova reporting for duty 🤖",
    "Hi! Kaise ho? Ready when you are 🚀"
  ],
  help: [
    "Here are things you can ask me to do:<br>• shayari – I'll share a beautiful poem<br>• joke – I'll tell you a funny joke<br>• motivate – I'll give you motivation<br>• math – type any math expression like 2+2*5<br>• time – I'll tell you the current time<br>• play snake / start game – I'll open the Snake Byte game"
  ],
  jokes: [
    "😄 Why did the function break up with the loop? It felt it was going in circles!",
    "😂 I told my computer I needed a break, it said: ‘No problem—I’ll go to sleep.’"
  ],
  motivation: [
    "✨ Great things take time. Keep going.",
    "🚀 You’re closer than you think. One more push!"
  ]
};

// ================= Utility Functions =================
function looksLikeMath(text) {
  return /^[0-9\s+\-*/().]+$/.test(text);
}

function detectIntent(text){
  const t = (text||'').toLowerCase().trim();
  if (/(hi|hello|hey|namaste)/.test(t)) return 'greetings';
  if (/\b(help|what can you do|features)\b/.test(t)) return 'help';
  if (/\b(joke|funny)\b/.test(t)) return 'jokes';
  if (/\b(motivat|inspire|himmat)\b/.test(t)) return 'motivation';
  if (looksLikeMath(t)) return 'math';
  if (/\b(time|date|today|aaj)\b/.test(t)) return 'time';
  return 'unknown';
}

function safeEvalMath(expr) {
  try { return Function('"use strict"; return (' + expr + ')')(); }
  catch { return null; }
}

async function offlineRespond(message){
  const intent = detectIntent(message);
  if (intent === 'math'){ 
    const ans = safeEvalMath(message);
    if (ans !== null) return `🧮 ${message} = ${ans}`;
  }
  if (intent in OFFLINE_KB) return OFFLINE_KB[intent][0];
  return "I'm here to help! Type 'help' to see what I can do.";
}

// ================= Force Offline Toggle =================
const offlineToggle = document.createElement('label');
offlineToggle.style.position = 'fixed';
offlineToggle.style.bottom = '10px';
offlineToggle.style.right = '12px';
offlineToggle.style.font = '14px system-ui';
offlineToggle.style.background = '#0003';
offlineToggle.style.padding = '6px 10px';
offlineToggle.style.borderRadius = '10px';
offlineToggle.style.color = '#fff';
offlineToggle.innerHTML = `<input id="forceOff" type="checkbox"> Force Offline`;
document.body.appendChild(offlineToggle);

const forceEl = document.getElementById('forceOff');
forceEl.checked = localStorage.getItem('NOVA_FORCE_OFFLINE')==='1';
forceEl.addEventListener('change',()=>{
  if(forceEl.checked) localStorage.setItem('NOVA_FORCE_OFFLINE','1');
  else localStorage.removeItem('NOVA_FORCE_OFFLINE');
});

window.addEventListener('online', ()=>appendMessage('bot','✅ Back online.'));
window.addEventListener('offline',()=>appendMessage('bot','🔌 You are offline. Using local brain.'));
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

  // Apply movement to the wrapper
  document.querySelectorAll('.eye-wrapper').forEach(wrapper => {
    wrapper.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
});
// JS only moves the wrapper
leftWrapper.style.transform = `translate(${moveX}px, ${moveY}px)`;
rightWrapper.style.transform = `translate(${moveX}px, ${moveY}px)`;
