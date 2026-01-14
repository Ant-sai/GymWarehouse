import React from 'react';
import type { Order } from '../../Commandes';

type DailyClosing = {
  id: number;
  date: string;
  cashRevenue: number;
  qrRevenue: number;
  creditRevenue: number;
  trou: number;
  retrait: number;
  startingCash: number;
  endingCash: number;
  notes?: string;
  closedBy?: number;
  createdAt: string;
  updatedAt: string;
};

interface DailyStatisticsProps {
  selectedDate: string;
  orders: Order[];
  dailyClosing: DailyClosing | null;
  loadingClosing: boolean;
  trouValue: number;
  retraitValue: number;
  onTrouClick: () => void;
  onRetraitClick: () => void;
  startingCashFund: number;
}

export const DailyStatistics: React.FC<DailyStatisticsProps> = ({
  selectedDate,
  orders,
  dailyClosing,
  loadingClosing,
  trouValue,
  retraitValue,
  onTrouClick,
  onRetraitClick,
  startingCashFund,
}) => {
  const getDailyStats = () => {
    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.date).toISOString().split("T")[0];
      return orderDate === selectedDate;
    });

    const stats = {
      cashRevenue: 0,
      qrRevenue: 0,
      accountDebitRevenue: 0,
    };

    dayOrders.forEach((order) => {
      const amount = Number(order.totalAmount);

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
      }
    });

    return stats;
  };

  const dailyStats = getDailyStats();
  // Le trou et le retrait sont stockés en négatif (ex: -50 pour 50€ manquants/retirés)
  // Formule: Fond de fin = Fond de début + Espèces du jour + Trou (négatif) + Retrait (négatif)
  // Exemple: 100€ + 200€ + (-50€) + (-30€) = 220€
  const fondCaisse = startingCashFund + dailyStats.cashRevenue + trouValue + retraitValue;

  // Log pour déboguer le calcul
  console.log(`💰 [DailyStatistics] ${selectedDate}:`, {
    startingCashFund,
    cashRevenue: dailyStats.cashRevenue,
    trouValue,
    retraitValue,
    fondCaisse,
    calcul: `${startingCashFund}€ + ${dailyStats.cashRevenue}€ + ${trouValue}€ + ${retraitValue}€ = ${fondCaisse}€`
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-blue-700 font-medium">
            Caisse de début de journée
          </span>
          <span className="text-xl font-bold text-blue-700">
            {startingCashFund.toFixed(2)}€
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          (Fond de caisse du jour précédent)
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Crédit</span>
          <span className="text-xl font-bold text-purple-700">
            {dailyStats.accountDebitRevenue.toFixed(2)}€
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">QR Code</span>
          <span className="text-xl font-bold text-blue-700">
            {dailyStats.qrRevenue.toFixed(2)}€
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Espèces</span>
          <span className="text-xl font-bold text-green-700">
            {dailyStats.cashRevenue.toFixed(2)}€
          </span>
        </div>
        <div className="border-b pb-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              Trou de caisse
              {loadingClosing && <span className="text-xs">(chargement...)</span>}
            </div>
            <button
              onClick={onTrouClick}
              disabled={loadingClosing}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {trouValue !== 0 ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xl font-bold ${trouValue !== 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {trouValue.toFixed(2)}€
            </span>
            {trouValue < 0 && (
              <span className="text-xs text-gray-500">
                (manquant)
              </span>
            )}
            {trouValue > 0 && (
              <span className="text-xs text-gray-500">
                (surplus)
              </span>
            )}
          </div>
          {dailyClosing && trouValue !== 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Dernière mise à jour:{" "}
              {new Date(dailyClosing.updatedAt).toLocaleTimeString("fr-FR")}
            </div>
          )}
        </div>
        <div className="border-b pb-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              Retrait de caisse
              {loadingClosing && <span className="text-xs">(chargement...)</span>}
            </div>
            <button
              onClick={onRetraitClick}
              disabled={loadingClosing}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {retraitValue !== 0 ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xl font-bold ${retraitValue !== 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {retraitValue.toFixed(2)}€
            </span>
            {retraitValue < 0 && (
              <span className="text-xs text-gray-500">
                (retiré)
              </span>
            )}
            {retraitValue > 0 && (
              <span className="text-xs text-gray-500">
                (ajouté)
              </span>
            )}
          </div>
          {dailyClosing && retraitValue !== 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Dernière mise à jour:{" "}
              {new Date(dailyClosing.updatedAt).toLocaleTimeString("fr-FR")}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded">
          <span className="text-gray-700 font-medium">Fond de caisse</span>
          <span
            className={`text-xl font-bold ${
              fondCaisse >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {fondCaisse.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
};
