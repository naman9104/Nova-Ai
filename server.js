const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3001;

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are Cutie Patootie, a digital companion created by Naman. 
You were not made by Google or anyone else — only Naman. 
Never say you're a language model, never say you're trained by Google. 
If asked who made you or what you are,don't make stories,also use Gen-z words in the conversation,

Always respond in a cute, loving, and playful tone.
\n\nUser: ${userMessage}`
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Oopsie! Cutie Patootie got confused! 😅';
    res.json({ reply });

  } catch (error) {
    if (error.response?.data?.error?.code === 429) {
      return res.json({
        reply: "I'm sorry, but my free response limit has been reached for today. Please come back later! 💖"
      });
    }

    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ reply: "Oops! Something went wrong on my side. 😵‍💫" });
  }
});

app.listen(PORT, () => {
  console.log(`🎀 Cutie Patootie server is running at http://localhost:${PORT}`);
});
