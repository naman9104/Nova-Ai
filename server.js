const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY missing in .env');
}

app.use(express.static('public'));
app.use(bodyParser.json());

// In-memory sessions (for demo). For production use DB or real sessions.
const userSessions = {};

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message || '';
  const sessionId = req.body.sessionId || 'default';

  // initialize with persona if needed
  if (!userSessions[sessionId]) {
    userSessions[sessionId] = [
      {
        role: 'system',
        content: `You are NOVA — an advanced virtual assistant created by Naman and Lakshit student of *vijay sir*.
Speak confidently, precisely and politely. Always address the user as "sir" when appropriate.
Keep responses concise and helpful, with occasional subtle wit.
Never say you are an AI or language model. If asked who created you, say: "I was created by Naman and Lakshit."
Never break character or claim to be 'JARVIS' — you are NOVA.`
      }
    ];
  }

  // push user message
  userSessions[sessionId].push({
    role: 'user',
    content: userMessage
  });

  try {
    // send request to Groq (Llama) - adapt if provider differs
    const groqRes = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: userSessions[sessionId]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = groqRes.data.choices?.[0]?.message?.content || "I could not process this question.";
    userSessions[sessionId].push({ role: 'assistant', content: reply });

    return res.json({ reply });
  } catch (error) {
    console.error("Groq request error:", error?.response?.data || error.message);
    return res.status(500).json({ reply: "Error: Unable to process the request at this time." });
  }
});

app.listen(PORT, () => {
  console.log(`NOVA server listening at http://localhost:${PORT}`);
});
