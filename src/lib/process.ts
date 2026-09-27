import { chunkTranscript, type ProcessMode } from "./chunking";
import { getModel } from "./config";
import { getOpenAIClient } from "./openai";
import { loadMasterPrompt, loadPrompt04B } from "./prompts";

export type ProcessResult = {
  result: string;
  passagesAVerifier: string[];
  chunksProcessed: number;
};

/**
 * Interview après course : prompt maître (system) + 04B + matériau (user).
 * Aucune consigne ajoutée — les fichiers prompts sont appliqués à la lettre.
 */
export async function processVerbatim(
  transcript: string
): Promise<ProcessResult> {
  const master = loadMasterPrompt();
  const prompt04B = loadPrompt04B();

  if (!master || master.length < 100) {
    throw new Error(
      "Prompt maître introuvable ou incomplet (prompts/prompt-maitre.txt)."
    );
  }
  if (!prompt04B || prompt04B.length < 100) {
    throw new Error(
      "Prompt 04B introuvable ou incomplet (prompts/prompt-04B.txt)."
    );
  }

  const chunks = chunkTranscript(transcript, "verbatim");
  if (chunks.length === 0) {
    throw new Error("Le transcript est vide.");
  }

  const client = getOpenAIClient();
  const model = getModel();
  const parts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Note technique minimale si découpage (pas une consigne éditoriale).
    const material =
      chunks.length > 1
        ? `${chunk}\n\n[Partie ${i + 1}/${chunks.length}]`
        : chunk;

    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: master },
        {
          role: "user",
          content: `${prompt04B}\n\n---\n\n${material}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error(
        `Le modèle n'a renvoyé aucun texte pour la partie ${i + 1}/${chunks.length}.`
      );
    }
    parts.push(stripFence(content));
  }

  return {
    result: parts.join("\n\n"),
    passagesAVerifier: [],
    chunksProcessed: chunks.length,
  };
}

/** Retire uniquement les fences markdown éventuelles — pas de réécriture éditoriale. */
function stripFence(text: string): string {
  return text
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function assertModeAvailable(mode: ProcessMode): void {
  if (mode === "interview") {
    throw new Error(
      "Mode bientôt disponible — prompt 04D en attente de validation"
    );
  }
}
