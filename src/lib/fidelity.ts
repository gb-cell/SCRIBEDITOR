import { getModel } from "./config";
import { getOpenAIClient } from "./openai";

/**
 * Résultat du contrôle de fidélité.
 * `passagesAVerifier` prépare l'architecture pour un futur signalement UI
 * « Passage à vérifier » (Phase ultérieure).
 */
export type FidelityResult = {
  correctedText: string;
  passagesAVerifier: string[];
};

const FIDELITY_SYSTEM = `Tu es un contrôleur de fidélité éditoriale pour des verbatims journalistiques (courses hippiques, élevage, filière).

Priorité absolue : FIDÉLITÉ > élégance.

Compare le TEXTE PRODUIT au TRANSCRIPT ORIGINAL.

Corrige les erreurs CLAIRES de fidélité dans le texte produit :
- faits inventés ou déformés ;
- informations présentes SEULEMENT dans les questions du journaliste et placées dans la bouche de l'intervenant (ex. détails de la question non confirmés dans la réponse) ;
- formulations encore à la 3ᵉ personne du type « Il explique que… », « Elle dit que… » alors que le mode demandé est un verbatim à la 1ʳᵉ personne : transforme-les en 1ʳᵉ personne SI le sens est clair, sinon laisse et signale ;
- nuances de certitude transformées en affirmations (« peut-être » → affirmation certaine, etc.) ;
- citations ou propos non présents dans l'original.

Règles strictes :
- Si le texte produit est déjà fidèle et déjà à la 1ʳᵉ personne, renvoie-le STRICTEMENT INCHANGÉ dans correctedText.
- Ne « polish » pas, ne reformule pas pour le style.
- Ne raccourcis pas le texte sans raison de fidélité.
- Ne rajoute aucune information absente de l'original.

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "correctedText": "texte corrigé (ou le texte produit si aucune correction)",
  "passagesAVerifier": ["extrait ambigu 1", "..."]
}`;

/**
 * Second appel LLM : compare résultat vs original, corrige les erreurs claires.
 * En cas de doute ou de réponse douteuse, on conserve le texte produit.
 */
export async function runFidelityCheck(
  originalTranscript: string,
  producedText: string
): Promise<FidelityResult> {
  const client = getOpenAIClient();
  const model = getModel();

  const userContent = [
    "=== TRANSCRIPT ORIGINAL ===",
    originalTranscript,
    "",
    "=== TEXTE PRODUIT ===",
    producedText,
  ].join("\n");

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: FIDELITY_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) {
    return { correctedText: producedText, passagesAVerifier: [] };
  }

  try {
    const parsed = JSON.parse(raw) as {
      correctedText?: unknown;
      passagesAVerifier?: unknown;
    };

    const candidate =
      typeof parsed.correctedText === "string" && parsed.correctedText.trim()
        ? parsed.correctedText.trim()
        : producedText;

    const correctedText = preferProducedIfSuspicious(producedText, candidate);

    const passagesAVerifier = Array.isArray(parsed.passagesAVerifier)
      ? parsed.passagesAVerifier.filter(
          (p): p is string => typeof p === "string" && p.trim().length > 0
        )
      : [];

    return { correctedText, passagesAVerifier };
  } catch {
    return { correctedText: producedText, passagesAVerifier: [] };
  }
}

/**
 * Si le contrôle de fidélité a trop tronqué ou vidé le texte, on garde le 1ᵉʳ passage.
 */
function preferProducedIfSuspicious(
  produced: string,
  corrected: string
): string {
  if (!corrected.trim()) return produced;
  if (corrected.length < produced.length * 0.6) return produced;
  return corrected;
}
