import React from 'react';
import type { Order, Product } from '../../Commandes';

interface OrderCardProps {
  order: Order;
  onCancel: (order: Order) => Promise<void>;
  onEditProduct: (product: Product) => void;
  onEditOrder: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onCancel,
  onEditProduct,
  onEditOrder,
}) => {
  const getFullName = (user: typeof order.client) => {
    if (!user) return "Utilisateur inconnu";
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "QRCODE":
        return "QR Code";
      case "CASH":
        return "Espèces";
      case "ACCOUNT_DEBIT":
        return "Débit compte";
      case "FREE":
        return "Gratuit";
      default:
        return method;
    }
  };

  const handleCancel = async () => {
    if (confirm("Voulez-vous vraiment annuler cette commande ? Le stock et le solde seront restaurés.")) {
      await onCancel(order);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <p className="text-gray-900 font-medium">
              {order.client ? getFullName(order.client) : "Client inconnu"}
            </p>
            {order.client?.role === "TRAINER" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Entraîneur
              </span>
            )}
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                order.paymentMethod === "CASH"
                  ? "bg-green-100 text-green-800"
                  : order.paymentMethod === "QRCODE"
                  ? "bg-blue-100 text-blue-800"
                  : order.paymentMethod === "ACCOUNT_DEBIT"
                  ? "bg-purple-100 text-purple-800"
                  : order.paymentMethod === "FREE"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {getPaymentMethodLabel(order.paymentMethod)}
            </span>
            <p className="text-gray-500 text-sm">
              {new Date(order.date).toLocaleTimeString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-green-600">
            {Number(order.totalAmount).toFixed(2)}€
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onEditOrder(order)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
              title="Modifier cette commande"
            >
              ✏️
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
              title="Annuler cette commande (restaure stocks et solde)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="font-medium">Produits:</span>
          {order.products?.map((item, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded"
            >
              <span>
                {item.product?.name || "Produit inconnu"} × {item.quantity}
              </span>
              <span className="text-gray-600">({Number(item.totalPrice).toFixed(2)}€)</span>
              <button
                onClick={() => onEditProduct(item.product)}
                className="p-0.5 hover:bg-blue-50 rounded"
                title="Modifier ce produit"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )) || <div className="text-gray-500">Aucun produit</div>}
        </div>
        {order.notes && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>Notes:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
};
