import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to handle AI requests
app.post('/api/ask', async (req, res) => {
    try {
        const { prompt, context, selection } = req.body;

        // Alcibiade Context
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

        // Construct the full prompt
        const fullPrompt = `${alcibiadeContext}\n\nUser Question: ${prompt}`;

        // Call the AI model
        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        res.json({
            response: response
        });
    } catch (error) {
        console.error('Error:', error);
        // Fallback if AI fails or no key
        res.json({
            response: "Je ne peux pas répondre pour le moment. Mon esprit est ailleurs, probablement dans une autre dimension. (Erreur: " + error.message + ")"
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
