import fs from "fs";
import path from "path";
import {
  EMBEDDED_03B,
  EMBEDDED_04B,
  EMBEDDED_04D,
  EMBEDDED_MASTER,
} from "./prompt-content";

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

/**
 * Lit le fichier local si présent (dev), sinon le prompt embarqué (Vercel).
 */
function readPrompt(
  filename: string,
  embedded: string,
  minLength = 50
): string {
  try {
    const fullPath = path.join(PROMPTS_DIR, filename);
    if (fs.existsSync(fullPath)) {
      const fromDisk = fs.readFileSync(fullPath, "utf8").trim();
      if (fromDisk.length >= minLength) {
        return fromDisk;
      }
    }
  } catch {
    // ignore — fallback embarqué
  }
  return embedded.trim();
}

export function loadMasterPrompt(): string {
  return readPrompt("prompt-maitre.txt", EMBEDDED_MASTER, 100);
}

export function loadPrompt04B(): string {
  return readPrompt("prompt-04B.txt", EMBEDDED_04B, 100);
}

export function loadPrompt03B(): string {
  return readPrompt("prompt-03B.txt", EMBEDDED_03B, 100);
}

/** Placeholder only — Mode INTERVIEW not ready until 04D is validated. */
export function loadPrompt04DPlaceholder(): string {
  return readPrompt("prompt-04D.txt", EMBEDDED_04D, 20);
}
