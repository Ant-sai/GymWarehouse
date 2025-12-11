// services/api/orders.ts

import type { Order, CreateOrderData } from '../../types/commandes.types.ts';

export const ordersApi = {
  async fetchAll(): Promise<Order[]> {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  },

  async create(orderData: CreateOrderData): Promise<Order> {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    return response.json();
  },

  async hardDelete(orderId: number, restoreStock: boolean = true): Promise<void> {
    const response = await fetch(`/api/orders/${orderId}/hard`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restoreStock,
        reason: "Annulation demandée"
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
  }
};