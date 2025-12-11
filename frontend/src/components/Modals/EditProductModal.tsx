// src/components/Commandes/Modals/EditProductModal.tsx

import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/commandes.types';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (productId: number, updates: Partial<Product>) => Promise<void>;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave
}) => {
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [trainerPrice, setTrainerPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(product.quantity.toString());
      setPrice(product.price.toString());
      setTrainerPrice(product.trainerPrice?.toString() || '');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(product.id, {
        quantity: Number(quantity),
        price: Number(price),
        trainerPrice: Number(trainerPrice)
      });

      alert('Produit modifié avec succès !');
      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
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
          Modifier {product.name}
        </h3>

        <div className="space-y-4">
          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité *
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
              placeholder="0"
            />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
              placeholder="0.00"
            />
          </div>

          {/* Prix Entraîneur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix Entraîneur *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={trainerPrice}
              onChange={(e) => setTrainerPrice(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-[#1E2A47] text-white hover:bg-[#2A3B5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Modification...' : 'Modifier'}
          </button>
        </div>
      </form>
    </div>
  );
};