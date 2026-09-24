# SCRIBEDITOR — Phase 2 (en ligne + local)

Outil interne Jour de Galop : transformer un transcript brut en verbatim à la première personne.

- **Production** : URL Vercel, connexion Google limitée à **@jourdegalop.com**
- **Local** : `AUTH_DISABLED=true` pour travailler sans Google
- **Aucun stockage** des transcripts côté serveur

---

## Production (rédaction à distance)

Les journalistes ouvrent l’URL déployée → **Se connecter avec Google** (`@jourdegalop.com`) → **TRAITER**.

Voir le guide IT : [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)

Variables d’environnement obligatoires sur Vercel :

| Variable | Rôle |
|----------|------|
| `OPENAI_API_KEY` | Clé API OpenAI (serveur) |
| `MODEL` | Modèle (défaut `gpt-4o`) |
| `AUTH_SECRET` | Secret session Auth.js |
| `AUTH_GOOGLE_ID` | Client ID Google OAuth |
| `AUTH_GOOGLE_SECRET` | Client secret Google OAuth |
| `AUTH_URL` | URL publique de l’app |

`AUTH_DISABLED` ne doit **jamais** être `true` en production.

---

## Local (développement)

```bash
cp .env.example .env.local
# Renseigner OPENAI_API_KEY
# Garder AUTH_DISABLED=true pour bypass Google en local
./demarrer.command
```

Ou :

```bash
npm install
npm run demarrer
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Pour tester l’auth Google en local : `AUTH_DISABLED=false`, renseigner `AUTH_GOOGLE_*` et `AUTH_SECRET`, ajouter le redirect  
`http://localhost:3000/api/auth/callback/google` dans Google Cloud.

---

## Utilisation

1. Collez le transcript brut.
2. Mode **VERBATIM — PREMIÈRE PERSONNE**.
3. **TRAITER** → relire → **COPIER LE TEXTE**.

### Mode INTERVIEW

**Désactivé** — prompt 04D en attente de validation.

---

## Architecture

| Élément | Emplacement |
|--------|-------------|
| Auth Google + allowlist | `src/auth.ts`, `src/lib/auth-access.ts` |
| Proxy (garde d’accès) | `src/proxy.ts` |
| Login | `src/app/login/page.tsx` |
| API (protégée) | `src/app/api/process/route.ts` |
| Prompt maître / 04B | `prompts/` |

Flux Mode 1 : maître + 04B + transcript → OpenAI → contrôle de fidélité → résultat.

## Hors périmètre

Historique des verbatims, analytics, prompt 04D, app mobile.
