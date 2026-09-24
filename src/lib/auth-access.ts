/** Domaine email autorisé (rédaction Jour de Galop). */
export const ALLOWED_EMAIL_DOMAIN = "jourdegalop.com";

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/**
 * Désactive l'auth uniquement en local (AUTH_DISABLED=true).
 * Jamais sur Vercel / production déployée.
 */
export function isAuthDisabled(): boolean {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production") {
    return false;
  }
  return process.env.AUTH_DISABLED === "true";
}
