const { contextBridge, ipcRenderer } = require('electron');

// Conversation management
let currentConversation = {
  id: `conv_${Date.now()}`,
  history: [],
  config: {
    reasoningMode: 'cot', // cot, tot, react, dppm, mcts
    memoryWindow: 10,     // Number of messages to keep in context
    useRAG: true,         // Enable/disable RAG
  }
};

contextBridge.exposeInMainWorld('ai', {
  // Main AI interaction
  ask: async (prompt, text) => {
    const res = await ipcRenderer.invoke('ai:ask', { 
      prompt, 
      text,
      conversationId: currentConversation.id,
      config: currentConversation.config
    });
    
    if (res.ok) {
      currentConversation.history.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: res.text }
      );
      
      // Trim history to configured window size
      if (currentConversation.history.length > currentConversation.config.memoryWindow * 2) {
        currentConversation.history = currentConversation.history.slice(-currentConversation.config.memoryWindow * 2);
      }
    }
    
    return res;
  },
  
  // Conversation management
  startNewConversation: () => {
    currentConversation = {
      id: `conv_${Date.now()}`,
      history: [],
      config: { ...currentConversation.config } // Copy existing config
    };
    return currentConversation.id;
  },
  
  // Configuration
  updateConfig: (newConfig) => {
    currentConversation.config = { 
      ...currentConversation.config, 
      ...newConfig 
    };
    return currentConversation.config;
  },
  
  // Status updates
  onStatus: (callback) => {
    const handler = (event, message) => callback(message);
    ipcRenderer.on('ai:status', handler);
    return () => ipcRenderer.removeListener('ai:status', handler);
  }
});

contextBridge.exposeInMainWorld('env', {
  version: '1.1.0',
  features: ['memory', 'reasoning', 'rag']
});
