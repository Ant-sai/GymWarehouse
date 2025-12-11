// services/api/users.ts

import { User, RefundData } from '../../types/commandes.types';

export const usersApi = {
  async fetchAll(): Promise<User[]> {
    const response = await fetch("/api/users");
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const data: User[] = await response.json();

    // Tri par ordre alphabétique
    return data.sort((a, b) => {
      const nameA = `${a.lastName || ""} ${a.firstName || ""}`.trim().toLowerCase();
      const nameB = `${b.lastName || ""} ${b.firstName || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, "fr");
    });
  },

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.firstName?.trim() && !userData.lastName?.trim()) {
      throw new Error("Au moins le prénom ou le nom est obligatoire");
    }

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role,
        balance: Number(userData.balance || 0),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    return response.json();
  },

  async refund(refundData: RefundData): Promise<void> {
    const response = await fetch("/api/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refundData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    await response.json();
  }
};