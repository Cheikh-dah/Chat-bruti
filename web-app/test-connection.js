import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

console.log("Testing connection with key ending in:", process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.slice(-4) : "NONE");

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        console.log(`Using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log("Attempting to generate content...");
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Connection Test Failed:");
        console.error("Message:", error.message);
        if (error.cause) {
            console.error("Cause:", error.cause);
        }
    }
}

test();
