import { useState } from 'react';
import { exportAllOrdersToExcel, exportOrdersFromDateToExcel, exportOrdersRangeToExcel } from '../../utils/exportToExcel';

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState<'all' | 'from' | 'range'>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleExport() {
    setLoading(true);
    try {
      if (exportType === 'all') {
        await exportAllOrdersToExcel();
      } else if (exportType === 'from') {
        await exportOrdersFromDateToExcel(startDate);
      } else if (exportType === 'range') {
        await exportOrdersRangeToExcel(startDate, endDate);
      }
      onClose();
    } catch {
      alert('Erreur lors de l\'export des données');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50">
        <h3 className="text-xl font-semibold mb-6 text-black">
          📊 Exporter les commandes
        </h3>

        <div className="space-y-4">
          {/* Option 1: Toutes les commandes */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="exportType"
              value="all"
              checked={exportType === 'all'}
              onChange={(e) => setExportType(e.target.value as 'all')}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Toutes les commandes</div>
              <div className="text-sm text-gray-500">Exporter l'historique complet</div>
            </div>
          </label>

          {/* Option 2: Depuis une date */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="exportType"
              value="from"
              checked={exportType === 'from'}
              onChange={(e) => setExportType(e.target.value as 'from')}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Depuis une date</div>
              <div className="text-sm text-gray-500 mb-2">Exporter depuis une date spécifique</div>
              {exportType === 'from' && (
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              )}
            </div>
          </label>

          {/* Option 3: Plage de dates */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="exportType"
              value="range"
              checked={exportType === 'range'}
              onChange={(e) => setExportType(e.target.value as 'range')}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Plage de dates</div>
              <div className="text-sm text-gray-500 mb-2">Exporter entre deux dates</div>
              {exportType === 'range' && (
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
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Export en cours...
              </>
            ) : (
              <>
                📥 Exporter en Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}