#!/usr/bin/env bash
# SCRIBEDITOR — démarrage local en une commande
set -e
cd "$(dirname "$0")"

# Chemins habituels Mac (double-clic Finder n'a pas toujours le PATH complet)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

VERT='\033[0;32m'
JAUNE='\033[1;33m'
ROUGE='\033[0;31m'
NC='\033[0m'

echo ""
echo "══════════════════════════════════════"
echo "  SCRIBEDITOR — INTERVIEW JDG"
echo "══════════════════════════════════════"
echo ""

# --- Node.js ---
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo -e "${ROUGE}Node.js n'est pas installé sur cet ordinateur.${NC}"
  echo ""
  echo "Sur Mac, ouvrez le Terminal et lancez :"
  echo "  brew install node"
  echo ""
  echo "Puis relancez ce script (double-clic sur demarrer.command)."
  echo ""
  read -r -p "Appuyez sur Entrée pour fermer…"
  exit 1
fi

echo -e "Node $(node -v) · npm $(npm -v)"

# --- Clé API (obligatoire) ---
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo -e "${JAUNE}Fichier .env.local créé.${NC}"
fi

# Auth locale : bypass Google sauf si déjà configuré autrement
if ! grep -qE '^AUTH_DISABLED=' .env.local 2>/dev/null; then
  echo "AUTH_DISABLED=true" >> .env.local
fi
if ! grep -qE '^AUTH_SECRET=.' .env.local 2>/dev/null; then
  # Secret local de développement (remplacé en production Vercel)
  if command -v openssl >/dev/null 2>&1; then
    echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
  else
    echo "AUTH_SECRET=dev-local-scribeditor-change-me" >> .env.local
  fi
fi
if ! grep -qE '^AUTH_URL=' .env.local 2>/dev/null; then
  echo "AUTH_URL=http://localhost:3000" >> .env.local
fi

KEY_LINE=$(grep -E '^OPENAI_API_KEY=' .env.local 2>/dev/null | head -1 || true)
KEY_VAL="${KEY_LINE#OPENAI_API_KEY=}"
KEY_VAL="${KEY_VAL%$'\r'}"
KEY_OK=0
case "$KEY_VAL" in
  sk-...|sk-votre-cle|sk-your-key|"") KEY_OK=0 ;;
  sk-*) KEY_OK=1 ;;
  *) KEY_OK=0 ;;
esac
if echo "$KEY_VAL" | grep -q '\.\.\.'; then KEY_OK=0; fi

if [ "$KEY_OK" -ne 1 ]; then
  echo ""
  echo -e "${ROUGE}Clé API OpenAI manquante ou incomplete.${NC}"
  echo "1. Ouvrez .env.local (il va s'ouvrir)."
  echo "2. Collez votre clé : OPENAI_API_KEY=sk-..."
  echo "3. Enregistrez, puis relancez demarrer.command."
  echo ""
  if command -v open >/dev/null 2>&1; then
    open -e .env.local || open .env.local
  fi
  read -r -p "Appuyez sur Entrée pour fermer…"
  exit 1
fi

# --- Dépendances ---
if [ ! -d node_modules ]; then
  echo "Installation des dépendances (une seule fois)…"
  npm install
fi

# --- Lancement ---
URL="http://localhost:3000"
echo ""
echo -e "${VERT}Démarrage…${NC}"
echo "Ouvrez : $URL"
echo "(Laissez cette fenêtre ouverte pendant l'utilisation.)"
echo "Pour arrêter : Ctrl+C"
echo ""

# Ouvre le navigateur après un court délai (macOS)
if command -v open >/dev/null 2>&1; then
  (sleep 2 && open "$URL") &
fi

npm run dev
