const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const app = express();

// Allow CORS from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

/**
 * Proxy endpoint: /api/decks/:deckId
 * Fetches individual deck data
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

/**
 * Proxy endpoint: /api/folders/:folderId
 * Fetches folder page HTML to extract deck list
 */
app.get('/api/folders/:folderId', async (req, res) => {
  const { folderId } = req.params;
  try {
    const response = await fetch(`https://archidekt.com/folders/${folderId}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch folder ${folderId}` });
    }
    const html = await response.text();
    
    // Extract the Next.js data
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    
    if (!scriptMatch) {
      return res.status(500).json({ error: 'Could not find deck data in folder page' });
    }

    const jsonData = JSON.parse(scriptMatch[1]);
    const userDecks = jsonData?.props?.pageProps?.user?.decks;

    if (!userDecks || !Array.isArray(userDecks)) {
      return res.status(500).json({ error: 'Invalid deck data structure' });
    }

    // Return the decks array
    res.json({ decks: userDecks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
