import { chunkTranscript, type ProcessMode } from "./chunking";
import { getModel } from "./config";
import { getOpenAIClient } from "./openai";
import {
  loadMasterPrompt,
  loadPrompt04B,
  loadPrompt04C,
} from "./prompts";

export type ProcessResult = {
  result: string;
  passagesAVerifier: string[];
  chunksProcessed: number;
};

const REFUSAL_RE =
  /je (ne )?peux pas|je suis désolé|manque des informations|texte ne soit pas complet|pourrais-tu (me )?fournir|extrait plus détaillé|je ne suis pas en mesure/i;

const STICKY_NAMES = ["dwyer", "asfora", "henry dwyer"];

/**
 * Interview après course : maître + 04B + matériau.
 */
export async function processVerbatim(
  transcript: string
): Promise<ProcessResult> {
  return runPromptPipeline({
    transcript,
    mode: "verbatim",
    taskPrompt: loadPrompt04B(),
    taskLabel: "04B",
  });
}

/**
 * Conférence de presse / Zoom : maître + 04C + matériau brut entier.
 */
export async function processConference(
  transcript: string
): Promise<ProcessResult> {
  return runPromptPipeline({
    transcript,
    mode: "conference",
    taskPrompt: loadPrompt04C(),
    taskLabel: "04C",
  });
}

async function runPromptPipeline(opts: {
  transcript: string;
  mode: "verbatim" | "conference";
  taskPrompt: string;
  taskLabel: string;
}): Promise<ProcessResult> {
  const master = loadMasterPrompt();
  const taskPrompt = opts.taskPrompt;

  if (!master || master.length < 100) {
    throw new Error(
      "Prompt maître introuvable ou incomplet (prompts/prompt-maitre.txt)."
    );
  }
  if (!taskPrompt || taskPrompt.length < 100) {
    throw new Error(
      `Prompt ${opts.taskLabel} introuvable ou incomplet.`
    );
  }

  const chunks = chunkTranscript(opts.transcript, opts.mode);
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

    let content = await runChunk(
      client,
      model,
      master,
      taskPrompt,
      material,
      opts.mode
    );

    if (
      REFUSAL_RE.test(content) ||
      isOffTopicSticky(opts.transcript, content)
    ) {
      content = await runChunk(
        client,
        model,
        master,
        taskPrompt,
        material,
        opts.mode,
        true
      );
    }

    if (!content || REFUSAL_RE.test(content)) {
      throw new Error(
        "Le modèle a refusé de traiter ce transcript. Réessayez."
      );
    }

    if (isOffTopicSticky(opts.transcript, content)) {
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
  taskPrompt: string,
  material: string,
  mode: "verbatim" | "conference",
  force = false
): Promise<string> {
  const modeHint =
    mode === "conference"
      ? "Mode conférence de presse : parcours TOUT le Zoom. Un bloc ### par intervenant qui a répondu. Ne t'arrête pas au premier. N'invente pas de bloc pour quelqu'un qui n'a pas encore parlé."
      : "Mode interview après course : verbatim à la première personne.";

  const forceLine = force
    ? [
        "",
        "RAPPEL STRICT :",
        "- Produis immédiatement le résultat demandé.",
        "- Utilise UNIQUEMENT le matériau entre <<<MATERIAU>>> et <<<FIN>>>.",
        "- Interdit d'importer un autre interview ou des noms absents du matériau.",
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
          taskPrompt,
          "",
          "---",
          "",
          modeHint,
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
