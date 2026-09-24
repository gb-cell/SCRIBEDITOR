# SCRIBEDITOR — Mode d’emploi (rédaction)

Outil interne Jour de Galop pour transformer un transcript brut en verbatim à la première personne.

**Usage local uniquement** (sur votre Mac). Rien n’est enregistré sur un serveur.

---

## Installation (une seule fois)

1. Copiez le dossier **SCRIBEDITOR** sur votre Mac (Bureau recommandé).
2. Installez **Node.js** si besoin : ouvrez le Terminal et lancez  
   `brew install node`  
   (demandez à l’IT si Homebrew / Node ne sont pas déjà là.)
3. Demandez à l’admin / IT une **clé API OpenAI** JDG (`sk-…`).
4. Double-cliquez sur **`demarrer.command`**.
5. Si un fichier `.env.local` s’ouvre : collez la clé ainsi  
   `OPENAI_API_KEY=sk-votre-cle`  
   puis enregistrez et double-cliquez à nouveau sur `demarrer.command`.
6. Le navigateur s’ouvre sur [http://localhost:3000](http://localhost:3000).

> Si macOS bloque le fichier : clic droit → **Ouvrir** → **Ouvrir**.

---

## Utilisation

1. Laissez la fenêtre Terminal ouverte.
2. Collez la retranscription brute.
3. Mode **VERBATIM — PREMIÈRE PERSONNE** (actif).
4. Cliquez **TRAITER**.
5. Relisez / modifiez le résultat → **COPIER LE TEXTE** ou **RECOMMENCER**.

Pour quitter : dans le Terminal, **Ctrl+C**.

---

## Important

- Ne **partagez pas** votre clé API (mail, Slack, capture d’écran).
- Ne publiez pas le résultat sans relecture éditoriale.
- Le mode **INTERVIEW — QUESTIONS / RÉPONSES** est encore désactivé (prompt 04D en attente).

---

## En cas de problème

| Message / symptôme | Que faire |
|--------------------|-----------|
| Node n’est pas installé | `brew install node` puis relancer |
| Clé API invalide / manquante | Recréer une clé sur platform.openai.com/api-keys et la mettre dans `.env.local` |
| Crédit épuisé | Contacter l’admin OpenAI JDG (Billing) |
| Page blanche / refus de connexion | Vérifier que `demarrer.command` tourne encore |

Support interne : l’équipe qui a déployé SCRIBEDITOR.
