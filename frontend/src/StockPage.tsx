import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';

export type Product = {
  id: number; // Changé de string à number car Prisma utilise des IDs numériques
  name: string;
  quantity: number;
  description?: string;
  price: number;
  trainerPrice?: number;
  cost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    description: "",
    price: "",
    trainerPrice: "",
  });

  const [saving, setSaving] = useState(false);

  // Fonction pour récupérer tous les produits
  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://localhost:3000/api/products");
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Produits récupérés:', data);
      setProducts(data);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de récupérer les produits";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Charger les produits au montage du composant
  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleAddProduct(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    
    try {
      // Validation côté client
      if (!form.name?.trim()) {
        throw new Error("Le nom du produit est obligatoire");
      }
      if (!form.price || Number(form.price) <= 0) {
        throw new Error("Le prix doit être supérieur à 0");
      }
      if (!form.trainerPrice || Number(form.trainerPrice) <= 0) {
        throw new Error("Le prix entraîneur doit être supérieur à 0");
      }

      console.log('Envoi des données:', {
        name: form.name,
        description: form.description || null,
        quantity: Number(form.quantity || 0),
        price: Number(form.price),
        trainerPrice: Number(form.trainerPrice),
        cost: 0,
        isActive: true,
      });

      const response = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          quantity: Number(form.quantity || 0),
          price: Number(form.price),
          trainerPrice: Number(form.trainerPrice),
          cost: 0,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const newProduct = await response.json();
      console.log('Produit créé:', newProduct);

      // Mettre à jour le state local
      setProducts((prev) => [newProduct, ...prev]);
      
      // Réinitialiser le formulaire
      setShowForm(false);
      setForm({ 
        name: "", 
        quantity: "", 
        description: "", 
        price: "", 
        trainerPrice: "" 
      });

      alert("Produit ajouté avec succès !");
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du produit:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible d'ajouter le produit.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce produit ?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Mettre à jour le state local
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Produit supprimé avec succès !");

    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de supprimer le produit";
      alert(errorMessage);
    }
  }

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    fetchProducts();
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
<aside className="w-60 bg-[#1E2A47] text-white p-8">
  <h2 className="text-xl font-semibold mb-8">Gym Warehouse</h2>
  <nav className="space-y-4 text-sm opacity-90">
    <div className="font-medium">Stock</div>
    <Link to="/membres" className="block text-[#AAB4C3] hover:text-white">
      Membres
    </Link>
    <div className="text-[#AAB4C3]">Commandes</div>
  </nav>
</aside>

      {/* Main */}
      <main className="flex-1 p-12">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-black">Stock</h1>
            <button
              onClick={handleRefresh}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              disabled={loading}
            >
              {loading ? "⟳" : "↻"} Actualiser
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
          >
            Ajouter un produit
          </button>
        </header>

        {/* États de chargement et d'erreur */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Chargement des produits...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700 font-medium">Erreur</div>
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={handleRefresh}
              className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Table header */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-6 gap-6 px-4 text-sm font-medium text-gray-700 mb-4">
              <div>Produits</div>
              <div>Quantités</div>
              <div className="col-span-2">Description</div>
              <div>Prix</div>
              <div>Prix Entraîneur</div>
            </div>

            {/* Content */}
            <div className="space-y-4 px-4">
              {products.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucun produit dans la base de données</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Ajoutez votre premier produit en cliquant sur "Ajouter un produit"
                  </div>
                </div>
              )}
              
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg p-4 shadow-sm grid grid-cols-6 items-center text-black hover:shadow-md transition-shadow"
                >
                  <div className="truncate font-medium">{p.name}</div>
                  <div className={p.quantity === 0 ? "text-red-600 font-medium" : ""}>{p.quantity}</div>
                  <div className="col-span-2 truncate text-sm text-gray-600">
                    {p.description || "Aucune description"}
                  </div>
                  <div>{Number(p.price).toFixed(2)} €</div>
                  <div className="flex items-center justify-between">
                    <span>{p.trainerPrice ? `${Number(p.trainerPrice).toFixed(2)} €` : "-"}</span>
                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className="p-1 ml-2 hover:bg-red-50 rounded"
                      title="Supprimer ce produit"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
                        <path
                          d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"
                          stroke="#E74C3C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M10 11v6" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14 11v6" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <form
              onSubmit={handleAddProduct}
              className="relative bg-white rounded-lg p-6 w-[720px] shadow-lg z-50"
            >
              <h3 className="text-xl font-semibold mb-4 text-black">Ajouter un produit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="Nom du produit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantité *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Description du produit (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix Entraîneur *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.trainerPrice}
                    onChange={(e) => setForm({ ...form, trainerPrice: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#1E2A47] text-white hover:bg-[#2A3B5A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Enregistrement..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}