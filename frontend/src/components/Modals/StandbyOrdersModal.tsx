// src/components/Commandes/Modals/StandbyOrdersModal.tsx

import React from 'react';
import type { User, Product, OrderItem } from '../../types/commandes.types';

export interface StandbyOrder {
  id: string;
  user: User;
  cart: OrderItem[];
  paymentMethod: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE";
  notes: string;
  discountValue: number;
  discountComment: string;
  timestamp: number;
}

interface StandbyOrdersModalProps {
  isOpen: boolean;
  standbyOrders: StandbyOrder[];
  products: Product[];
  onClose: () => void;
  onResume: (standbyId: string) => void;
  onDelete: (standbyId: string) => void;
}

export const StandbyOrdersModal: React.FC<StandbyOrdersModalProps> = ({
  isOpen,
  standbyOrders,
  products,
  onClose,
  onResume,
  onDelete
}) => {
  if (!isOpen) return null;

  const getFullName = (user: User) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Utilisateur sans nom';
  };

  const calculateTotal = (order: StandbyOrder) => {
    const subtotal = order.cart.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    return Math.max(0, subtotal - order.discountValue);
  };

  const handleDelete = (standbyId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette commande en stand-by ?')) {
      onDelete(standbyId);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto shadow-lg z-50">
        <h3 className="text-xl font-semibold mb-4 text-black">
          Commandes en stand-by ({standbyOrders.length})
        </h3>

        {standbyOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune commande en stand-by</p>
          </div>
        ) : (
          <div className="space-y-4">
            {standbyOrders.map((order) => {
              const total = calculateTotal(order);

              return (
                <div 
                  key={order.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-black">
                        {getFullName(order.user)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(order.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {total.toFixed(2)}€
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.cart.length} article{order.cart.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mb-3 space-y-1">
                    {order.cart.map((item, idx) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div 
                          key={idx} 
                          className="text-sm text-gray-600 flex justify-between py-1"
                        >
                          <span>
                            {product?.name || 'Produit inconnu'} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            {(item.quantity * item.unitPrice).toFixed(2)}€
                          </span>
                        </div>
                      );
                    })}

                    {/* Discount */}
                    {order.discountValue > 0 && (
                      <div className="text-sm text-red-600 flex justify-between py-1 border-t">
                        <span>
                          Réduction
                          {order.discountComment && ` (${order.discountComment})`}
                        </span>
                        <span className="font-medium">
                          -{order.discountValue.toFixed(2)}€
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                      📝 {order.notes}
                    </p>
                  )}

                  {/* Payment Method */}
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      order.paymentMethod === 'CASH'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentMethod === 'QRCODE'
                        ? 'bg-blue-100 text-blue-800'
                        : order.paymentMethod === 'ACCOUNT_DEBIT'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentMethod === 'CASH' && '💵 Espèces'}
                      {order.paymentMethod === 'QRCODE' && '📱 QR Code'}
                      {order.paymentMethod === 'ACCOUNT_DEBIT' && '💳 Débit compte'}
                      {order.paymentMethod === 'FREE' && '🎁 Gratuit'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onResume(order.id)}
                      className="flex-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
                    >
                      ▶️ Reprendre
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="px-4 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};