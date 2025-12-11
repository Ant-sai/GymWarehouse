// utils/commandes.utils.ts

import type { User, Order, DailyStats } from '../types/commandes.types';

/**
 * Retourne le nom complet d'un utilisateur
 */
export function getFullName(user: User | undefined): string {
  if (!user) return "Utilisateur inconnu";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
}

/**
 * Retourne le libellé d'une méthode de paiement
 */
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "QRCODE": return "QR Code";
    case "CASH": return "Espèces";
    case "ACCOUNT_DEBIT": return "Débit compte";
    case "FREE": return "Gratuit";
    default: return method;
  }
}

/**
 * Calcule les statistiques journalières à partir des commandes
 */
export function calculateDailyStats(orders: Order[], date: string): DailyStats {
  const dayOrders = orders.filter(order => {
    const orderDate = new Date(order.date).toISOString().split('T')[0];
    return orderDate === date;
  });

  const stats: DailyStats = {
    date,
    orders: dayOrders,
    totalRevenue: 0,
    orderCount: dayOrders.length,
    cashRevenue: 0,
    cardRevenue: 0,
    qrRevenue: 0,
    accountDebitRevenue: 0,
    freeRevenue: 0,
    trainerOrders: 0,
    userOrders: 0,
  };

  dayOrders.forEach(order => {
    const amount = Number(order.totalAmount);

    // Les commandes gratuites ne contribuent pas au chiffre d'affaires
    if (order.paymentMethod !== "FREE") {
      stats.totalRevenue += amount;
    }

    switch (order.paymentMethod) {
      case "CASH":
        stats.cashRevenue += amount;
        break;
      case "QRCODE":
        stats.qrRevenue += amount;
        break;
      case "ACCOUNT_DEBIT":
        stats.accountDebitRevenue += amount;
        break;
      case "FREE":
        break;
    }

    if (order.client?.role === "TRAINER") {
      stats.trainerOrders++;
    } else {
      stats.userOrders++;
    }
  });

  return stats;
}

/**
 * Extrait les dates disponibles des commandes
 */
export function getAvailableDates(orders: Order[]): string[] {
  const dates = new Set<string>();
  orders.forEach(order => {
    const date = new Date(order.date).toISOString().split('T')[0];
    dates.add(date);
  });
  return Array.from(dates).sort().reverse();
}

/**
 * Calcule le fond de caisse
 */
export function calculateFondCaisse(
  startingCashFund: number,
  cashRevenue: number,
  trou: number
): number {
  return startingCashFund + cashRevenue - trou;
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formate une heure pour l'affichage
 */
export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('fr-FR');
}