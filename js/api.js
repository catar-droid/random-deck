// =========================
// API.JS
// =========================
/**
* Contains all network fetching, data transformation, and utility functions that don't directly touch the DOM.
*/


// =========================
// Configuration
// =========================
export const proxyUrl = 'https://random-deck.onrender.com';

export const playerFolderIds = {
    catar: '397706',
    timmsen: '966685',
    failbob: '966113'
};

// =========================
// Data Fetching & Processing Functions
// =========================

/**
 * Fetches and processes player's deck list from their Archidekt folder via our proxy.
 * Filters out decks without a valid bracket.
 * @param {string} folderId The Archidekt folder ID
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of processed deck objects.
 */
export async function fetchPlayerDecksFromFolder(folderId) {
    try {
        const response = await fetch(`${proxyUrl}/api/folders/${folderId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch folder: ${response.status}`);
        }

        const data = await response.json();
        const userDecks = data.decks;

        if (!userDecks || !Array.isArray(userDecks)) {
            throw new Error('Invalid deck data structure');
        }

        return userDecks
            .filter(deck => deck.edhBracket !== 'Not Found' && deck.edhBracket != null)
            .map(deck => ({
                id: deck.id,
                name: deck.name,
                // Map the server's edhBracket to the client's expected 'bracket' key
                bracket: deck.edhBracket,
                url: `https://archidekt.com/decks/${deck.id}`,
                // Keep the color data if the server provided it
                colors: deck.colors || null 
            }));

    } catch (error) {
        console.error('Error fetching folder decks:', error);
        throw error;
    }
}

/**
 * Organizes a flat deck array into a map keyed by the deck's bracket number.
 * @param {Array<Object>} decks
 * @returns {Object} A map of { 'bracket': [decks] }
 */
export function organizeDecksByBracket(decks) {
    const organizedDecks = {};
    decks.forEach(deck => {
        const bracket = deck.bracket;
        if (!organizedDecks[bracket]) organizedDecks[bracket] = [];
        organizedDecks[bracket].push(deck);
    });
    return organizedDecks;
}

/**
 * Picks a random deck from a specific bracket.
 * @param {string} bracket 
 * @param {Object} organizedDecks
 * @returns {Object|null} A random deck object, or null.
 */
export function selectRandomDeck(bracket, organizedDecks) {
    const decks = organizedDecks[bracket];
    if (!decks || decks.length === 0) {
        return null;
    }
    return decks[Math.floor(Math.random() * decks.length)];
}

// NOTE: The fetchDeckDetails function from your prompt has been omitted 
// from the refactored api.js because it was not being used by main.js, 
// maintaining a focus on cleaning up unused code. 
// If you need it, add it back and use it within main.js/loadPlayerDecks.
