"use client";

import { useCallback, useState, type ReactNode } from "react";
import { RacingScene } from "@/components/RacingScene";

type Mode = "verbatim" | "conference";
type Screen = "input" | "result";

type InterviewToolProps = {
  userEmail?: string | null;
  signOutSlot?: ReactNode;
};

export function InterviewTool({ userEmail, signOutSlot }: InterviewToolProps) {
  const [transcript, setTranscript] = useState("");
  const [originalTranscript, setOriginalTranscript] = useState<string | null>(
    null
  );
  const [mode, setMode] = useState<Mode>("verbatim");
  const [screen, setScreen] = useState<Screen>("input");
  const [resultText, setResultText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const canSubmit = !processing && transcript.trim().length > 0;

  const handleProcess = useCallback(async () => {
    const source = transcript.trim();
    if (!source) {
      setError("Veuillez coller un transcript avant de lancer le traitement.");
      return;
    }

    setError(null);
    setProcessing(true);
    setOriginalTranscript(source);

    try {
      const response = await fetch(`/api/process?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ transcript: source, mode }),
      });

      const data = (await response.json()) as {
        result?: string;
        error?: string;
        sourcePreview?: string;
      };

      if (response.status === 401 || response.status === 403) {
        setError(
          data.error ||
            "Session expirée ou accès refusé. Reconnectez-vous avec votre compte @jourdegalop.com."
        );
        return;
      }

      if (!response.ok || !data.result) {
        setError(
          data.error ||
            "Une erreur est survenue pendant le traitement. Votre transcript n'a pas été modifié."
        );
        return;
      }

      if (
        data.sourcePreview &&
        !source.startsWith(data.sourcePreview.slice(0, 40))
      ) {
        setError(
          "Incohérence détectée (mauvais texte traité — possible cache). Réessayez après Cmd+Shift+R."
        );
        return;
      }

      setResultText(data.result);
      setScreen("result");
    } catch {
      setError(
        "Impossible de joindre le serveur. Vérifiez votre connexion ou que l'application tourne."
      );
    } finally {
      setProcessing(false);
    }
  }, [mode, transcript]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setError("Impossible de copier dans le presse-papiers.");
    }
  }, [resultText]);

  const handleRestart = useCallback(() => {
    setScreen("input");
    setResultText("");
    setError(null);
    setCopyFeedback(false);
  }, []);

  return (
    <div className="shell">
      <div className="shell-bg" aria-hidden="true" />

      <main className="page">
        <div className="hero-visual">
          <RacingScene />
        </div>

        <header className="header">
          <div className="header-row">
            <div>
              <p className="brand-mark">Jour de Galop</p>
              <h1 className="title">INTERVIEW — SCRIBEDITOR</h1>
              <p className="subtitle">Outil interne — réservé à la rédaction</p>
            </div>
            {(userEmail || signOutSlot) && (
              <div className="user-bar">
                {userEmail && (
                  <span className="user-email" title={userEmail}>
                    {userEmail}
                  </span>
                )}
                {signOutSlot}
              </div>
            )}
          </div>
        </header>

        {screen === "input" ? (
          <section className="panel" aria-label="Saisie du transcript">
            <label className="label" htmlFor="transcript">
              Collez votre retranscription brute (ITV ou Zoom entier).
            </label>
            <textarea
              id="transcript"
              className="textarea"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Transcription Zoom, notes d'interview ou propos rapportés…"
              disabled={processing}
              spellCheck
            />

            <fieldset className="modes" disabled={processing}>
              <legend className="label-caps">Mode</legend>
              <div className="mode-row mode-row-2">
                <button
                  type="button"
                  className={`mode-btn${mode === "verbatim" ? " active" : ""}`}
                  aria-pressed={mode === "verbatim"}
                  onClick={() => setMode("verbatim")}
                >
                  INTERVIEW APRÈS COURSE
                </button>
                <button
                  type="button"
                  className={`mode-btn${mode === "conference" ? " active" : ""}`}
                  aria-pressed={mode === "conference"}
                  onClick={() => setMode("conference")}
                >
                  CONFÉRENCE DE PRESSE / ZOOM
                </button>
              </div>
              <p className="mode-hint" role="status">
                {mode === "conference"
                  ? "Colle tout le Zoom — restitue tous les échanges (Q + R), nettoyés, dans l’ordre."
                  : "ITV d’un intervenant — verbatim à la 1ʳᵉ personne (prompt 04B)."}
              </p>
            </fieldset>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <div className="actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleProcess}
                disabled={!canSubmit}
              >
                {processing
                  ? "Traitement en cours…"
                  : "TRAITER"}
              </button>
            </div>

            {originalTranscript !== null && !processing && (
              <p className="session-note">
                Transcript d&apos;origine conservé en mémoire de session (non
                enregistré sur le serveur).
              </p>
            )}
          </section>
        ) : (
          <section className="panel panel-result" aria-label="Résultat">
            <div className="result-head">
              <span className="finish-dot" aria-hidden="true" />
              <label className="label-caps" htmlFor="result">
                {mode === "conference"
                  ? "ÉCHANGES — CONFÉRENCE DE PRESSE"
                  : "VERBATIM — INTERVIEW APRÈS COURSE"}
              </label>
            </div>
            <textarea
              id="result"
              className="textarea"
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              spellCheck
            />

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <div className="actions actions-row">
              <button type="button" className="btn-primary" onClick={handleCopy}>
                {copyFeedback ? "COPIÉ" : "COPIER LE TEXTE"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleRestart}
              >
                RECOMMENCER
              </button>
            </div>
          </section>
        )}

        <footer className="footer">
          SCRIBEDITOR · Phase 2 · Jour de Galop
        </footer>
      </main>
    </div>
  );
}
