import React from 'react';
import type { Order } from '../../Commandes';

type DailyClosing = {
  id: number;
  date: string;
  cashRevenue: number;
  qrRevenue: number;
  creditRevenue: number;
  trou: number;
  fondCaisse: number;
  startingCashFund: number;
  notes?: string;
  closedBy?: string;
  closedAt: string;
};

interface DailyStatisticsProps {
  selectedDate: string;
  orders: Order[];
  dailyClosing: DailyClosing | null;
  loadingClosing: boolean;
  trouValue: number;
  onTrouChange: (value: number) => void;
  startingCashFund: number;
}

export const DailyStatistics: React.FC<DailyStatisticsProps> = ({
  selectedDate,
  orders,
  dailyClosing,
  loadingClosing,
  trouValue,
  onTrouChange,
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
  const fondCaisse = startingCashFund + dailyStats.cashRevenue - trouValue;

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
          <div className="text-sm text-gray-600 flex items-center gap-2">
            Trou
            {loadingClosing && <span className="text-xs">(chargement...)</span>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={trouValue}
              onChange={(e) => onTrouChange(Number(e.target.value))}
              className="w-full px-2 py-1 border rounded text-lg font-bold text-red-600"
              disabled={loadingClosing}
              placeholder="0.00"
            />
            <span className="text-lg font-bold text-red-600">€</span>
          </div>
          {dailyClosing && (
            <div className="text-xs text-gray-500 mt-1">
              Dernière mise à jour:{" "}
              {new Date(dailyClosing.closedAt).toLocaleTimeString("fr-FR")}
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
