import React from 'react';
import { OrderCard } from './OrderCard';
import type { Order, Product } from '../../Commandes';

interface OrdersListProps {
  selectedDate: string;
  orders: Order[];
  loading: boolean;
  error: string | null;
  onCancelOrder: (order: Order) => Promise<void>;
  onEditProduct: (product: Product) => void;
  onEditOrder: (order: Order) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({
  selectedDate,
  orders,
  loading,
  error,
  onCancelOrder,
  onEditProduct,
  onEditOrder,
}) => {
  const dayOrders = orders.filter(order => {
    const orderDate = new Date(order.date).toISOString().split('T')[0];
    return orderDate === selectedDate;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Chargement des commandes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="text-red-700 font-medium">Erreur</div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {dayOrders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Aucune commande pour cette date</div>
          <div className="text-sm text-gray-400 mt-2">
            Sélectionnez une autre date ou créez une nouvelle commande
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {dayOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={onCancelOrder}
              onEditProduct={onEditProduct}
              onEditOrder={onEditOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};
