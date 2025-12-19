// services/api/dailyClosing.ts

import type { DailyClosing } from '../../types/commandes.types';

export const dailyClosingApi = {
  async fetch(date: string): Promise<{ closing: DailyClosing | null; startingFund: number }> {
    console.log('🔍 [dailyClosingApi] Chargement pour la date:', date);

    try {
      const response = await fetch(`/api/daily-reports/${date}`);

      if (response.ok) {
        const data: DailyClosing = await response.json();
        console.log('✅ [dailyClosingApi] Clôture trouvée:', data);

        return {
          closing: data,
          startingFund: Number(data.startingCash) || 0
        };
      }

      if (response.status === 404) {
        console.log('⚠️ [dailyClosingApi] Pas de clôture, récupération du jour précédent');

        const startingFundResponse = await fetch(`/api/daily-reports/starting-cash/${date}`);

        if (startingFundResponse.ok) {
          const fundData = await startingFundResponse.json();
          const fundValue = Number(fundData.startingCash) || 0;

          console.log('✅ [dailyClosingApi] Fond de départ récupéré:', fundValue);

          return {
            closing: null,
            startingFund: fundValue
          };
        }

        return { closing: null, startingFund: 0 };
      }

      throw new Error(`Erreur HTTP: ${response.status}`);
    } catch (err) {
      console.error('💥 [dailyClosingApi] Erreur:', err);
      return { closing: null, startingFund: 0 };
    }
  },

  async updateTrou(date: string, trou: number): Promise<void> {
    try {
      await fetch(`/api/daily-reports/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trou })
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du trou:', err);
      throw err;
    }
  }
};