// src/components/Modals/AddMemberModal.tsx

import React, { useState } from 'react';
import type { User } from '../../types/commandes.types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userData: Partial<User>) => Promise<User>;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  role: 'USER' as 'USER' | 'TRAINER',
  balance: '',
  dateOfBirth: '',
  postalCode: '',
  gender: '' as '' | 'HOMME' | 'FEMME',
  phone: '',
  email: '',
  notes: '',
};

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() && !form.lastName.trim()) {
      alert('Au moins le prénom ou le nom est obligatoire');
      return;
    }

    setSaving(true);

    try {
      await onAdd({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        role: form.role,
        balance: Number(form.balance || 0),
        dateOfBirth: form.dateOfBirth || null,
        postalCode: form.postalCode || null,
        gender: form.gender || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      });

      setForm(emptyForm);
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
    setForm(emptyForm);
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
        className="relative bg-white rounded-lg p-6 w-[720px] shadow-lg z-50"
      >
        <h3 className="text-xl font-semibold mb-4 text-black">
          Ajouter un membre
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rôle *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'USER' | 'TRAINER' })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="USER">Utilisateur</option>
              <option value="TRAINER">Entraîneur</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Prénom (optionnel)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nom (optionnel)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Solde initial</label>
            <input
              type="number"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Code postal</label>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sexe</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as '' | 'HOMME' | 'FEMME' })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Non renseigné</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GSM</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="0470 00 00 00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="exemple@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Commentaire</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Commentaire (optionnel)"
              rows={3}
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
