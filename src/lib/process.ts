import { chunkTranscript, type ProcessMode } from "./chunking";
import { getModel } from "./config";
import { runFidelityCheck, type FidelityResult } from "./fidelity";
import { getOpenAIClient } from "./openai";
import { loadMasterPrompt, loadPrompt04B } from "./prompts";

export type ProcessResult = {
  result: string;
  /** Prêt pour une future UI « Passage à vérifier ». */
  passagesAVerifier: string[];
  chunksProcessed: number;
};

/**
 * Traitement Mode 1 (VERBATIM — PREMIÈRE PERSONNE) :
 * Prompt maître (system) + 04B + transcript (user) → OpenAI → contrôle de fidélité.
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
    const multi =
      chunks.length > 1
        ? `\n\n(Partie ${i + 1}/${chunks.length} du transcript — traite uniquement cette partie, sans résumé ni conclusion ajoutés.)`
        : "";

    // Maître = règles éditoriales (system). 04B = consigne de tâche + matériau (user).
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: master },
        {
          role: "user",
          content: [
            prompt04B,
            "",
            "---",
            "",
            "Applique strictement le prompt maître (message system) ET les consignes 04B ci-dessus.",
            "Le résultat doit être ENTIÈREMENT à la première personne (je / j' / mon / ma / mes).",
            "Interdit de laisser des formulations du type « Il explique que… », « Elle dit que… ».",
            "Noms de chevaux et noms propres : reproduis EXACTEMENT l'orthographe du matériau. N'« améliore » jamais un nom.",
            "Ne renvoie que le verbatim finalisé, sans préambule, sans titre, sans commentaire.",
            "",
            "Matériau à transformer :",
            "",
            chunk + multi,
          ].join("\n"),
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error(
        `Le modèle n'a renvoyé aucun texte pour la partie ${i + 1}/${chunks.length}.`
      );
    }
    parts.push(applySafeFirstPersonFixes(stripModelChrome(content)));
  }

  const assembled = parts.join("\n\n");

  let fidelity: FidelityResult;
  try {
    fidelity = await runFidelityCheck(transcript, assembled);
  } catch {
    fidelity = { correctedText: assembled, passagesAVerifier: [] };
  }

  return {
    result: applySafeFirstPersonFixes(fidelity.correctedText),
    passagesAVerifier: fidelity.passagesAVerifier,
    chunksProcessed: chunks.length,
  };
}

/** Retire titres / formules du type « Voici le verbatim : » si le modèle en ajoute. */
function stripModelChrome(text: string): string {
  return text
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(
      /^(Voici\s+(le\s+)?verbatim[^:\n]*:\s*|Verbatim\s*(finalisé|final|nettoyé)\s*:\s*)/i,
      ""
    )
    .trim();
}

/**
 * Filet de sécurité aligné sur 04B : reformulations indirectes évidentes → 1ʳᵉ personne.
 * Ne touche que des motifs explicites (pas d'invention).
 */
function applySafeFirstPersonFixes(text: string): string {
  let out = text;
  const pairs: [RegExp, string][] = [
    [
      /\bIl (?:explique|indique|précise|rappelle|confirme)(?:\s+\S+){0,3}\s+qu['’]il\b/gi,
      "J'",
    ],
    [
      /\bElle (?:explique|indique|précise|rappelle|confirme)(?:\s+\S+){0,3}\s+qu['’]elle\b/gi,
      "J'",
    ],
    [/\bIl (?:dit|déclare|affirme)(?:\s+\S+){0,2}\s+qu['’]il\b/gi, "Je"],
    [/\bElle (?:dit|déclare|affirme)(?:\s+\S+){0,2}\s+qu['’]elle\b/gi, "Je"],
    [
      /\bIl (?:explique|indique|précise|rappelle|confirme)(?:\s+\S+){0,2}\s+que\b/gi,
      "",
    ],
    [
      /\bElle (?:explique|indique|précise|rappelle|confirme)(?:\s+\S+){0,2}\s+que\b/gi,
      "",
    ],
  ];
  for (const [re, rep] of pairs) {
    out = out.replace(re, rep);
  }
  return out
    .replace(/J'\s*avait\b/gi, "J'avais")
    .replace(/J'\s*ai\b/gi, "J'ai")
    .replace(/J'\s*espère\b/gi, "J'espère")
    .replace(/J'\s+([aeiouàâäéèêëîïôöùûüh])/gi, "J'$1")
    .replace(/  +/g, " ")
    .replace(/ +([,.])/g, "$1")
    .trim();
}

export function assertModeAvailable(mode: ProcessMode): void {
  if (mode === "interview") {
    throw new Error(
      "Mode bientôt disponible — prompt 04D en attente de validation"
    );
  }
}
