// src/components/Modals/TrouModal.tsx

import React, { useState, useEffect } from 'react';

interface TrouModalProps {
  isOpen: boolean;
  currentTrou: number;
  date: string;
  onClose: () => void;
  onSave: (trou: number) => Promise<void>;
}

export const TrouModal: React.FC<TrouModalProps> = ({
  isOpen,
  currentTrou,
  date,
  onClose,
  onSave
}) => {
  const [trouValue, setTrouValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Initialiser avec la valeur absolue (positive) pour l'affichage
      setTrouValue(Math.abs(currentTrou).toString());
      setError("");
    }
  }, [isOpen, currentTrou]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = Number(trouValue);

    if (isNaN(value)) {
      setError("Veuillez entrer un nombre valide");
      return;
    }

    if (value < 0) {
      setError("Le montant doit être positif (il sera automatiquement converti en valeur négative)");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Le trou est toujours négatif, donc on envoie la valeur négative
      await onSave(-Math.abs(value));
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du trou:', err);
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder le trou");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer le trou pour cette journée ?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(0);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression du trou:', err);
      setError(err instanceof Error ? err.message : "Impossible de supprimer le trou");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg p-6 w-[480px] shadow-lg z-50"
      >
        <h3 className="text-xl font-semibold mb-4 text-black">
          Gérer le trou de caisse
        </h3>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-4">
            Date: <span className="font-medium">{formatDate(date)}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Le "trou" est toujours une valeur négative</p>
                <p>Entrez le montant manquant (valeur positive), il sera automatiquement converti en négatif dans la comptabilité.</p>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Montant manquant (€) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={trouValue}
            onChange={(e) => setTrouValue(e.target.value)}
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="0.00"
            required
            autoFocus
            disabled={saving}
          />

          {currentTrou !== 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Valeur actuelle: <span className="font-medium text-red-600">{currentTrou.toFixed(2)}€</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Annuler
          </button>

          {currentTrou !== 0 && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={saving}
            >
              {saving ? "Suppression..." : "Supprimer"}
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
};
