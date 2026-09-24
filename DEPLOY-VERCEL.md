# Déploiement Vercel — SCRIBEDITOR Phase 2

Checklist IT pour mettre l’outil en ligne, réservé à **@jourdegalop.com**.

---

## 1. Prérequis

- Compte [Vercel](https://vercel.com) (orga JDG de préférence)
- Compte [Google Cloud](https://console.cloud.google.com) (projet OAuth)
- Clé API OpenAI JDG (déjà créditée)
- Repo Git ou import du dossier SCRIBEDITOR

---

## 2. Google OAuth (Workspace)

1. Google Cloud Console → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID** → type **Web application**
3. Authorized JavaScript origins :
   - `https://<votre-projet>.vercel.app`
   - (plus tard) `https://scribeditor.jourdegalop.com`
4. Authorized redirect URIs :
   - `https://<votre-projet>.vercel.app/api/auth/callback/google`
5. Copier **Client ID** et **Client secret** → `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
6. (Recommandé) OAuth consent screen : Internal / limité au domaine Workspace `jourdegalop.com`

L’app refuse aussi côté serveur tout email qui ne se termine pas par `@jourdegalop.com`.

---

## 3. Secrets Vercel

Project → **Settings** → **Environment Variables** (Production + Preview si besoin) :

```
OPENAI_API_KEY=sk-...
MODEL=gpt-4o
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GOOGLE_ID=....apps.googleusercontent.com
AUTH_GOOGLE_SECRET=...
AUTH_URL=https://<votre-projet>.vercel.app
```

Ne **pas** définir `AUTH_DISABLED=true` sur Vercel.

Générer `AUTH_SECRET` :

```bash
openssl rand -base64 32
```

---

## 4. Déployer

```bash
# Depuis le dossier projet (avec Vercel CLI) :
npx vercel --prod
```

Ou : brancher le repo GitHub/GitLab dans le dashboard Vercel → Deploy.

Framework preset : **Next.js** (auto-détecté).

---

## 5. Vérifications post-déploiement

1. Ouvrir l’URL → page **Connexion**
2. Compte **@jourdegalop.com** → accès à l’outil
3. Compte Gmail perso → **refus**
4. Coller un court transcript → **TRAITER** → résultat
5. **Déconnexion** fonctionne
6. Usage OpenAI : https://platform.openai.com/usage (pas de log de contenu côté app)

---

## 6. Domaine custom (optionnel)

1. Vercel → Domains → `scribeditor.jourdegalop.com`
2. DNS chez le registrar JDG
3. Mettre à jour `AUTH_URL` et les URIs Google OAuth

---

## Sécurité rappel

| Règle | Statut |
|-------|--------|
| HTTPS | Oui (Vercel) |
| Clé OpenAI serveur only | Oui |
| Allowlist `@jourdegalop.com` | Oui (Google hd + vérif app) |
| Session cookie httpOnly | Oui (Auth.js) |
| Pas de stockage transcript | Oui |
| Auth désactivable en prod | Non (bloqué si `VERCEL=1`) |
