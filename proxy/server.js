const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const app = express();

// Allow CORS from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

/**
 * Proxy endpoint: /api/decks/:deckId
 */
app.get('/api/decks/:deckId', async (req, res) => {
  const { deckId } = req.params;

  try {
    const response = await fetch(`https://archidekt.com/api/decks/${deckId}/`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch deck ${deckId}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
