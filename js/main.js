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
// State
// =========================
export let currentDecks = [];
export let decksByBracket = {};

// =========================
// Functions
// =========================

/**
 * Fetches player's deck list from their Archidekt folder via our proxy
 * @param {string} folderId The Archidekt folder ID
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of deck objects.
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

        // Filter out decks where the bracket was not successfully mapped
        return userDecks
            .filter(deck => deck.edhBracket !== 'Not Found' && deck.edhBracket != null)
            .map(deck => ({
                id: deck.id,
                name: deck.name,
                // Map the server's edhBracket to the client's expected 'bracket' key
                bracket: deck.edhBracket,
                url: `https://archidekt.com/decks/${deck.id}`,
                // Store color data if available
                colors: deck.colors || null
            }));

    } catch (error) {
        console.error('Error fetching folder decks:', error);
        throw error;
    }
}

/**
 * Fetches detailed deck information including color identity
 * @param {string} deckId The Archidekt deck ID
 * @returns {Promise<Object>} Deck details with color information
 */
export async function fetchDeckDetails(deckId) {
    try {
        const response = await fetch(`https://archidekt.com/api/decks/${deckId}/`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch deck details: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract color identity - usually available in the commander cards
        let colors = { W: 0, U: 0, B: 0, R: 0, G: 0 };
        
        // Try to get color identity from the deck's cards
        if (data.cards && Array.isArray(data.cards)) {
            // Count mana symbols in commander zone cards
            const commanderCards = data.cards.filter(card => 
                card.categories && card.categories.includes('Commander')
            );
            
            if (commanderCards.length > 0) {
                commanderCards.forEach(card => {
                    if (card.card && card.card.oracleCard) {
                        const colorIdentity = card.card.oracleCard.colorIdentity || [];
                        colorIdentity.forEach(color => {
                            if (colors.hasOwnProperty(color)) {
                                colors[color] = 1;
                            }
                        });
                    }
                });
            }
        }
        
        return {
            colors: colors
        };
    } catch (error) {
        console.error('Error fetching deck details:', error);
        // Return default colors if fetch fails
        return {
            colors: { W: 0, U: 0, B: 0, R: 0, G: 0 }
        };
    }
}

/**
 * Organizes the global currentDecks array into decksByBracket map.
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
