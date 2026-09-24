import OpenAI from "openai";
import { getOpenAIApiKey } from "./config";

let client: OpenAI | null = null;
let clientKey: string | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(
      "Clé API OpenAI manquante ou incomplete. Ouvrez .env.local, mettez votre vraie clé (OPENAI_API_KEY=sk-...), enregistrez, puis relancez demarrer.command."
    );
  }
  if (!client || clientKey !== apiKey) {
    client = new OpenAI({ apiKey });
    clientKey = apiKey;
  }
  return client;
}
