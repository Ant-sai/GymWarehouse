import { useState } from 'react';
import {
  exportAllOrdersToExcel,
  exportOrdersFromDateToExcel,
  exportOrdersRangeToExcel,
  exportUserBalancesToExcel,
  exportAllPaymentsToExcel,
  exportPaymentsFromDateToExcel,
  exportPaymentsRangeToExcel,
} from '../../utils/exportToExcel';

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ExportScope = 'orders' | 'payments' | 'balances';
type ExportRange = 'all' | 'from' | 'range';

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [scope, setScope] = useState<ExportScope>('orders');
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleExport() {
    setLoading(true);
    try {
      if (scope === 'balances') {
        await exportUserBalancesToExcel();
      } else if (scope === 'orders') {
        if (exportRange === 'all') await exportAllOrdersToExcel();
        else if (exportRange === 'from') await exportOrdersFromDateToExcel(startDate);
        else await exportOrdersRangeToExcel(startDate, endDate);
      } else {
        if (exportRange === 'all') await exportAllPaymentsToExcel();
        else if (exportRange === 'from') await exportPaymentsFromDateToExcel(startDate);
        else await exportPaymentsRangeToExcel(startDate, endDate);
      }
      onClose();
    } catch (err) {
      console.error('Erreur export:', err);
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'export des données';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[520px] shadow-lg z-50 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-5 text-black">
          📊 Exporter les données
        </h3>

        {/* Choix du type de données */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Type de données</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'orders', label: '🛒 Commandes' },
              { value: 'payments', label: '💳 Forfaits & Abonn.' },
              { value: 'balances', label: '💰 Crédits & Dettes' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={`py-2 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  scope === value
                    ? 'border-[#1E2A47] bg-[#1E2A47] text-white'
                    : 'border-gray-300 text-gray-700 hover:border-[#1E2A47]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Options de plage (pas pour balances) */}
        {scope !== 'balances' && (
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="exportRange"
                checked={exportRange === 'all'}
                onChange={() => setExportRange('all')}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Tout l'historique</div>
                <div className="text-sm text-gray-500">Exporter l'historique complet</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="exportRange"
                checked={exportRange === 'from'}
                onChange={() => setExportRange('from')}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Depuis une date</div>
                <div className="text-sm text-gray-500 mb-2">Exporter depuis une date spécifique</div>
                {exportRange === 'from' && (
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="exportRange"
                checked={exportRange === 'range'}
                onChange={() => setExportRange('range')}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Plage de dates</div>
                <div className="text-sm text-gray-500 mb-2">Exporter entre deux dates</div>
                {exportRange === 'range' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Du :</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Au :</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        {scope === 'balances' && (
          <p className="text-sm text-gray-500 p-4 border-2 rounded-lg bg-orange-50/30 border-orange-200">
            Exporte la balance (crédit / dette) de tous les membres.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <><span className="animate-spin">⏳</span>Export en cours...</> : <>📥 Exporter en Excel</>}
          </button>
        </div>
      </div>
    </div>
  );
}
