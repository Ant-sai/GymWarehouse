import React from 'react';
import PrimeroseVector from '../../assets/PrimeroseVector.svg';

interface PageHeaderProps {
  onRefresh: () => Promise<void>;
  onNewOrder: () => void;
  onRefund: () => void;
  onStandby: () => void;
  standbyCount: number;
  loading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onNewOrder,
  onRefund,
  onStandby,
  standbyCount,
  selectedDate,
  onDateChange,
}) => {
  return (
    <header className="flex items-center justify-between mb-6">
      {/* Titre et Date picker à gauche */}
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-semibold text-[#1E2A47]">Commandes</h1>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Boutons et image à droite */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewOrder}
          className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
        >
          Nouvelle commande
        </button>
        <button
          onClick={onRefund}
          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow-sm hover:bg-green-200"
        >
          💰 Remboursement crédit
        </button>
        <button
          onClick={onStandby}
          className="relative px-6 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-medium shadow-sm"
        >
          ⏸️ Stand-by{" "}
          {standbyCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {standbyCount}
            </span>
          )}
        </button>
        <img
          src={PrimeroseVector}
          alt="Gym Warehouse"
          className="h-10 w-auto ml-2"
        />
      </div>
    </header>
  );
};
