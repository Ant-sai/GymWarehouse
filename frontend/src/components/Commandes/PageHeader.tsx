import React from 'react';

interface PageHeaderProps {
  onRefresh: () => Promise<void>;
  onNewOrder: () => void;
  onRefund: () => void;
  onStandby: () => void;
  standbyCount: number;
  loading: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onRefresh,
  onNewOrder,
  onRefund,
  onStandby,
  standbyCount,
  loading,
}) => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-semibold text-black">Vue Journalière</h1>
        <button
          onClick={onRefresh}
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
          disabled={loading}
        >
          {loading ? "⟳" : "↻"} Actualiser
        </button>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRefund}
          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow-sm hover:bg-green-200"
        >
          💰 Remboursement crédit
        </button>
        <button
          onClick={onNewOrder}
          className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
        >
          Nouvelle commande
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
      </div>
    </header>
  );
};
