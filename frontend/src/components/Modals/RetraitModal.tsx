// src/components/Modals/RetraitModal.tsx

import React, { useState, useEffect } from 'react';

interface RetraitModalProps {
  isOpen: boolean;
  currentRetrait: number;
  date: string;
  onClose: () => void;
  onSave: (retrait: number) => Promise<void>;
}

export const RetraitModal: React.FC<RetraitModalProps> = ({
  isOpen,
  currentRetrait,
  date,
  onClose,
  onSave
}) => {
  const [retraitValue, setRetraitValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Initialiser avec un champ vide, sauf si un retrait existe déjà
      if (currentRetrait !== 0) {
        // Inverser le signe pour l'affichage : retrait négatif = valeur positive affichée
        setRetraitValue((-currentRetrait).toString());
      } else {
        setRetraitValue("");
      }
      setError("");
    }
  }, [isOpen, currentRetrait]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = Number(retraitValue);

    if (isNaN(value)) {
      setError("Veuillez entrer un nombre valide");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Inverser le signe :
      // - Si l'utilisateur entre 50 (retrait), on envoie -50
      // - Si l'utilisateur entre -50 (ajout), on envoie +50
      await onSave(-value);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du retrait:', err);
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder le retrait");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer le retrait pour cette journée ?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(0);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la suppression du retrait:', err);
      setError(err instanceof Error ? err.message : "Impossible de supprimer le retrait");
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
          Gérer le retrait de caisse
        </h3>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-4">
            Date: <span className="font-medium">{formatDate(date)}</span>
          </div>


          <label className="block text-sm font-medium text-gray-700 mb-2">
            Montant (€) *
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={retraitValue}
            onChange={(e) => setRetraitValue(e.target.value)}
            className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            required
            placeholder="Ex: 50 (retrait) ou -50 (ajout)"
            autoFocus
            disabled={saving}
          />
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

          {currentRetrait !== 0 && (
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
