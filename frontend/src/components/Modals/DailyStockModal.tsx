import { useState, useEffect } from 'react';

type DailyStockItem = {
  productId: number;
  productName: string;
  mainStock: number;
  dailyStock: number;
  price: number;
  trainerPrice: number;
  dailyStockId: number | null;
};

type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  trainerPrice: number;
  hasDailyStock?: boolean;
};

interface DailyStockModalProps {
  isOpen: boolean;
  date: string;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export function DailyStockModal({ isOpen, date, onClose, onStockUpdated }: DailyStockModalProps) {
  const [stocks, setStocks] = useState<DailyStockItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchDailyStock();
      fetchAllProducts();
    }
  }, [isOpen, date]);

  async function fetchDailyStock() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/daily-stock/${date}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setStocks(data.stocks || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de charger le stock journalier");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllProducts() {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Erreur lors du chargement des produits');
      const data = await response.json();
      setAllProducts(data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  }

  async function handleAdjust(productId: number, adjustment: number) {
    setSaving(productId);
    try {
      const response = await fetch(`/api/daily-stock/${date}/${productId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment })
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      // Refresh the stock data
      await fetchDailyStock();
      onStockUpdated?.();
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de modifier le stock");
    } finally {
      setSaving(null);
    }
  }

  async function handleSetStock(productId: number, quantity: number) {
    setSaving(productId);
    try {
      const response = await fetch(`/api/daily-stock/${date}/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      await fetchDailyStock();
      onStockUpdated?.();
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de modifier le stock");
    } finally {
      setSaving(null);
    }
  }

  async function handleToggleDailyStock(productId: number, enable: boolean) {
    try {
      const response = await fetch(`/api/products/${productId}/daily-stock-toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasDailyStock: enable })
      });
      if (!response.ok) throw new Error('Erreur');

      await fetchAllProducts();
      await fetchDailyStock();
      setShowAddProduct(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de modifier le produit");
    }
  }

  async function handleInitialize(fromPreviousDay: boolean) {
    setLoading(true);
    try {
      const response = await fetch(`/api/daily-stock/${date}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPreviousDay })
      });
      if (!response.ok) throw new Error('Erreur lors de l\'initialisation');

      await fetchDailyStock();
      onStockUpdated?.();
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible d'initialiser le stock");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Products that can be added (have hasDailyStock = false)
  const availableProducts = allProducts.filter(
    p => !p.hasDailyStock && !stocks.find(s => s.productId === p.id)
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-lg p-6 w-[700px] max-h-[85vh] shadow-lg z-50 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-black">
            Stock Journalier
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {formatDate(date)}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
            <button onClick={() => setError("")} className="ml-2 text-red-600 hover:text-red-800">
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucun produit avec suivi de stock journalier</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ajouter des produits
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Actions header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleInitialize(false)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Initialiser avec le stock principal"
                >
                  Depuis stock principal
                </button>
                <button
                  onClick={() => handleInitialize(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Copier depuis le jour précédent"
                >
                  Depuis jour précédent
                </button>
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Ajouter produit
              </button>
            </div>

            {/* Stock list */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-sm font-medium text-gray-700">Produit</th>
                    <th className="text-center px-3 py-2 text-sm font-medium text-gray-700">Stock Principal</th>
                    <th className="text-center px-3 py-2 text-sm font-medium text-gray-700">Stock Journalier</th>
                    <th className="text-center px-3 py-2 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((item) => (
                    <tr key={item.productId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">
                        {item.mainStock}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            value={item.dailyStock}
                            onChange={(e) => handleSetStock(item.productId, parseInt(e.target.value) || 0)}
                            className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                            min="0"
                            disabled={saving === item.productId}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAdjust(item.productId, -1)}
                            disabled={saving === item.productId || item.dailyStock <= 0}
                            className="w-8 h-8 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjust(item.productId, 1)}
                            disabled={saving === item.productId}
                            className="w-8 h-8 rounded bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleToggleDailyStock(item.productId, false)}
                            className="ml-2 w-8 h-8 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm"
                            title="Retirer du suivi journalier"
                          >
                            &times;
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Add product panel */}
        {showAddProduct && (
          <div className="absolute inset-0 bg-white rounded-lg p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-black">Ajouter un produit au suivi journalier</h4>
              <button
                onClick={() => setShowAddProduct(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            {availableProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Tous les produits sont déjà suivis
              </p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {availableProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">Stock: {product.quantity}</div>
                    </div>
                    <button
                      onClick={() => handleToggleDailyStock(product.id, true)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
