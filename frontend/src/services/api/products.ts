// services/api/products.ts

import { Product } from '../../types/commandes.types';

export const productsApi = {
  async fetchAll(): Promise<Product[]> {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const data = await response.json();
    return data.filter((p: Product) => p.isActive);
  },

  async update(productId: number, updates: Partial<Product>): Promise<Product> {
    const response = await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: updates.quantity !== undefined ? Number(updates.quantity) : undefined,
        price: updates.price !== undefined ? Number(updates.price) : undefined,
        trainerPrice: updates.trainerPrice !== undefined ? Number(updates.trainerPrice) : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }
};