// src/components/Commandes/OrderCard.tsx

import React from 'react';
import type { Order, Product } from '../../types/commandes.types';

interface OrderCardProps {
  order: Order;
  onCancel: (order: Order) => void;
  onEditProduct: (product: Product) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onCancel, 
  onEditProduct 
}) => {
  const getFullName = (user: Order['client']) => {
    if (!user) return "Utilisateur inconnu";
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "QRCODE": return "QR Code";
      case "CASH": return "Espèces";
      case "ACCOUNT_DEBIT": return "Débit compte";
      case "FREE": return "Gratuit";
      default: return method;
    }
  };

  const getPaymentMethodStyle = (method: string) => {
    switch (method) {
      case "CASH":
        return "bg-green-100 text-green-800";
      case "QRCODE":
        return "bg-blue-100 text-blue-800";
      case "ACCOUNT_DEBIT":
        return "bg-purple-100 text-purple-800";
      case "FREE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <p className="text-gray-900 font-medium">
              {getFullName(order.client)}
            </p>
            
            {order.client?.role === "TRAINER" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                Entraîneur
              </span>
            )}
            
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentMethodStyle(order.paymentMethod)}`}>
              {getPaymentMethodLabel(order.paymentMethod)}
            </span>
            
            <p className="text-gray-500 text-sm">
              {new Date(order.date).toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>
        
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-green-600">
            {Number(order.totalAmount).toFixed(2)}€
          </div>
          <button
            onClick={() => onCancel(order)}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors mt-2"
            title="Annuler cette commande (restaure stocks et solde)"
          >
            🗑️ Annuler
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2 text-gray-700">Produits:</h4>
        <div className="space-y-1">
          {order.products?.length > 0 ? (
            order.products.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">
                    {item.product?.name || "Produit inconnu"} × {item.quantity}
                  </span>
                  <button
                    onClick={() => onEditProduct(item.product)}
                    className="p-1 hover:bg-blue-50 rounded transition-colors"
                    title="Modifier ce produit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                <span className="text-gray-600 font-medium">
                  {Number(item.totalPrice).toFixed(2)}€
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">Aucun produit</div>
          )}
        </div>
        
        {order.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
            <strong>Notes:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
};