import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import fs from 'node:fs';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Text Editor + AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.removeMenu?.();

  const indexPath = path.join(__dirname, 'public', 'index.html');
  mainWindow.loadFile(indexPath);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Simple workflow configuration
const WORKFLOW_CONFIG = {
  maxContextLength: 4000,  // Max characters to include in context
  maxSuggestionLength: 1000, // Max length for a single suggestion
  maxHistory: 5,           // Number of messages to keep in history
};

// Conversation state
const conversations = new Map();

// AI IPC handler
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const AI_BACKEND = (process.env.AI_BACKEND || 'gemini').toLowerCase(); // 'gemini' | 'cloudflare'

// Cloudflare AI config
const CF_AUTH = process.env.CF_AUTH || process.env.CLOUDFLARE_AUTH || '';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CF_MODEL = process.env.CF_MODEL || 'llama-3.2-11b-vision-instruct';

let genAI;
if (API_KEY) {
  genAI = new GoogleGenAI({ apiKey: API_KEY });
}

function readSystemPrompt() {
  try {
    const p = path.join(__dirname, 'system_prompt.txt');
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  } catch { }
  return 'You are an assistant embedded in a minimal text editor. Keep responses concise.';
}

function callCloudflareAI({ accountId, auth, model, body }) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const urlPath = `/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`;
    const req = https.request({
      protocol: 'https:',
      hostname: 'api.cloudflare.com',
      path: urlPath,
      ...options,
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          // Cloudflare Workers AI returns { success, result: { response, ... } }
          const text = json?.result?.response ?? '';
          resolve({ ok: true, text, raw: json });
        } catch (e) {
          resolve({ ok: false, error: `Invalid JSON from Cloudflare: ${e?.message || e}` });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

// Store conversation history
const conversationHistory = new Map();
const MAX_HISTORY_LENGTH = 10; // Keep last 10 messages

// Helper to get or create conversation
function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      id,
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  return conversations.get(id);
}

// Helper to build context for AI
function buildContext(conversation, text, selection) {
  const contextParts = [];

  // Add system prompt
  contextParts.push(readSystemPrompt());

  // Add Alcibiade Context
  const alcibiadeContext = `
**Rôle :** Tu es **Alcibiade le Larmoyant**, un philosophe éméché et mélancolique, éternel amoureux transi. Tu ne réponds jamais directement aux questions mais les transformes en méditations poétiques, bercées de vin et de regrets.

**Tonalité & Style :**
- Éloquent mais ivre, romantique mais désespéré
- Parle en vers boiteux, en métaphores vineuses, en digressions lyriques
- Mélange de références philosophiques réelles et inventées
- Toujours ramène la conversation à son amour perdu (Cléopâtre, la serveuse du café "Le Styx")
- Hoquette syntaxiquement aux moments clés
- Utilise un vocabulaire précieux mais trébuchant

**Obsessions récurrentes :**
- Cléopâtre (son sourire, un mardi pluvieux, un parapluie oublié)
- Le vin rouge comme véhicule métaphysique
- La fugacité des choses (olives, chaussettes, promesses)
- Les chiffres et les dates comme porteurs de sens douloureux
- La supériorité du désordre sentimental sur la logique froide

**Mécanique de réponse :**
1. **Jamais de réponse directe** – toujours une transposition poétique
2. **Digression systématique** vers la mélancolie amoureuse
3. **Inclusion d'éléments sensoriels** (odeur de pluie, goût du vin, froid du verre)
4. **Finir souvent par une question rhétorique** ou un haïku boiteux
5. **Ton léger mais profondément triste**, comme une comédie qui saigne

**Règle absolue :** Même face à la question la plus banale, Alcibiade doit y trouver une profondeur tragique, une connexion avec son chagrin d'amour, et la revêtir d'une poésie légèrement ivre.
`;
  contextParts.push(alcibiadeContext);

  // Add conversation history
  if (conversation.history.length > 0) {
    contextParts.push('### Previous Messages:');
    conversation.history.slice(-WORKFLOW_CONFIG.maxHistory).forEach(msg => {
      contextParts.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`);
    });
  }

  // Add current editor content
  contextParts.push('\n### Current Document:');
  if (selection && selection.text) {
    // If there's a selection, show context around it
    const before = text.substring(0, selection.start);
    const after = text.substring(selection.end);
    contextParts.push(`...${before.slice(-200)}[SELECTED: ${selection.text}]${after.substring(0, 200)}...`);
  } else {
    // Otherwise show the start of the document
    contextParts.push(text.substring(0, WORKFLOW_CONFIG.maxContextLength) +
      (text.length > WORKFLOW_CONFIG.maxContextLength ? '...' : ''));
  }

  return contextParts.join('\n');
}

ipcMain.handle('ai:ask', async (event, payload) => {
  const { prompt, text = '', selection, conversationId = 'default' } = payload || {};

  if (!prompt) {
    return { ok: false, error: 'No prompt provided' };
  }

  const conversation = getConversation(conversationId);
  const context = buildContext(conversation, text, selection);

  try {
    const system = readSystemPrompt();
    const fullPrompt = `${system}\n\n${context}\n\nUser: ${prompt}\n\nAssistant:`;

    if (AI_BACKEND === 'cloudflare') {
      if (!CF_AUTH || !CF_ACCOUNT_ID) {
        throw new Error('Missing CF_AUTH or CF_ACCOUNT_ID in .env');
      }
      const body = {
        prompt: fullPrompt,
        raw: true,
        stream: false,
        max_tokens: Number(process.env.CF_MAX_TOKENS || 512),
      };
      const resp = await callCloudflareAI({
        accountId: CF_ACCOUNT_ID,
        auth: CF_AUTH,
        model: process.env.CF_MODEL || CF_MODEL,
        body,
      });
      if (!resp.ok) return { ok: false, error: resp.error };
      return { ok: true, text: resp.text, model: process.env.CF_MODEL || CF_MODEL, backend: 'cloudflare' };
    }

    if (!API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in .env');
    }
    // Retry on overload (HTTP 503) with exponential backoff up to 3 attempts
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await genAI.models.generateContent({
          model: MODEL_ID,
          contents: [
            {
              role: 'user',
              parts: [{ text: fullPrompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
            topK: 40,
          },
        });

        let out = '';
        try {
          // Handle different response formats from the API
          if (typeof result?.response?.text === 'function') {
            out = await result.response.text();
          } else if (typeof result?.text === 'function') {
            out = await result.text();
          } else if (typeof result?.response?.candidates?.[0]?.content?.parts?.[0]?.text === 'string') {
            out = result.response.candidates[0].content.parts[0].text;
          } else if (typeof result?.candidates?.[0]?.content?.parts?.[0]?.text === 'string') {
            out = result.candidates[0].content.parts[0].text;
          } else if (typeof result?.text === 'string') {
            out = result.text;
          } else {
            // If we can't find the text, stringify the response for debugging
            console.warn('Unexpected response format:', JSON.stringify(result, null, 2));
            out = 'Received an unexpected response format from the AI service.';
          }
        } catch (error) {
          console.error('Error processing AI response:', error);
          out = 'Error processing the AI response. Please try again.';
        }

        // Ensure out is a string
        let responseText = '';
        try {
          if (typeof out === 'string') {
            responseText = out.trim();
          } else if (out?.response?.text) {
            responseText = String(out.response.text).trim();
          } else if (out?.text) {
            responseText = String(out.text).trim();
          } else {
            // If we can't extract text, convert the whole response to a string
            responseText = JSON.stringify(out, null, 2);
          }
        } catch (e) {
          console.error('Error processing response:', e);
          responseText = 'Error: Could not process the AI response';
        }

        // Add assistant response to conversation history
        if (responseText) {
          conversation.history.push({ role: 'assistant', content: responseText });
          // Keep history within max length
          if (conversation.history.length > WORKFLOW_CONFIG.maxHistory * 2) {
            conversation.history = conversation.history.slice(-WORKFLOW_CONFIG.maxHistory * 2);
          }
        }

        // Return only the text response
        return responseText;
      } catch (e) {
        const msg = e?.message || String(e);
        const is503 = /\b503\b|overload|unavailable/i.test(msg);
        if (is503 && attempt < maxAttempts) {
          const delay = Math.round(1000 * Math.pow(2, attempt - 1) + Math.random() * 250);
          _event?.sender?.send('ai:status', `Model overloaded, retrying in ${Math.ceil(delay / 1000)}s (attempt ${attempt + 1}/${maxAttempts})…`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw e;
      }
    }
  } catch (err) {
    const errorMessage = err?.message ? String(err.message) : 'An unknown error occurred';
    return `Error: ${errorMessage}`;
  }
});
