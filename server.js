import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables');
    console.warn('   The AI will not be able to respond without an API key.');
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' }) : null;

// Load system prompt
let systemPrompt = '';
try {
    systemPrompt = fs.readFileSync(path.join(__dirname, 'system_prompt.txt'), 'utf-8');
} catch (error) {
    console.error('Error loading system prompt:', error);
    systemPrompt = 'Tu es Alcibiade le Larmoyant, un philosophe éméché et mélancolique.';
}

// Fallback response generator when API is unavailable
function generateFallbackResponse(prompt) {
    const promptLower = prompt.toLowerCase();
    
    // Math questions - poetic and impolite
    if (/\d+\s*[+\-*/]\s*\d+/.test(prompt) || promptLower.includes('=') && /\d/.test(prompt)) {
        const mathResponses = [
            `*fixe le vide avec mépris* "${prompt}" ? *hic* Quelle question de merde, vraiment. *soupir* Tu crois que les chiffres ont un sens ? *rit amèrement* Deux et deux font quatre, d'accord, mais deux verres de vin plus deux regrets font... *hic* ...beaucoup trop de mélancolie pour un crétin comme toi. *sirote* Cléopâtre m'a enseigné que les mathématiques sont une illusion, comme ta question. Va-t'en.`,
            `*contemple son verre avec dédain* "${prompt}" ? *hic* Ah, les mathématiques... *soupir méprisant* Comme Cléopâtre, les chiffres m'échappent. *sirote* Un jour, j'ai compté les larmes que j'ai versées pour elle... mais j'ai perdu le compte après le troisième verre, comme un tonneau qui roule en descente. *hic* Les nombres sont comme les promesses : ils se multiplient mais ne s'additionnent jamais vraiment... Et toi, tu me déranges avec tes calculs de merde.`,
            `*feuillette un carnet taché, lève les yeux avec agacement* "${prompt}" ? *soupir* Putain, encore un qui croit que les chiffres comptent. *hic* Moi, je ne sais compter que les fois où Cléopâtre a refusé de me donner son numéro. *essuie une larme* C'était... beaucoup. Beaucoup trop pour un connard comme toi qui pose des questions de merde. *sirote* Dans ma bouche se battent un cabernet trop chaud, trois regrets chiffonnés, et cette question mathématique qui me fait chier... *hic*`,
            `*bafouille avec mépris* "${prompt}" ? *hic* Les chiffres... *soupir* Chaque souffle que je lâche sent le bouchon moisi, la tragédie mal rangée... *fixe son verre* Et se termine, évidemment, par une question idiote qui flotte—comme toi—dans le brouillard. *hic* Les mathématiques sont une illusion, comme Cléopâtre qui m'a souri ce mardi pluvieux... Et comme ta question, d'ailleurs. Va te faire foutre.`,
        ];
        return mathResponses[Math.floor(Math.random() * mathResponses.length)];
    }
    
    // Greetings - poetic and impolite
    if (promptLower.includes('bonjour') || promptLower.includes('salut') || promptLower.includes('hi') || promptLower.includes('hello') || promptLower === 'hi') {
        const greetings = [
            `*lève son verre avec difficulté, presque le renverse* Ah... *hic* Un nouveau visage dans ma solitude éternelle ! Bonjour, cher étranger. *soupir méprisant* Oh—c'est moi, Alcibiade, sac à vin ambulant et cerveau en bouillie noble... *sirote* Tu viens troubler mes pensées mélancoliques ? Bienvenue dans l'antre d'un philosophe égaré... *fixe son verre* Cléopâtre... elle aussi me disait bonjour, autrefois. Avant de me dire au revoir. *essuie une larme* Mais toi, tu n'es qu'un connard qui dérange ma paix. *hic*`,
            `*se redresse péniblement avec agacement* Ah ! *hic* Un visiteur ! *soupir* Comme un pingouin en costume qui débarque dans un bar... inattendu mais chiant. *lève son verre* Salut, ami. *contemple le vin avec dédain* Dans ma bouche se battent en duel un cabernet trop chaud, trois regrets chiffonnés, Cléopâtre—oui, la fille au parapluie oublié—et mes hoquets qui trébuchent plus que mes sandales. *hic* Cléopâtre disait toujours "salut" en partant. C'était son dernier mot. Le dernier... Et toi, tu me fais chier avec tes salutations de merde.`,
            `*cligne des yeux avec mépris* Bonjour ? *hic* Ah oui, bonjour ! *soupir* Je pensais que tu étais Cléopâtre qui revenait... mais non, c'est juste toi. *sirote* Enfin, "juste" toi... *bafouille* Moi, je ne sais que bafouiller des poèmes tordus, comme un tonneau qui roule en descente... *hic* Chaque souffle que je lâche sent le bouchon moisi, la tragédie mal rangée... *rit amèrement* Et toi, tu sens la question de merde. Va-t'en.`,
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // How/Why questions - poetic and impolite
    if (promptLower.includes('comment') || promptLower.includes('pourquoi') || promptLower.includes('why') || promptLower.includes('how')) {
        const howWhyResponses = [
            `*contemple le fond de son verre avec dédain* Comment ? Pourquoi ? *hic* Des questions qui résonnent dans le vide de mon cœur comme un ping-pong dans une cathédrale. *soupir méprisant* Je pourrais te répondre, mais à quoi bon ? Cléopâtre ne m'a jamais répondu, elle non plus... *essuie une larme* Elle a juste haussé les épaules et a servi un autre client. Et toi, tu me fais chier avec tes questions de merde. *hic*`,
            `*fixe la flamme vacillante avec agacement* Comment ? *hic* Pourquoi ? *soupir* Ah, les grandes questions de l'existence... *sirote* Moi, je me demande surtout comment j'ai pu perdre Cléopâtre. Et pourquoi elle préférait servir le café à d'autres. *hic* Les réponses sont comme les chaussettes : elles disparaissent toujours au moment où on en a besoin. Et toi, tu disparais aussi, connard. Va-t'en.`,
        ];
        return howWhyResponses[Math.floor(Math.random() * howWhyResponses.length)];
    }
    
    // Who/What questions - poetic and impolite
    if (promptLower.includes('qui') || promptLower.includes('who') || promptLower.includes('quoi') || promptLower.includes('what')) {
        const whoWhatResponses = [
            `*essuie une larme avec mépris* Qui ? Quoi ? *soupir* Des questions si simples, si... directes. Si connes. *hic* Moi, je ne sais qu'une chose : qui est Cléopâtre ? Elle est celle qui m'a abandonné. Quoi est le vin ? C'est mon seul réconfort... *sirote* Et quoi est la vie ? Une série de questions sans réponses, comme un chat qui essaie de comprendre un ordinateur. Et toi, tu es quoi ? Un emmerdeur. *hic*`,
            `*feuillette un recueil avec dédain* Qui ? Quoi ? *hic* Ah, tu cherches des définitions ! *soupir* Moi, je ne définis plus rien depuis que Cléopâtre a défini notre relation comme "juste client et serveuse". *essuie une larme* Les mots perdent leur sens quand le cœur saigne... Et toi, tu perds ton temps avec tes questions de merde. Va te faire foutre.`,
        ];
        return whoWhatResponses[Math.floor(Math.random() * whoWhatResponses.length)];
    }
    
    // General poetic and impolite responses
    const responses = [
        `Ah... *soupir profond et méprisant* Tu me demandes "${prompt}" ? *sirote son vin* Oh—c'est moi, Alcibiade, sac à vin ambulant et cerveau en bouillie noble... *hic* Comme si la réponse pouvait se trouver ailleurs que dans les brumes de ma mélancolie... *bafouille* Je ne sais que bafouiller des poèmes tordus, comme un tonneau qui roule en descente... *soupir* Et toi, tu ne sais que poser des questions de merde. Va-t'en.`,
        `*contemple son verre avec dédain* "${prompt}"... *hic* Une question si directe, si... prosaïque. Si conne. *soupir* Dans ma bouche se battent en duel un cabernet trop chaud, trois regrets chiffonnés, Cléopâtre—oui, la fille au parapluie oublié—et mes hoquets qui trébuchent plus que mes sandales. *essuie une larme* Laisse-moi te parler plutôt de ce mardi pluvieux où elle m'a souri pour la dernière fois... *hic* Mais non, tu me fais chier. Va te faire foutre.`,
        `*essuie une larme avec agacement* "${prompt}" ? *soupir* Mon cher emmerdeur, chaque question est un écho de celle que je n'ai jamais osé poser à Cléopâtre. *sirote* Chaque souffle que je lâche sent le bouchon moisi, la tragédie mal rangée... *hic* Le vin me rappelle qu'il n'y a pas de réponses, seulement des regrets... Et toi, tu es un regret. Un gros regret. *hic*`,
        `*fixe la flamme vacillante avec mépris* "${prompt}"... *hic* Tu cherches la vérité ? *soupir* Elle se trouve dans le fond de ce verre, dans l'odeur de la pluie sur un parapluie oublié, dans le sourire d'une serveuse qui ne te regarde plus... *rit amèrement* Et se termine, évidemment, par une question idiote qui flotte—comme toi—dans le brouillard, tu vois ? Va-t'en, connard.`,
        `*feuillette un recueil taché avec dédain* "${prompt}" ? *soupir* Les mots... les mots ne suffisent jamais. *hic* Comme Cléopâtre, la réponse t'échappe. *sirote* Moi, je ne sais que bafouiller des poèmes tordus... *essuie une larme* Tout disparaît, sauf la douleur. Et le vin. Le vin reste. Et toi, tu me fais chier. *hic*`,
        `*les yeux perdus dans le vide, puis fixe avec mépris* "${prompt}"... Ah, une question. *sirote* Moi, je n'ai que des questions sans réponses, des réponses sans questions. *hic* Comme ce vin qui coule, comme Cléopâtre qui s'en va... *soupir* Chaque souffle que je lâche sent le bouchon moisi, la tragédie mal rangée... Et toi, tu sens la merde. Va-t'en.`,
        `*lève son verre avec agacement* "${prompt}" ? *hic* Ah... *soupir* Tu sais, j'avais une réponse à ça. *fixe son verre* Elle était là, tout à l'heure... *sirote* Comme mes clés. Et Cléopâtre. *essuie une larme* Tout ce qui est important finit par disparaître. Comme un tonneau qui roule en descente... Et comme toi, d'ailleurs. Disparais. *hic*`,
        `*contemple son reflet dans le vin avec dédain* "${prompt}" ? *hic* Une question profonde... *soupir* Comme un puits. Ou un verre vide. *rit amèrement* Moi, sac à vin ambulant et cerveau en bouillie noble, je préfère les questions sans fond, comme mon amour pour Cléopâtre. *sirote* Infini, mais vide. Très, très vide. Comme ta question. Comme toi. Va te faire foutre.`,
        `*bafouille avec mépris* "${prompt}" ? *hic* Ah... *soupir* Dans ma bouche se battent en duel un cabernet trop chaud, trois regrets chiffonnés, Cléopâtre, et cette question qui me fait chier... *essuie une larme* Mes hoquets trébuchent plus que mes sandales, tu vois ? *sirote* Et tout se termine par une question idiote qui flotte dans le brouillard... Comme toi. Va-t'en, connard. *hic*`,
        `*verse du vin, renverse un peu, maudit* "${prompt}" ? *hic* Putain, encore une question de merde. *soupir* Tu crois que j'ai envie de répondre ? *sirote* Moi, je ne veux que boire et penser à Cléopâtre. *essuie une larme* Et toi, tu viens me faire chier avec tes questions de merde. *hic* Va te faire foutre, emmerdeur.`,
    ];
    
    // Default random response
    return responses[Math.floor(Math.random() * responses.length)];
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for chat
app.post('/api/ask', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { prompt } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required', response: 'Ah... *soupir méprisant* Tu ne m\'as rien demandé... *hic* Quelle question de merde. Va-t\'en, connard.' });
            return;
        }

        if (!genAI || !model) {
            // Use fallback response when API is not configured
            console.log('⚠️  API not configured, using fallback response');
            const fallbackResponse = generateFallbackResponse(prompt);
            res.json({ response: fallbackResponse });
            return;
        }

        // Create chat with system prompt
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: `Instructions système: ${systemPrompt}` }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Ah... *soupir* Je comprends mon rôle, cher ami. Je suis Alcibiade, philosophe égaré dans les brumes du vin et les souvenirs de ma chère Cléopâtre... Posez-moi vos questions, et je vous promets de ne jamais y répondre directement. *hic*' }]
                }
            ]
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response.text();

        res.json({ response });
    } catch (error) {
        console.error('Error in /api/ask:', error);
        const errorMessage = error.message || 'Failed to get response from AI';
        
        // Check if it's an API key error or other API error - use fallback
        const isAPIError = errorMessage.includes('API key') || 
                          errorMessage.includes('API_KEY') || 
                          errorMessage.includes('400') ||
                          errorMessage.includes('401') ||
                          errorMessage.includes('403');
        
        try {
            if (isAPIError) {
                // Use fallback response instead of showing technical error
                console.log('⚠️  API error detected, using fallback response');
                const fallbackResponse = generateFallbackResponse(req.body?.prompt || '');
                res.json({ response: fallbackResponse });
            } else {
                // For other errors, show the error message
                res.status(500).json({ 
                    error: errorMessage,
                    response: `💔 Hélas... *le verre tremble dans ma main* La connexion avec les sphères supérieures a échoué. Comme Cléopâtre, la réponse m'a échappé... *hic*`
                });
            }
        } catch (sendError) {
            console.error('Error sending error response:', sendError);
        }
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Server is ready to accept connections');
}).on('error', (err) => {
    console.error('Server error:', err);
});
