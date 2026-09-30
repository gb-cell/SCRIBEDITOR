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

/** Noms qui ont « collé » à tort chez des utilisateurs — refusés s'ils absents du transcript. */
const STICKY_NAMES = ["dwyer", "asfora", "henry dwyer"];

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

    if (REFUSAL_RE.test(content) || isOffTopicSticky(transcript, content)) {
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

    if (isOffTopicSticky(transcript, content)) {
      throw new Error(
        "Résultat hors sujet détecté (texte ne correspondant pas au transcript). Réessayez."
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

function isOffTopicSticky(input: string, output: string): boolean {
  const src = input.toLowerCase();
  const out = output.toLowerCase();
  return STICKY_NAMES.some((name) => out.includes(name) && !src.includes(name));
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
    ? [
        "",
        "RAPPEL STRICT :",
        "- Produis immédiatement le verbatim à la première personne.",
        "- Utilise UNIQUEMENT le matériau entre <<<MATERIAU>>> et <<<FIN>>>.",
        "- Interdit d'importer un autre interview, d'autres noms (chevaux, jockeys, entraîneurs) absents du matériau.",
        "- Aucun refus, aucune question, aucun commentaire.",
      ].join("\n")
    : "";

  const response = await client.chat.completions.create({
    model,
    temperature: force ? 0.1 : 0.2,
    messages: [
      { role: "system", content: master },
      {
        role: "user",
        content: [
          prompt04B,
          "",
          "---",
          "",
          "Transforme UNIQUEMENT le matériau ci-dessous. N'utilise aucun autre souvenir d'interview.",
          "",
          "<<<MATERIAU>>>",
          material,
          "<<<FIN>>>",
          forceLine,
        ].join("\n"),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  return stripFence(raw);
}

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
