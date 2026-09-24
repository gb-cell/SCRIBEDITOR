/**
 * Configuration centralisée du modèle OpenAI.
 * Modifier MODEL dans .env.local pour changer le modèle partout.
 */
export function getModel(): string {
  return process.env.MODEL?.trim() || "gpt-4o";
}

const PLACEHOLDER_KEYS = new Set([
  "",
  "sk-...",
  "sk-votre-cle",
  "sk-your-key",
]);

/** Retourne la clé si elle est réelle ; undefined si absente ou placeholder. */
export function getOpenAIApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key) || key.includes("...")) {
    return undefined;
  }
  return key;
}

/** Taille cible (caractères) avant regroupement de chunks conversationnels. */
export const CHUNK_TARGET_CHARS = 3500;

/** Seuil au-delà duquel on force une coupure même au sein d'un même thème. */
export const CHUNK_HARD_MAX_CHARS = 6000;
