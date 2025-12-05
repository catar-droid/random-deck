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
const response = await fetch(`https://archidekt.com/folders/${folderId}`, {
  // provide user agent information to prevent target server blocking request
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch deck ${deckId}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---

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
    
    // 1. Locate and Extract the __NEXT_DATA__ JSON string
    // This is the functional replacement for Cheerio's $('#__NEXT_DATA__').html()
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);

    if (!match || match.length < 2) {
      return res.status(500).json({ error: 'Could not find or extract NEXT_DATA script content' });
    }
    
    // The JSON string is in the second element of the match array
    const dataText = match[1].trim(); 
    
    // 2. Parse the JSON
    const nextData = JSON.parse(dataText);

    // 3. Extract the required deck information
    const userDecks = nextData?.props?.pageProps?.folder?.decks || [];
    
    if (!userDecks || !Array.isArray(userDecks)) {
      return res.status(500).json({ error: 'Invalid deck data structure or deck list is empty' });
    }

    const deckInfo = userDecks.map(deck => ({
      name: deck.name,
      // handle situation when user didnt provide bracket
      edhBracket: deck.bracketNumber || 'Not Found'
    }));

    // 4. Send the result back to the client
    res.json({ decks: deckInfo });

  } catch (err) { 
    // Handle parsing errors, network errors, etc.
    res.status(500).json({ error: `Server-side error: ${err.message}` });
  } 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server listening on port ${PORT}`));
