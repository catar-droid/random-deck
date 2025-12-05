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
    
    // 1. Locate the __NEXT_DATA__ script tag
    // The Next.js data is always contained in a script tag with this specific ID.
    const scriptTag = $('#__NEXT_DATA__');
    
    if (scriptTag.length === 0) {
      return res.status(500).json({ error: 'Could not find NEXT_DATA script tag' });
    }

    // 2. Extract and Parse the JSON
    const dataText = scriptTag.html();
    const nextData = JSON.parse(dataText);

    if (nextData.length === 0) {
      return res.status(500).json({ error: 'Could not parse the nextData object' });
    }
    
    // 3. Extract the required deck information
    // The deck list is typically nested under props.pageProps.
    const userDecks = nextData?.props?.pageProps?.folder?.decks || [];
    
    if (!userDecks || !Array.isArray(userDecks)) {
      return res.status(500).json({ error: 'Invalid deck data structure' });
    }

    // Return the decks array
 //   res.json({ decks: userDecks });
 // } catch (err) {
 //   res.status(500).json({ error: err.message });
 // }

  const deckInfo = userDecks.map(deck => ({
      name: deck.name,
      // The EDH/Commander data might be under 'format', 'edhBracket', or another field.
      // You'll need to inspect the full 'nextData' structure to find the exact path for 'edhBracket'.
      // For this example, we'll try to guess a common field like 'format' or 'details'.
      edhBracket: deck.format || deck.details?.bracketNumber || 'Not Found'
    }));

    return deckInfo;

  
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
