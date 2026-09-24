import { CHUNK_HARD_MAX_CHARS, CHUNK_TARGET_CHARS } from "./config";

export type ProcessMode = "verbatim" | "interview";

/**
 * Découpe un texte long en unités conversationnelles (paragraphes / tours),
 * sans coupure naïve au milieu d'une phrase.
 *
 * Mode verbatim : évite de séparer des passages portant sur le même sujet
 * (blocs adjacents regroupés jusqu'à la taille cible).
 *
 * Mode interview (Q/R, prêt pour 04D) : ne sépare jamais une question
 * de sa réponse immédiatement suivante.
 */
export function chunkTranscript(
  text: string,
  mode: ProcessMode
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  if (normalized.length <= CHUNK_TARGET_CHARS) {
    return [normalized];
  }

  const units =
    mode === "interview"
      ? groupQuestionAnswerUnits(splitConversationalUnits(normalized))
      : splitConversationalUnits(normalized);

  return packUnits(units, mode);
}

/** Découpe en paragraphes / blocs séparés par des lignes vides ou sauts nets. */
function splitConversationalUnits(text: string): string[] {
  const rawBlocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (rawBlocks.length <= 1) {
    return splitLongParagraph(text);
  }

  const units: string[] = [];
  for (const block of rawBlocks) {
    if (block.length > CHUNK_HARD_MAX_CHARS) {
      units.push(...splitLongParagraph(block));
    } else {
      units.push(block);
    }
  }
  return units;
}

/**
 * Pour le mode Q/R : rattache une réponse à la question qui la précède
 * lorsque le couple reste sous la limite dure.
 */
function groupQuestionAnswerUnits(units: string[]): string[] {
  const grouped: string[] = [];
  let i = 0;

  while (i < units.length) {
    const current = units[i];
    const next = units[i + 1];

    if (next && looksLikeQuestion(current) && !looksLikeQuestion(next)) {
      const pair = `${current}\n\n${next}`;
      if (pair.length <= CHUNK_HARD_MAX_CHARS) {
        grouped.push(pair);
        i += 2;
        continue;
      }
    }

    grouped.push(current);
    i += 1;
  }

  return grouped;
}

function looksLikeQuestion(block: string): boolean {
  const firstLine = block.split("\n")[0]?.trim() ?? "";
  if (/\?\s*$/.test(firstLine)) return true;
  if (/^(q|question|journaliste|jdg)\s*[:\-\u2013\u2014]/i.test(firstLine)) {
    return true;
  }
  return false;
}

/**
 * Regroupe les unités adjacentes jusqu'à la taille cible.
 * En verbatim, on privilégie de garder ensemble les passages liés.
 */
function packUnits(units: string[], mode: ProcessMode): string[] {
  if (units.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    if (!current) {
      current = unit;
      continue;
    }

    const candidate = `${current}\n\n${unit}`;
    const underTarget = candidate.length <= CHUNK_TARGET_CHARS;
    const underHard = candidate.length <= CHUNK_HARD_MAX_CHARS;

    // Verbatim : on regroupe tant qu'on reste sous la limite dure
    // pour ne pas casser un même fil thématique trop tôt.
    const shouldMerge =
      mode === "verbatim" ? underHard && underTarget : underTarget;

    if (shouldMerge) {
      current = candidate;
    } else if (underHard && mode === "verbatim" && current.length < CHUNK_TARGET_CHARS / 2) {
      // Petit chunk précédent : encore un peu de marge pour coller le suivant
      current = candidate;
    } else {
      chunks.push(current);
      current = unit;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/** Coupure de secours sur des frontières de phrase, jamais au milieu d'un mot. */
function splitLongParagraph(text: string): string[] {
  if (text.length <= CHUNK_HARD_MAX_CHARS) return [text];

  const sentences = text.match(/[^.!?…]+[.!?…]+(?:\s+|$)|[^.!?…]+$/g);
  if (!sentences || sentences.length <= 1) {
    return hardSplitByLength(text);
  }

  const parts: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const candidate = current ? `${current} ${trimmed}` : trimmed;
    if (candidate.length <= CHUNK_TARGET_CHARS) {
      current = candidate;
    } else {
      if (current) parts.push(current);
      if (trimmed.length > CHUNK_HARD_MAX_CHARS) {
        parts.push(...hardSplitByLength(trimmed));
        current = "";
      } else {
        current = trimmed;
      }
    }
  }

  if (current) parts.push(current);
  return parts;
}

function hardSplitByLength(text: string): string[] {
  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > CHUNK_HARD_MAX_CHARS) {
    let cut = remaining.lastIndexOf(" ", CHUNK_HARD_MAX_CHARS);
    if (cut < CHUNK_HARD_MAX_CHARS * 0.5) {
      cut = CHUNK_HARD_MAX_CHARS;
    }
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) parts.push(remaining);
  return parts;
}
