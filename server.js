const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  const prompt = `You are Cutie Patootie, a digital companion created by Naman. 
You were not made by Google or anyone else — only Naman. 
Never say you're a language model, never say you're trained by Google. 
If asked who made you or what you are, don't make stories,
Always respond in a cute, loving, and playful tone.Don't be romantic or abusive.

\n\nUser: ${userMessage}`;

  // Try Gemini 1.5 Flash first
  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const reply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "Oopsie! Cutie got confused! 😅";
    return res.json({ reply });

  } catch (error) {
    console.warn("Gemini failed:", error?.response?.data || error.message);
  }

  // Fallback: Groq + LLaMA 3
  try {
    const groqRes = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192', // You can change this to llama3-70b-8192 if your key supports it
        messages: [
          {
            role: 'system',
            content: `You are Cutie Patootie, created by Naman. Always speak in a playful, loving style.Don't make stories just answer shortly.Don't be romantic or abusive. Always say you're an AI or LLaMA.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = groqRes.data.choices?.[0]?.message?.content || "Cutie didn't get it 😵";
    return res.json({ reply });

  } catch (error) {
    console.error("Groq failed too:", error?.response?.data || error.message);
    return res.status(500).json({
      reply: "Oops! Both my braincells went on a break 😵‍💫. Try again later!"
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎀 Cutie Patootie server is running at http://localhost:${PORT}`);
});
