import fs from "fs";
import path from "path";

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

function readPrompt(filename: string): string {
  const fullPath = path.join(PROMPTS_DIR, filename);
  return fs.readFileSync(fullPath, "utf8").trim();
}

export function loadMasterPrompt(): string {
  return readPrompt("prompt-maitre.txt");
}

export function loadPrompt04B(): string {
  return readPrompt("prompt-04B.txt");
}

/** Placeholder only — Mode 2 not ready until 04D is validated. */
export function loadPrompt04DPlaceholder(): string {
  return readPrompt("prompt-04D.txt");
}
