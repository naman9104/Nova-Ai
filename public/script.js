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
    userInput.value = transcript;
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
// Append message with typewriter (no TTS)
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

 




  // ✅ Normal bot reply (typewriter effect only first time)
  if (sender === 'bot') {
    if (novaOneTime) {
      novaOneTime = false;
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
  } else {
    // ✅ User message direct paste
    msgDiv.textContent = text;
  }
}

// Process user message (typed or from mic)
function processUserMessage(message) {
  if (!message) return;
  appendMessage('user', message);
  messages.push({ role: 'user', text: message });

  // 🚀 If user asks for snake game
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("open the game") || 
      lowerMsg.includes("start game") || 
      lowerMsg.includes("play snake")) {
      
      appendMessage('bot', "🎮 Opening Snake Byte Game for you...");
      setTimeout(() => {
        window.location.href = "SNAKE BYTE.html";
      }, 1200);
      return;
  }

  // Normal chat
  sendToAPI(message);
}

// Handle form submit
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;
  processUserMessage(message);
  userInput.value = '';
});

// ================= HYBRID SEND: Online + Offline fallback =================
async function sendToAPI(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'bot';
  loadingDiv.textContent = 'NOVA is typing...';
  messagesDiv.appendChild(loadingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const forceOffline = localStorage.getItem('NOVA_FORCE_OFFLINE') === '1';
    if (!forceOffline && navigator.onLine) {
      // ---- ONLINE PATH ----
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
    // ---- OFFLINE FALLBACK ----
    loadingDiv.remove();
    const reply = await offlineRespond(message);
    appendMessage('bot', reply);
    messages.push({ role: 'bot', text: reply });
    saveCurrentChat();
    updateSidebar();
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

// Load chat
function loadChat(id) {
  const stored = localStorage.getItem(id);
  if (!stored) return;
  messages = JSON.parse(stored);
  currentChatId = id;
  messagesDiv.innerHTML = '';
  novaOneTime = false;
  messages.forEach(msg => appendMessage(msg.role, msg.text));
}

// Update sidebar
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
  novaOneTime = true;
});

// =============== Eye Follow Effect ===============
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

// ================= OFFLINE PIPELINE =================
const OFFLINE_KB = {
  greetings: [
    "Hey there 👋 I'm Nova — online ho ya offline, always here!",
    "Hello! Nova reporting for duty 🤖",
    "Hi! Kaise ho? Ready when you are 🚀"
  ],
  help: [
    "You can ask for shayari, a joke, motivation, or simple math 🙂",
    "Try: 'shayari', 'tell a joke', '2+2*5', 'motivate me' ✨"
  ],
  shayari: [
    `shayari:
"Zindagi ek kitaab hai, har din ek naya panna,
Seekhna ho toh har lafz ko samajhna."`,
    `shayari:
"Manzilein mil hi jaayengi, gumrah toh rahein sirf raaste,
Hausla rakh, chal pada hai tu, raushan ho jaayengi raatein."`
  ],
  jokes: [
    "😄 Why did the function break up with the loop? It felt it was going in circles!",
    "😂 I told my computer I needed a break, it said: ‘No problem—I’ll go to sleep.’"
  ],
  motivation: [
    "✨ Great things take time. Keep going.",
    "🚀 You’re closer than you think. One more push!"
  ],
};

function norm(s){ return (s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
function detectIntent(text){
  const t = norm(text);
  if (/(hi|hello|hey|namaste)/.test(t)) return 'greetings';
  if (/\b(help|what can you do|features)\b/.test(t)) return 'help';
  if (/\b(shayari|poem|ghazal)\b/.test(t)) return 'shayari';
  if (/\b(joke|funny)\b/.test(t)) return 'jokes';
  if (/\b(motivat|inspire|himmat)\b/.test(t)) return 'motivation';
  if (looksLikeMath(t)) return 'math';
  if (/\b(time|date|today|aaj)\b/.test(t)) return 'time';
  return null;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function looksLikeMath(t){ return /^[\d\.\s\+\-\*\/\%\^\(\)]+$/.test(t) && /[\d]/.test(t); }
function safeEvalMath(expr){
  const sanitized = expr.replace(/\^/g,'**');
  try {
    const val = Function(`"use strict"; return (${sanitized});`)();
    if (typeof val === 'number' && isFinite(val)) return String(val);
    return null;
  } catch { return null; }
}
function timeReply(){ return `🕒 ${new Date().toLocaleString()} (local)`; }
async function offlineRespond(message){
  const intent = detectIntent(message);
  if (intent === 'math'){ 
    const ans = safeEvalMath(message);
    if (ans !== null) return `🧮 ${message} = ${ans}`;
  }
  if (intent === 'time') return timeReply();
  if (intent && OFFLINE_KB[intent]) return pick(OFFLINE_KB[intent]);
  return pick(OFFLINE_KB.help);
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
