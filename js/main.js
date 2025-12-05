import { 
    playerFolderIds, 
    fetchPlayerDecksFromFolder, 
    organizeDecksByBracket, 
    selectRandomDeck 
} from './api.js';

// =========================
// Global State
// =========================
let currentDecks = [];
let decksByBracket = {};

// =========================
// DOM Elements
// =========================
const playerSelect = document.getElementById('playerSelect');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const bracketSection = document.getElementById('bracketSection');
const bracketGrid = document.getElementById('bracketGrid');
const resultDiv = document.getElementById('result');
const statsCard = document.getElementById('statsCard');
const statsGrid = document.getElementById('statsGrid');
const statsTotal = document.getElementById('statsTotal');

// =========================
// UI Helpers
// =========================
function resetUI() {
    currentDecks = [];
    decksByBracket = {};
    bracketGrid.innerHTML = '';
    bracketSection.classList.add('hidden');
    resultDiv.innerHTML = '';
    statsCard.classList.add('hidden');
    hideError();
}
function showLoading() { loadingDiv.classList.remove('hidden'); }
function hideLoading() { loadingDiv.classList.add('hidden'); }
function showError(msg) { errorDiv.textContent = msg; errorDiv.classList.remove('hidden'); }
function hideError() { errorDiv.classList.add('hidden'); }
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =========================
// Rendering Functions
// =========================

function renderBrackets() {
    bracketGrid.innerHTML = '';
    bracketSection.classList.remove('hidden');

    Object.keys(decksByBracket).sort((a, b) => a - b).forEach(bracket => {
        const btn = document.createElement('button');
        btn.className = 'bracket-btn';
        btn.innerHTML = `
            <div class="bracket-number">${bracket}</div>
            <div class="bracket-count">${decksByBracket[bracket].length} decks</div>
        `;
        btn.addEventListener('click', () => handleDeckSelection(bracket));
        bracketGrid.appendChild(btn);
    });
}

function renderStats() {
    statsGrid.innerHTML = '';
    statsCard.classList.remove('hidden');

    Object.keys(decksByBracket).sort((a, b) => a - b).forEach(bracket => {
        const stat = document.createElement('div');
        stat.innerHTML = `
            <div class="stat-number">${decksByBracket[bracket].length}</div>
            <div class="stat-label">Bracket ${bracket}</div>
        `;
        statsGrid.appendChild(stat);
    });

    statsTotal.innerHTML = 
        `<span style="font-weight: 600;">Total:</span> ${currentDecks.length} decks`;
}

function displayDeck(deck) {
    resultDiv.innerHTML = `
        <div class="result-card">
            <div class="result-header">
                <h2 class="deck-name">${escapeHTML(deck.name)}</h2>
                <span class="bracket-badge">Bracket ${deck.bracket}</span>
            </div>
            <a href="${deck.url}" target="_blank" rel="noopener noreferrer" class="deck-link">
                View on Archidekt →
            </a>
        </div>
    `;
}

// =========================
// Main Logic Handlers
// =========================

async function loadPlayerDecks(username) {
    showLoading();
    hideError();

    try {
        const folderId = playerFolderIds[username];
        if (!folderId) throw new Error('No folder ID found for this player');

        // Fetch decks using the API function
        const decks = await fetchPlayerDecksFromFolder(folderId);

        if (decks.length === 0) {
            throw new Error('No decks found for this player (or none with a valid bracket)');
        }

        currentDecks = decks;
        // Organize decks using the API function
        decksByBracket = organizeDecksByBracket(currentDecks); 
        
        renderBrackets();
        renderStats();
        hideLoading();
    } catch (err) {
        hideLoading();
        showError(`Error loading decks: ${err.message}`);
        console.error(err);
    }
}

function handlePlayerSelection() {
    const username = playerSelect.value;
    resetUI();
    if (!username) return;
    loadPlayerDecks(username);
}

function handleDeckSelection(bracket) {
    const deck = selectRandomDeck(bracket, decksByBracket);
    if (!deck) {
        showError('No decks available in this bracket');
        return;
    }
    displayDeck(deck);
}

// =========================
// Initialization
// =========================
playerSelect.addEventListener('change', handlePlayerSelection);
