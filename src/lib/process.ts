import { chunkTranscript, type ProcessMode } from "./chunking";
import { getModel } from "./config";
import { getOpenAIClient } from "./openai";
import { loadMasterPrompt, loadPrompt04B } from "./prompts";

export type ProcessResult = {
  result: string;
  passagesAVerifier: string[];
  chunksProcessed: number;
};

const REFUSAL_RE =
  /je (ne )?peux pas|je suis désolé|manque des informations|texte ne soit pas complet|pourrais-tu (me )?fournir|extrait plus détaillé|je ne suis pas en mesure/i;

/**
 * Interview après course : prompt maître (system) + 04B + matériau (user).
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
    const material =
      chunks.length > 1
        ? `${chunk}\n\n[Partie ${i + 1}/${chunks.length}]`
        : chunk;

    let content = await runChunk(client, model, master, prompt04B, material);

    // Si le modèle refuse (comportement hors prompt), un second passage forcé.
    if (REFUSAL_RE.test(content)) {
      content = await runChunk(
        client,
        model,
        master,
        prompt04B,
        material,
        true
      );
    }

    if (!content || REFUSAL_RE.test(content)) {
      throw new Error(
        "Le modèle a refusé de traiter ce transcript. Réessayez ou allongez légèrement le texte."
      );
    }

    parts.push(content);
  }

  return {
    result: parts.join("\n\n"),
    passagesAVerifier: [],
    chunksProcessed: chunks.length,
  };
}

async function runChunk(
  client: ReturnType<typeof getOpenAIClient>,
  model: string,
  master: string,
  prompt04B: string,
  material: string,
  force = false
): Promise<string> {
  const forceLine = force
    ? "\n\nRAPPEL : produis immédiatement le verbatim. Aucun refus, aucune question, aucun commentaire."
    : "";

  const response = await client.chat.completions.create({
    model,
    temperature: force ? 0.1 : 0.2,
    messages: [
      { role: "system", content: master },
      {
        role: "user",
        content: `${prompt04B}\n\n---\n\n${material}${forceLine}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  return stripFence(raw);
}

/** Retire uniquement les fences markdown éventuelles. */
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
