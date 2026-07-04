// src/components/Commandes/Modals/RefundModal.tsx

import React, { useState } from 'react';
import type { User } from '../../types/commandes.types';

interface RefundModalProps {
  isOpen: boolean;
  users: User[];
  onClose: () => void;
  onRefund: (userId: number, amount: number, paymentMethod: 'CASH' | 'QRCODE' | null, notes: string) => Promise<void>;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  users,
  onClose,
  onRefund
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRCODE' | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const selectedUser = users.find(u => u.id === selectedUserId);

  const getFullName = (user: User) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Utilisateur sans nom';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert('Veuillez sélectionner un membre');
      return;
    }

    const refundAmount = Number(amount);
    if (isNaN(refundAmount) || refundAmount === 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    if (!paymentMethod) {
      alert('Veuillez sélectionner une méthode de paiement');
      return;
    }

    setSaving(true);

    try {
      await onRefund(selectedUserId, refundAmount, paymentMethod, notes);
      // Réinitialiser
      setSelectedUserId(null);
      setAmount('');
      setPaymentMethod(null);
      setNotes('');

      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible d'effectuer le remboursement";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
    setAmount('');
    setPaymentMethod(null);
    setNotes('');
    onClose();
  };

  const calculateNewBalance = () => {
    if (!selectedUser || !amount) return null;
    return Number(selectedUser.balance) + Number(amount);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/30" 
        onClick={handleClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50"
      >
        <h3 className="text-xl font-semibold mb-6 text-black">
          Remboursement
        </h3>

        <div className="space-y-4">
          {/* Sélection du membre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Membre à rembourser *
            </label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Sélectionner un membre</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {getFullName(user)}
                </option>
              ))}
            </select>
            
            {selectedUser && (
              <div className="text-sm mt-2 text-gray-600">
                Solde actuel:{" "}
                <span className={`font-bold text-base ${Number(selectedUser.balance) >= 0 ? "text-green-700" : "text-red-500"}`}>
                  {Number(selectedUser.balance).toFixed(2)} €
                </span>
              </div>
            )}
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant du remboursement (€) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="0.00"
              required
            />
            
            {calculateNewBalance() !== null && Number(amount) !== 0 && (
              <div className={`text-sm mt-2 ${Number(amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                Nouveau solde: <span className="font-medium">
                  {calculateNewBalance()!.toFixed(2)}€
                </span>
              </div>
            )}
          </div>

          {/* Méthode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moyen de paiement du remboursement *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                💵 Espèces
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QRCODE')}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'QRCODE'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                📱 QR Code
              </button>
            </div>
          </div>

          {/* Notes (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Raison du remboursement..."
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
            {saving ? 'Remboursement...' : 'Effectuer le remboursement'}
          </button>
        </div>
      </form>
    </div>
  );
};