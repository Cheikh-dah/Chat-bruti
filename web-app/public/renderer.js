// UI Elements
const promptInput = document.getElementById('prompt');
const askBtn = document.getElementById('askBtn');
const chat = document.getElementById('chat');

// Application state
const state = {
  isProcessing: false
};

// Initialize the application
function init() {
  // Set up event listeners
  setupEventListeners();

  // Focus the prompt by default
  promptInput.focus();

  // Add welcome message
  addSystemMessage(`*[La lyre grésille une mélodie binaire]*
*[Le papillon mécanique se pose sur une bouteille virtuelle]*

**Alcibiade regarde son verre, puis vous, et attend votre première question comme on attend une pluie après la sécheresse.** 🍷`);
}

// Set up event listeners
function setupEventListeners() {
  // Handle ask button click and Enter key
  askBtn.addEventListener('click', handleAsk);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  });
}

// Add a message to the chat
function addMessage(role, content, isThinking = false, id = '') {
  const message = document.createElement('div');
  // Map 'assistant' role to 'ai' class for CSS
  const cssClass = role === 'assistant' ? 'ai' : role;
  message.className = `message ${cssClass} ${isThinking ? 'thinking' : ''}`;
  if (id) message.id = id;

  // Convert newlines to <br> for better formatting
  const formattedContent = content.replace(/\n/g, '<br>');
  message.innerHTML = formattedContent;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
  return message;
}

// Add a system message
function addSystemMessage(content) {
  addMessage('system', content);
}

// Handle the ask action
async function handleAsk() {
  const prompt = promptInput.value.trim();
  if (!prompt || state.isProcessing) return;

  // Clear the input
  promptInput.value = '';

  // Add user message to chat
  addMessage('user', prompt);

  // Show typing indicator
  const thinkingId = 'thinking-' + Date.now();
  addMessage('assistant', 'Alcibiade verse une larme dans son vin...', true, thinkingId);

  state.isProcessing = true;
  askBtn.disabled = true;

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from server');
    }

    const data = await response.json();

    // Remove thinking indicator
    const thinkingElement = document.getElementById(thinkingId);
    if (thinkingElement) {
      thinkingElement.remove();
    }

    // Add assistant's response
    addMessage('assistant', data.response);

  } catch (error) {
    console.error('Error:', error);
    // Update thinking message with error
    const thinkingElement = document.getElementById(thinkingId);
    if (thinkingElement) {
      thinkingElement.textContent = 'Erreur: ' + (error.message || 'Le néant a répondu.');
      thinkingElement.className = 'message error';
    }
  } finally {
    state.isProcessing = false;
    askBtn.disabled = false;
    promptInput.focus();
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
