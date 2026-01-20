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
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-7 gap-3 items-center">
        {/* Caisse début */}
        <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-blue-600 mb-1">Début</div>
          <div className="text-lg font-bold text-blue-700">
            {startingCashFund.toFixed(2)}€
          </div>
        </div>

        {/* Crédit */}
        <div className="text-center p-2 border-b-2 border-purple-500 h-[72px] flex flex-col justify-center">
          <div className="text-xs text-gray-600 mb-1">Crédit</div>
          <div className="text-lg font-bold text-purple-700">
            {dailyStats.accountDebitRevenue.toFixed(2)}€
          </div>
        </div>

        {/* QR Code */}
        <div className="text-center p-2 border-b-2 border-blue-500 h-[72px] flex flex-col justify-center">
          <div className="text-xs text-gray-600 mb-1">QR Code</div>
          <div className="text-lg font-bold text-blue-700">
            {dailyStats.qrRevenue.toFixed(2)}€
          </div>
        </div>

        {/* Espèces */}
        <div className="text-center p-2 border-b-2 border-green-500 h-[72px] flex flex-col justify-center">
          <div className="text-xs text-gray-600 mb-1">Espèces</div>
          <div className="text-lg font-bold text-green-700">
            {dailyStats.cashRevenue.toFixed(2)}€
          </div>
        </div>

        {/* Trou */}
        <div className="text-center p-2 border-b-2 border-red-500 h-[72px] flex flex-col justify-center">
          <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
            Trou
            <button
              onClick={onTrouClick}
              disabled={loadingClosing}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              title={trouValue !== 0 ? 'Modifier' : 'Ajouter'}
            >
              ✏️
            </button>
          </div>
          <div className={`text-lg font-bold ${trouValue !== 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {trouValue.toFixed(2)}€
          </div>
        </div>

        {/* Retrait */}
        <div className="text-center p-2 border-b-2 border-orange-500 h-[72px] flex flex-col justify-center">
          <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
            Retrait
            <button
              onClick={onRetraitClick}
              disabled={loadingClosing}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              title={retraitValue !== 0 ? 'Modifier' : 'Ajouter'}
            >
              ✏️
            </button>
          </div>
          <div className={`text-lg font-bold ${retraitValue !== 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {retraitValue.toFixed(2)}€
          </div>
        </div>

        {/* Fond de caisse */}
        <div className="text-center p-2 bg-green-50 rounded border border-green-200">
          <div className="text-xs text-green-700 mb-1">Fin</div>
          <div className={`text-lg font-bold ${fondCaisse >= 0 ? "text-green-700" : "text-red-700"}`}>
            {fondCaisse.toFixed(2)}€
          </div>
        </div>
      </div>
    </div>
  );
};
