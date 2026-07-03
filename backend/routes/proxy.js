// ─── routes/proxy.js ────────────────────────────────────────
// Env proxy routes. All external API calls go through here
// so that API keys are NEVER exposed to the frontend.
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { env } = require('../envProxy');

// ─── POST /api/proxy/imgbb ─────────────────────────────────
// Proxies image upload to imgbb
router.post('/imgbb', async (req, res) => {
  if (!env.IMGBB_API_KEY) {
    return res.status(503).json({ error: 'imgbb API key not configured' });
  }

  try {
    const { image, name } = req.body;

    const formData = new URLSearchParams();
    formData.append('key', env.IMGBB_API_KEY);
    formData.append('image', image); // base64 encoded image
    if (name) formData.append('name', name);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('imgbb proxy error:', err.message);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// ─── POST /api/proxy/groq ──────────────────────────────────
// Proxies LLM calls to Groq (in case frontend needs conversational features)
router.post('/groq', async (req, res) => {
  if (!env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'Groq API key not configured' });
  }

  try {
    const { prompt, systemPrompt } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    res.json({
      message: data.choices?.[0]?.message?.content || 'No response generated.',
    });
  } catch (err) {
    console.error('Groq proxy error:', err.message);
    res.status(500).json({ error: 'LLM request failed' });
  }
});

module.exports = router;
