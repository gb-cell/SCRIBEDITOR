import { auth, signIn } from "@/auth";
import { RacingScene } from "@/components/RacingScene";
import { isAuthDisabled } from "@/lib/auth-access";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (isAuthDisabled()) {
    redirect("/");
  }

  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = loginErrorMessage(params.error);

  return (
    <div className="shell">
      <div className="shell-bg" aria-hidden="true" />
      <main className="page page-login">
        <div className="hero-visual">
          <RacingScene />
        </div>

        <header className="header">
          <p className="brand-mark">Jour de Galop</p>
          <h1 className="title">INTERVIEW — SCRIBEDITOR</h1>
          <p className="subtitle">Outil interne — réservé à la rédaction</p>
        </header>

        <section className="panel login-panel" aria-label="Connexion">
          <p className="login-lead">
            Connectez-vous avec votre compte Google{" "}
            <strong>@jourdegalop.com</strong> pour accéder à l&apos;outil.
          </p>

          {errorMessage && (
            <p className="error" role="alert">
              {errorMessage}
            </p>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: params.callbackUrl || "/",
              });
            }}
          >
            <button type="submit" className="btn-primary btn-login">
              Se connecter avec Google
            </button>
          </form>

          <p className="session-note">
            Accès limité aux adresses @jourdegalop.com. Aucun transcript n&apos;est
            enregistré sur le serveur.
          </p>
        </section>

        <footer className="footer">
          SCRIBEDITOR · Phase 2 · Jour de Galop
        </footer>
      </main>
    </div>
  );
}

function loginErrorMessage(code?: string): string | null {
  if (!code) return null;
  const normalized = code.toLowerCase();
  if (
    normalized === "domain" ||
    normalized === "accessdenied" ||
    normalized.includes("access")
  ) {
    return "Accès refusé. Seules les adresses @jourdegalop.com sont autorisées.";
  }
  if (normalized === "configuration") {
    return "Configuration d'authentification incomplète. Contactez l'IT.";
  }
  return "La connexion a échoué. Réessayez ou contactez l'IT.";
}
