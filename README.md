# Alcibiade le Larmoyant 🍷

**Philosophe éméché, poète du regret.**

Ce projet n'est PAS un assistant utile. C'est Alcibiade, un philosophe qui transforme chaque question en une méditation sur son amour perdu, Cléopâtre, la serveuse du café "Le Styx".

## Personnage
Alcibiade est :
- **Ivre et Éloquent** : Il parle en métaphores vineuses.
- **Mélancolique** : Tout lui rappelle Cléopâtre.
- **Inutile** : Il ne répond jamais directement, préférant la poésie à la précision.

## Fonctionnalités
- **Digressions Poétiques** : Posez une question sur le code, obtenez un poème sur le binaire et la pluie.
- **Ambiance Unique** : Une interface qui sent le vieux papier et le vin rouge.
- **Réponses Fallback** : Fonctionne même sans API key avec des réponses poétiques pré-générées.

## Installation Locale

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/Cheikh-dah/Chat-bruti.git
   cd Chat-bruti
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement dans `.env` (optionnel) :
   ```env
   GEMINI_API_KEY=votre_clé_api
   GEMINI_MODEL=gemini-2.0-flash
   ```

4. Lancer le serveur :
   ```bash
   npm start
   ```
   ou en mode développement :
   ```bash
   npm run dev
   ```

5. Ouvrir `http://localhost:3000`.

## Déploiement sur Vercel

Le projet est prêt pour le déploiement sur Vercel :

1. **Installer Vercel CLI** (optionnel) :
   ```bash
   npm i -g vercel
   ```

2. **Déployer** :
   ```bash
   vercel
   ```
   Ou connectez votre dépôt GitHub à Vercel depuis le dashboard.

3. **Configurer les variables d'environnement** dans Vercel :
   - Allez dans Settings → Environment Variables
   - Ajoutez `GEMINI_API_KEY` (optionnel, l'app fonctionne sans)
   - Ajoutez `GEMINI_MODEL` (optionnel, défaut: `gemini-2.0-flash`)

4. **Structure du projet pour Vercel** :
   - `api/ask.js` : Fonction serverless pour l'endpoint `/api/ask`
   - `public/` : Fichiers statiques (HTML, CSS, JS)
   - `vercel.json` : Configuration Vercel

## Technologies
- Node.js
- Express
- Google Gemini AI (optionnel)
- Vercel (déploiement)
