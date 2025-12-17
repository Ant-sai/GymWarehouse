#!/bin/bash

echo "========================================="
echo "Déploiement automatique - GymWarehouse"
echo "========================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# 1. Backend
info "Déploiement du Backend..."
cd /var/www/Primfit/GymWarehouse/backend || exit 1

info "Git pull..."
git pull origin master
if [ $? -eq 0 ]; then
    success "Backend mis à jour depuis Git"
else
    error "Erreur lors du git pull backend"
    exit 1
fi

info "Mise à jour de la base de données..."
npx prisma db push
if [ $? -eq 0 ]; then
    success "Base de données mise à jour"
else
    error "Erreur lors de prisma db push"
    exit 1
fi

info "Génération du client Prisma..."
npx prisma generate
if [ $? -eq 0 ]; then
    success "Client Prisma généré"
else
    error "Erreur lors de prisma generate"
    exit 1
fi

info "Redémarrage de PM2..."
pm2 restart all
if [ $? -eq 0 ]; then
    success "Services PM2 redémarrés"
else
    error "Erreur lors du redémarrage PM2"
fi

echo ""

# 2. Frontend
info "Déploiement du Frontend..."
cd /var/www/Primfit/GymWarehouse/frontend || exit 1

info "Git pull..."
git pull origin master
if [ $? -eq 0 ]; then
    success "Frontend mis à jour depuis Git"
else
    error "Erreur lors du git pull frontend"
    exit 1
fi

info "Installation des dépendances..."
npm install
if [ $? -eq 0 ]; then
    success "Dépendances installées"
else
    error "Erreur lors de npm install"
fi

info "Build du frontend..."
npm run build
if [ $? -eq 0 ]; then
    success "Frontend build avec succès"
else
    error "Erreur lors du build"
    exit 1
fi

echo ""
echo "========================================="
success "Déploiement terminé avec succès!"
echo "========================================="
echo ""
info "N'oubliez pas de vider le cache de votre navigateur (Ctrl+Shift+R)"
echo ""
info "Derniers commits déployés:"
echo "Backend: $(cd /var/www/Primfit/GymWarehouse/backend && git log --oneline -1)"
echo "Frontend: $(cd /var/www/Primfit/GymWarehouse/frontend && git log --oneline -1)"
