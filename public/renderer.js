// UI Elements
const promptInput = document.getElementById('prompt');
const askBtn = document.getElementById('askBtn');
const chat = document.getElementById('chat');

// Application state
const state = {
  isProcessing: false
};

// Theatrical thinking phrases - more fun and varied
const thinkingPhrases = [
  '🍷 *sirote son vin pensivement*...',
  '🤔 *contemple le fond de son verre*...',
  '💭 *les yeux perdus dans le vide*...',
  '😢 *essuie une larme furtive*...',
  '🌧️ *murmure le nom de Cléopâtre*...',
  '📜 *feuillette un recueil de poèmes tachés de vin*...',
  '🕯️ *fixe la flamme vacillante*...',
  '🍇 *examine une grappe de raisin avec intensité philosophique*...',
  '🐱 *parle à un chat imaginaire*...',
  '☂️ *contemple un parapluie cassé avec mélancolie*...',
  '📞 *regarde son téléphone vide d\'espoir*...',
  '🧦 *philosophe sur une chaussette orpheline*...',
  '☕ *renifle un café froid avec nostalgie*...',
  '🎭 *se regarde dans le reflet de son verre*...',
  '🌙 *murmure des vers à la lune*...',
  '📅 *compte les jours depuis le dernier sourire de Cléopâtre*...',
  '🔮 *consulte un verre de vin comme une boule de cristal*...',
];

// Initialize the application
function init() {
  setupEventListeners();

  // Add theatrical welcome message
  addSystemMessage(`🎭 CHAT-RLATAN DU NUMÉRIQUE 🎭

Bienvenue dans l'antre d'Alcibiade le Larmoyant...
Philosophe du dimanche, poète éméché, amoureux éconduit.

⚠️ AVERTISSEMENT : Ce chatbot est glorieusement inutile.
Il ne répond pas aux questions... il les sublime, les détourne,
et parfois les oublie complètement.

Posez-moi une question, et je vous promets :
• Aucune réponse directe 🚫
• Des digressions lyriques 📜
• Des métaphores vineuses 🍷
• Et beaucoup, beaucoup de Cléopâtre... 💔

*hic* Allons-y, troublez mes pensées mélancoliques !`);

  promptInput.focus();
}

// Set up event listeners
function setupEventListeners() {
  askBtn.addEventListener('click', handleAsk);

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  });
}

// Add a message to the chat with avatar
function addMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;

  // Create avatar
  const avatar = document.createElement('div');
  if (role === 'assistant') {
    const img = document.createElement('img');
    img.src = 'alcibiade.jpeg';
    img.alt = 'Alcibiade';
    img.className = 'message-avatar';
    avatar.appendChild(img);
  } else if (role === 'user') {
    avatar.className = 'message-avatar user-avatar';
    avatar.textContent = '🙋';
  }

  // Create message
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = content;

  if (role !== 'system') {
    wrapper.appendChild(avatar);
    wrapper.appendChild(message);
    chat.appendChild(wrapper);
  } else {
    message.style.alignSelf = 'center';
    chat.appendChild(message);
  }

  chat.scrollTop = chat.scrollHeight;
  return message;
}

// Add a system message
function addSystemMessage(content) {
  return addMessage('system', content);
}

// Get random thinking phrase
function getThinkingPhrase() {
  return thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];
}

// Handle the ask action
async function handleAsk() {
  const prompt = promptInput.value.trim();
  if (!prompt || state.isProcessing) return;

  promptInput.value = '';
  addMessage('user', prompt);

  // Show theatrical thinking indicator
  const thinkingWrapper = document.createElement('div');
  thinkingWrapper.className = 'message-wrapper assistant';
  thinkingWrapper.id = 'thinking-wrapper';

  const avatar = document.createElement('img');
  avatar.src = 'alcibiade.jpeg';
  avatar.alt = 'Alcibiade';
  avatar.className = 'message-avatar';

  const thinkingMsg = document.createElement('div');
  thinkingMsg.className = 'message thinking';
  thinkingMsg.textContent = getThinkingPhrase();

  thinkingWrapper.appendChild(avatar);
  thinkingWrapper.appendChild(thinkingMsg);
  chat.appendChild(thinkingWrapper);
  chat.scrollTop = chat.scrollHeight;

  // Change thinking phrase periodically for theatrical effect
  const thinkingInterval = setInterval(() => {
    thinkingMsg.textContent = getThinkingPhrase();
  }, 2000);

  state.isProcessing = true;
  askBtn.disabled = true;

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        context: ''
      })
    });

    // Try to parse response even if not ok, to get error message from server
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Le vin a troublé la connexion...');
    }

    // Stop thinking animation
    clearInterval(thinkingInterval);
    thinkingWrapper.remove();

    // Display response (even if it's an error response from server)
    if (data.response) {
      addMessage('assistant', data.response);
    } else if (!response.ok) {
      addMessage('assistant', data.error || '💔 Hélas... Le vin a troublé la connexion...');
    } else {
      addMessage('assistant', 'Ah... *hic* ...où en étais-je ? Cléopâtre... oui, Cléopâtre...');
    }

  } catch (error) {
    clearInterval(thinkingInterval);
    console.error('Error:', error);
    thinkingWrapper.remove();
    
    // Better error messages for different error types
    let errorMessage = error.message || 'Le destin m\'accable encore...';
    if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
      errorMessage = 'Le serveur semble avoir sombré dans les brumes... *hic* Vérifiez que le serveur est bien lancé. *soupir* Comme Cléopâtre, il m\'a peut-être abandonné...';
    }
    
    addMessage('assistant', `💔 Hélas... ${errorMessage}`);
  } finally {
    state.isProcessing = false;
    askBtn.disabled = false;
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);