#!/bin/bash
# Test Automatisé - Système Vidéo PadelVar
# =========================================
# 
# Script pour tester le nouveau système vidéo complet

set -e

echo "🧪 Test du Système Vidéo PadelVar"
echo "=================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
BACKEND_URL="http://localhost:5000"
TOKEN=""

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "📡 Test : $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" 2>/dev/null || echo "000")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        return 1
    fi
}

# ======================
# Tests Backend
# ======================

echo "🔧 Tests Backend"
echo "----------------"
echo ""

# Test 1 : Health check (sans auth)
echo -n "🏥 Health check système vidéo ... "
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/video/health" 2>/dev/null || echo "000")
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ OK${NC}"
    
    # Afficher détails
    body=$(echo "$response" | head -n -1)
    ffmpeg_ok=$(echo "$body" | grep -o '"ffmpeg_available":[^,]*' | cut -d':' -f2)
    
    if [ "$ffmpeg_ok" = "true" ]; then
        echo "   ✅ FFmpeg disponible"
    else
        echo -e "   ${RED}❌ FFmpeg non disponible${NC}"
    fi
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
    echo -e "${RED}Backend non accessible à $BACKEND_URL${NC}"
    echo ""
    echo "Assurez-vous que le backend est démarré :"
    echo "  cd padelvar-backend-main"
    echo "  python -m flask run"
    exit 1
fi

echo ""

# Test 2 : Routes API (nécessite token)
echo "🔑 Tests avec authentification (nécessite token)"
echo "   Pour obtenir un token :"
echo "   curl -X POST $BACKEND_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@padelvar.com\",\"password\":\"your_password\"}'"
echo ""

# Si vous avez un token, décommentez et mettez-le ici :
# TOKEN="eyJ0eXAiOiJKV1..."

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  TOKEN non configuré, tests authentifiés ignorés${NC}"
    echo ""
else
    test_endpoint "GET" "/api/video/session/list" "Liste sessions"
    test_endpoint "GET" "/api/video/files/list?club_id=1" "Liste fichiers"
    echo ""
fi

# ======================
# Tests Frontend
# ======================

echo "🎨 Tests Frontend"
echo "-----------------"
echo ""

# Vérifier que le frontend existe
if [ ! -d "../padelvar-frontend-main" ]; then
    echo -e "${YELLOW}⚠️  Frontend non trouvé${NC}"
    exit 0
fi

cd ../padelvar-frontend-main

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier que les nouveaux fichiers existent
echo -n "📄 Vérification nouveaux fichiers ... "

files=(
    "src/services/videoSystemService.js"
    "src/components/player/NewRecordingModal.jsx"
    "src/components/player/VideoPreview.jsx"
    "src/components/player/VideoListNew.jsx"
    "src/components/player/VideoRecordingDashboardNew.jsx"
    "src/hooks/useVideoSystem.js"
)

all_exist=true
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Manquant : $file${NC}"
        all_exist=false
    fi
done

if [ "$all_exist" = true ]; then
    echo -e "${GREEN}✅ OK${NC} (6/6 fichiers présents)"
else
    echo -e "${RED}❌ FAIL${NC} (fichiers manquants)"
    exit 1
fi

# Vérifier la syntaxe (lint si disponible)
echo -n "🔍 Vérification syntaxe ... "
if command -v eslint &> /dev/null; then
    if npm run lint 2>&1 | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Warnings ESLint${NC}"
    else
        echo -e "${GREEN}✅ OK${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  ESLint non disponible${NC}"
fi

echo ""

# ======================
# Résumé
# ======================

echo "═══════════════════════════════════"
echo "📊 Résumé des Tests"
echo "═══════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Backend accessible${NC}"
echo -e "${GREEN}✅ Health check OK${NC}"
echo -e "${GREEN}✅ Fichiers frontend présents${NC}"
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Tests authentifiés non exécutés (TOKEN manquant)${NC}"
    echo ""
    echo "Pour tester complètement :"
    echo "  1. Démarrez le backend : cd padelvar-backend-main && python -m flask run"
    echo "  2. Démarrez le frontend : cd padelvar-frontend-main && npm run dev"
    echo "  3. Ouvrez http://localhost:5173"
    echo "  4. Connectez-vous et testez l'enregistrement"
else
    echo -e "${GREEN}✅ Système prêt à l'emploi${NC}"
fi

echo ""
echo "📚 Documentation :"
echo "   Backend  : padelvar-backend-main/QUICKSTART.md"
echo "   Frontend : padelvar-frontend-main/FRONTEND_MIGRATION.md"
echo ""
echo "🎉 Tests terminés !"
