#!/bin/bash

echo "========================================="
echo "Vérification du déploiement - GymWarehouse"
echo "========================================="
echo ""

echo "1. Vérification de la branche Git (Backend)..."
cd /var/www/Primfit/GymWarehouse/backend
echo "Branche actuelle: $(git branch --show-current)"
echo "Dernier commit: $(git log --oneline -1)"
echo ""

echo "2. Vérification de la branche Git (Frontend)..."
cd /var/www/Primfit/GymWarehouse/frontend
echo "Branche actuelle: $(git branch --show-current)"
echo "Dernier commit: $(git log --oneline -1)"
echo ""

echo "3. Vérification de la présence de la checkbox dans le code..."
if grep -q "Appliquer le prix entraîneur sur toute la commande" src/components/Modals/OrderFormModal.tsx; then
    echo "✓ La checkbox est présente dans OrderFormModal.tsx"
else
    echo "✗ La checkbox N'EST PAS présente dans OrderFormModal.tsx"
fi
echo ""

echo "4. Vérification du build frontend..."
if [ -d "dist" ]; then
    echo "✓ Le dossier dist existe"
    echo "Date du dernier build: $(stat -c %y dist 2>/dev/null || stat -f %Sm dist)"
else
    echo "✗ Le dossier dist N'existe PAS"
fi
echo ""

echo "5. Vérification de useTrainerPrice dans le schema Prisma..."
cd /var/www/Primfit/GymWarehouse/backend
if grep -q "useTrainerPrice" prisma/schema.prisma; then
    echo "✓ useTrainerPrice est présent dans schema.prisma"
else
    echo "✗ useTrainerPrice N'EST PAS présent dans schema.prisma"
fi
echo ""

echo "6. Vérification de PM2..."
pm2 list
echo ""

echo "========================================="
echo "Instructions de déploiement complet:"
echo "========================================="
echo ""
echo "Si des éléments sont manquants, exécutez:"
echo ""
echo "cd /var/www/Primfit/GymWarehouse/backend"
echo "git pull origin master"
echo "npx prisma db push"
echo "npx prisma generate"
echo "pm2 restart all"
echo ""
echo "cd /var/www/Primfit/GymWarehouse/frontend"
echo "git pull origin master"
echo "npm install"
echo "npm run build"
echo ""
echo "Si le problème persiste, videz le cache du navigateur (Ctrl+Shift+R)"
