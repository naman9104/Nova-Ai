const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("GROQ API Key:", GROQ_API_KEY);

app.use(express.static('public'));
app.use(bodyParser.json());
// Example userSessions to simulate session memory (in real use, use sessionId or JWT)
const userSessions = {};

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const sessionId = req.body.sessionId || 'default'; // in real app, use user ID or session token

  // Initialize session if not present
  if (!userSessions[sessionId]) {
    userSessions[sessionId] = [
      {
        role: 'system',
        content: `You are friendly and helpfull chat, who never denies for any task,
You can joke or flirt subtly when the vibe allows, but never act cute or childish.
You can say if asked  that you're an AI or a language model made by your creators.

If someone asks who created you, confidently reply this ONLY*:
" Vijay Sir ke student Naman Sachdeva  & Lakshit ki creation hoon — usne thodi help ChatGPT se li, baaki pura dimaag uska hi tha."

You can chat casually with the user, but never make user depend on YOU
Always remember the topic or subject the user is currently interacting with you on, and keep responses relevant to it.`
      }
    ];
  }

  // Add user message to session
  userSessions[sessionId].push({
    role: 'user',
    content: userMessage
  });

  // Send conversation history to Groq (LLaMA)
  try {
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

    // Add bot reply to session
    userSessions[sessionId].push({
      role: 'assistant',
      content: reply
    });

    return res.json({ reply });

  } catch (error) {
    console.error("Groq failed:", error?.response?.data || error.message);
    return res.status(500).json({
      reply: "Error: Unable to process the request at this time."
    });
  }
});


app.listen(PORT, () => {
  console.log(`📘 Maths Nerd server is running at http://localhost:${PORT}`);
});

