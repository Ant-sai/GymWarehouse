// src/components/Commandes/DailyStats.tsx

import React from 'react';
import type { DailyClosing } from '../../types/commandes.types';

interface DailyStatsProps {
  cashRevenue: number;
  qrRevenue: number;
  accountDebitRevenue: number;
  startingCashFund: number;
  trouValue: number;
  onTrouChange: (value: number) => void;
  dailyClosing: DailyClosing | null;
  loadingClosing: boolean;
}

export const DailyStatsCard: React.FC<DailyStatsProps> = ({
  cashRevenue,
  qrRevenue,
  accountDebitRevenue,
  startingCashFund,
  trouValue,
  onTrouChange,
  dailyClosing,
  loadingClosing
}) => {
  // Calcul du fond de caisse
  const fondCaisse = startingCashFund + cashRevenue - trouValue;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Caisse de début */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-blue-700 font-medium">Caisse de début de journée</span>
          <span className="text-xl font-bold text-blue-700">
            {startingCashFund.toFixed(2)}€
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          (Fond de caisse du jour précédent)
        </div>
      </div>

      <div className="space-y-3">
        {/* Crédit */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Crédit</span>
          <span className="text-xl font-bold text-purple-700">
            {accountDebitRevenue.toFixed(2)}€
          </span>
        </div>

        {/* QR Code */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">QR Code</span>
          <span className="text-xl font-bold text-blue-700">
            {qrRevenue.toFixed(2)}€
          </span>
        </div>

        {/* Espèces */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Espèces</span>
          <span className="text-xl font-bold text-green-700">
            {cashRevenue.toFixed(2)}€
          </span>
        </div>

        {/* Trou */}
        <div className="border-b pb-2">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            Trou
            {loadingClosing && <span className="text-xs text-gray-400">(chargement...)</span>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={trouValue}
              onChange={(e) => onTrouChange(Number(e.target.value))}
              className="w-full px-2 py-1 border rounded text-lg font-bold text-red-600 focus:ring-2 focus:ring-red-300 outline-none"
              disabled={loadingClosing}
              placeholder="0.00"
            />
            <span className="text-lg font-bold text-red-600">€</span>
          </div>
          {dailyClosing && (
            <div className="text-xs text-gray-500 mt-1">
              Dernière mise à jour: {new Date(dailyClosing.closedAt).toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>

        {/* Fond de caisse */}
        <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded">
          <span className="text-gray-700 font-medium">Fond de caisse</span>
          <span className={`text-xl font-bold ${fondCaisse >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {fondCaisse.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
};