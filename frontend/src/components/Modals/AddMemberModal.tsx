// src/components/Commandes/Modals/AddMemberModal.tsx

import React, { useState } from 'react';
import type { User } from '../../types/commandes.types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userData: Partial<User>) => Promise<User>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'USER' | 'TRAINER'>('USER');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName.trim() && !lastName.trim()) {
      alert('Au moins le prénom ou le nom est obligatoire');
      return;
    }

    setSaving(true);

    try {
      await onAdd({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
        balance: Number(balance || 0)
      });      
      // Réinitialiser le formulaire
      setFirstName('');
      setLastName('');
      setRole('USER');
      setBalance('');
      
      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible d'ajouter le membre";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setRole('USER');
    setBalance('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={handleClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50"
      >
        <h3 className="text-xl font-semibold mb-4 text-black">
          Ajouter un membre
        </h3>

        <div className="space-y-4">
          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'USER' | 'TRAINER')}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            >
              <option value="USER">Utilisateur</option>
              <option value="TRAINER">Entraîneur</option>
            </select>
          </div>

          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Prénom (optionnel)"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Nom (optionnel)"
            />
          </div>

          {/* Solde initial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solde initial
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Ajout...' : 'Ajouter le membre'}
          </button>
        </div>
      </form>
    </div>
  );
};