// Array to hold current chat messages
let messages = [];

// To track the current chat's unique ID (used when saving/loading)
let currentChatId = null;

// Get chat counter from localStorage or initialize to 0
let chatCounter = localStorage.getItem('chatCounter') || 0;

// DOM Elements
const bowButton = document.getElementById("bow-button");         // Top-left toggle button (🎯 icon) to open/close sidebar
const sidebar = document.getElementById("sidebar");               // The sidebar that shows saved chats
const chatList = document.getElementById("chat-list");            // Container inside sidebar for listing previous chats
const messagesDiv = document.getElementById("messages");          // Main chat display area
const userInput = document.getElementById("user-input");          // Input box where user types their message
const sendButton = document.getElementById("send-button");        // Send button for submitting a message
const newChatBtn = document.getElementById("new-chat");           // Button to start a new chat

// Function to add a message to chat (user or bot)
function addMessage(role, text) {
  messages.push({ role, text });  // Add to messages array

  // Create and style a new div for the message
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;  // class = 'message user' or 'message bot'
  msgDiv.innerText = text;

  // Append to chat view and scroll down
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Save current chat into localStorage
function saveCurrentChat() {
  if (messages.length > 0) {
    const id = currentChatId || `chat_${++chatCounter}`;  // If no ID yet, make a new one
    localStorage.setItem(id, JSON.stringify(messages));   // Save chat messages
    localStorage.setItem("chatCounter", chatCounter);     // Save updated counter
    currentChatId = id;                                   // Set current chat ID
    loadChatList();                                       // Refresh sidebar chat list
  }
}

// Load a saved chat by ID from localStorage
function loadChat(id) {
  const stored = localStorage.getItem(id);
  if (!stored) return;

  messages = JSON.parse(stored);         // Restore messages
  currentChatId = id;                    // Set as active chat
  messagesDiv.innerHTML = '';           // Clear current chat display
  messages.forEach(msg => addMessage(msg.role, msg.text)); // Re-render messages
}

// Update sidebar with list of saved chats
function loadChatList() {
  chatList.innerHTML = ''; // Clear previous entries

  for (let i = 1; i <= chatCounter; i++) {
    const id = `chat_${i}`;
    if (localStorage.getItem(id)) {
      // Create a clickable chat entry
      const entry = document.createElement('div');
      entry.className = 'chat-entry';
      entry.innerText = `Chat ${i}`;
      entry.onclick = () => loadChat(id);  // Load chat when clicked
      chatList.appendChild(entry);         // Add to sidebar
    }
  }
}

// When Send button is clicked
sendButton.onclick = () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);     // Show user's message
  userInput.value = '';         // Clear input

  // Simulated bot response
  setTimeout(() => {
    const reply = `Awww 💖 that's so sweet! You said: "${text}"`;
    addMessage("bot", reply);
  }, 500);
};

// When New Chat button is clicked
newChatBtn.onclick = () => {
  saveCurrentChat();          // Save current chat before clearing
  messages = [];              // Reset chat memory
  currentChatId = null;       // Clear current chat ID
  messagesDiv.innerHTML = ''; // Clear chat display
};

// Toggle sidebar open/close when 🎯 button is clicked
bowButton.onclick = () => {
  sidebar.classList.toggle("open");
};

// Load saved chat list on page load
loadChatList();
