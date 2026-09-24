import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { ProcessMode } from "@/lib/chunking";
import { isAllowedEmail, isAuthDisabled } from "@/lib/auth-access";
import { assertModeAvailable, processVerbatim } from "@/lib/process";

export const runtime = "nodejs";
export const maxDuration = 120;

type RequestBody = {
  transcript?: unknown;
  mode?: unknown;
};

function frenchErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;

    if (msg.includes("OPENAI_API_KEY") || msg.includes("Clé API")) {
      return msg;
    }
    if (msg.includes("04D") || msg.includes("bientôt disponible")) {
      return msg;
    }
    // Clé invalide AVANT le test « vide » : le mot anglais "provided" contient "vide".
    if (
      msg.includes("401") ||
      /incorrect.*api.?key/i.test(msg) ||
      /invalid.?api.?key/i.test(msg) ||
      /token_invalidated/i.test(msg) ||
      /authentication/i.test(msg)
    ) {
      return "Clé API OpenAI invalide ou révoquée. Vérifiez OPENAI_API_KEY côté serveur, puis réessayez.";
    }
    if (msg === "Le transcript est vide." || /transcript est vide/i.test(msg)) {
      return "Veuillez coller un transcript avant de lancer le traitement.";
    }
    if (
      /insufficient.?quota/i.test(msg) ||
      /credit.?balance/i.test(msg) ||
      /billing/i.test(msg) ||
      /no credits remaining/i.test(msg) ||
      /exceeded.*quota/i.test(msg)
    ) {
      return "Crédit OpenAI épuisé. Ajoutez des crédits sur platform.openai.com (Billing), puis réessayez.";
    }
    if (msg.includes("429") || /rate limit/i.test(msg)) {
      return "Limite temporaire de requêtes OpenAI. Attendez une minute puis réessayez.";
    }
    if (/timeout|ETIMEDOUT|ECONNRESET/i.test(msg)) {
      return "Le service OpenAI met trop de temps à répondre. Réessayez.";
    }
    if (msg.includes("modèle n'a renvoyé")) {
      return msg;
    }

    return "Une erreur est survenue pendant le traitement. Votre transcript n'a pas été modifié.";
  }

  return "Une erreur inattendue est survenue. Votre transcript n'a pas été modifié.";
}

async function requireAuthorizedSession(): Promise<NextResponse | null> {
  if (isAuthDisabled()) return null;

  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      {
        error:
          "Connexion requise. Reconnectez-vous avec votre compte @jourdegalop.com.",
      },
      { status: 401 }
    );
  }

  if (!isAllowedEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Accès refusé. Seules les adresses @jourdegalop.com sont autorisées.",
      },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(request: Request) {
  const authError = await requireAuthorizedSession();
  if (authError) return authError;

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 }
    );
  }

  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  const mode = body.mode as ProcessMode | undefined;

  if (!transcript) {
    return NextResponse.json(
      { error: "Veuillez coller un transcript avant de lancer le traitement." },
      { status: 400 }
    );
  }

  if (mode !== "verbatim" && mode !== "interview") {
    return NextResponse.json(
      { error: "Mode de traitement non reconnu." },
      { status: 400 }
    );
  }

  try {
    assertModeAvailable(mode);

    if (mode === "verbatim") {
      const result = await processVerbatim(transcript);

      // Aucun log du contenu — on ne persiste rien côté serveur.
      return NextResponse.json({
        result: result.result,
        passagesAVerifier: result.passagesAVerifier,
        chunksProcessed: result.chunksProcessed,
      });
    }

    return NextResponse.json(
      {
        error:
          "Mode bientôt disponible — prompt 04D en attente de validation",
      },
      { status: 503 }
    );
  } catch (error) {
    const message = frenchErrorMessage(error);
    const status =
      message.includes("bientôt disponible") || message.includes("04D")
        ? 503
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
