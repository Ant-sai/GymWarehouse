import React, { useState, useEffect } from "react";
import PrimeroseVector from './assets/PrimeroseVector.svg';


export type Product = {
  id: number;
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

  // États pour la modification
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "",
    price: "",
    trainerPrice: "",
  });

  const [saving, setSaving] = useState(false);

  // État pour le filtre de recherche
  const [searchFilter, setSearchFilter] = useState("");

  // État pour le modal d'ajout de stock
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockAdditions, setStockAdditions] = useState<{ [productId: number]: string }>({});
  const [stockSearch, setStockSearch] = useState("");

  // Fonction pour récupérer tous les produits
  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/products");
      
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

      const response = await fetch("/api/products", {
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
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du produit:', err);
    } finally {
      setSaving(false);
    }
  }

  // Fonction pour ouvrir le formulaire de modification
  function openEditForm(product: Product) {
  setEditingProduct(product);
  setEditForm({
    name: product.name,
    quantity: product.quantity.toString(),
    price: product.price.toString(),
    trainerPrice: product.trainerPrice?.toString() || "",
  });
  setShowEditForm(true);
}

  // Fonction pour modifier un produit
  async function handleEditProduct(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingProduct) return;
    
    setSaving(true);
    
    try {
      // Validation côté client
      if (!editForm.price || Number(editForm.price) <= 0) {
        throw new Error("Le prix doit être supérieur à 0");
      }
      if (!editForm.trainerPrice || Number(editForm.trainerPrice) <= 0) {
        throw new Error("Le prix entraîneur doit être supérieur à 0");
      }

      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          quantity: Number(editForm.quantity || 0),
          price: Number(editForm.price),
          trainerPrice: Number(editForm.trainerPrice),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const updatedProduct = await response.json();
      console.log('Produit modifié:', updatedProduct);

      // Mettre à jour le state local
      setProducts((prev) => 
        prev.map((p) => p.id === editingProduct.id ? updatedProduct : p)
      );
      
      // Fermer le formulaire
      setShowEditForm(false);
      setEditingProduct(null);
      
    } catch (err) {
      console.error('Erreur lors de la modification du produit:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce produit ?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Mettre à jour le state local
      setProducts((prev) => prev.filter((p) => p.id !== id));

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

  // Fonction pour filtrer les produits
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Produits filtrés pour le modal d'ajout de stock
  const filteredStockProducts = products.filter(product =>
    product.name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  // Fonction pour ajouter du stock à plusieurs produits
  async function handleAddStock() {
    const additions = Object.entries(stockAdditions)
      .filter(([, qty]) => qty && parseInt(qty) !== 0)
      .map(([productId, qty]) => ({
        productId: parseInt(productId),
        quantity: parseInt(qty)
      }));

    if (additions.length === 0) {
      alert("Veuillez entrer au moins une quantité à ajouter");
      return;
    }

    setSaving(true);
    try {
      // Mettre à jour chaque produit
      for (const addition of additions) {
        const product = products.find(p => p.id === addition.productId);
        if (!product) continue;

        const newQuantity = product.quantity + addition.quantity;

        const response = await fetch(`/api/products/${addition.productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: newQuantity
          }),
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de la mise à jour du produit ${product.name}`);
        }
      }

      // Rafraîchir la liste des produits
      await fetchProducts();

      // Fermer le modal et réinitialiser
      setShowAddStockModal(false);
      setStockAdditions({});
      setStockSearch("");
    } catch (err) {
      console.error('Erreur lors de l\'ajout de stock:', err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'ajout de stock";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main */}
      <main className="p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#1E2A47]">Stock</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddStockModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700"
            >
              + Ajouter du stock
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
            >
              Ajouter un produit
            </button>
            <img
              src={PrimeroseVector}
              alt="Gym Warehouse"
              className="h-10 w-auto"
            />
          </div>
        </header>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title="Effacer la recherche"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          {searchFilter && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredProducts.length} produit(s) trouvé(s) pour "{searchFilter}"
            </div>
          )}
        </div>

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
              {filteredProducts.length === 0 && products.length > 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucun produit ne correspond à votre recherche</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Essayez avec d'autres mots-clés ou effacez le filtre
                  </div>
                </div>
              )}

              {products.length === 0 && !searchFilter && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucun produit dans la base de données</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Ajoutez votre premier produit en cliquant sur "Ajouter un produit"
                  </div>
                </div>
              )}
              
              {filteredProducts.map((p) => (
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
                    <div className="flex items-center gap-2 ml-2">
                      <button 
                        onClick={() => openEditForm(p)} 
                        className="p-1 hover:bg-blue-50 rounded"
                        title="Modifier ce produit"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="p-1 hover:bg-red-50 rounded"
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
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal form ajout */}
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

        {/* Modal form modification */}
        {showEditForm && editingProduct && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowEditForm(false)} />
            <form
              onSubmit={handleEditProduct}
              className="relative bg-white rounded-lg p-6 w-[480px] shadow-lg z-50"
            >
              <h3 className="text-xl font-semibold mb-4 text-black">Modifier {editingProduct.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="Nom du produit"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Quantité *</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
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
                    value={editForm.trainerPrice}
                    onChange={(e) => setEditForm({ ...editForm, trainerPrice: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
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
                  {saving ? "Modification..." : "Modifier"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal ajout de stock */}
        {showAddStockModal && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => {
              setShowAddStockModal(false);
              setStockAdditions({});
              setStockSearch("");
            }} />
            <div className="relative bg-white rounded-lg p-6 w-[600px] max-h-[80vh] shadow-lg z-50 flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-black">Ajouter du stock</h3>

              {/* Barre de recherche */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Liste des produits */}
              <div className="flex-1 overflow-y-auto border rounded mb-4">
                {filteredStockProducts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucun produit trouvé
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-sm font-medium text-gray-700">Produit</th>
                        <th className="text-center px-4 py-2 text-sm font-medium text-gray-700">Stock actuel</th>
                        <th className="text-center px-4 py-2 text-sm font-medium text-gray-700">Quantité à ajouter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStockProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={product.quantity <= 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                value={stockAdditions[product.id] || ""}
                                onChange={(e) => setStockAdditions(prev => ({
                                  ...prev,
                                  [product.id]: e.target.value
                                }))}
                                placeholder="0"
                                className="w-20 text-center border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Résumé des ajouts */}
              {Object.entries(stockAdditions).filter(([, qty]) => qty && parseInt(qty) !== 0).length > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-2">Résumé des ajouts:</div>
                  <div className="text-sm text-green-700 space-y-1">
                    {Object.entries(stockAdditions)
                      .filter(([, qty]) => qty && parseInt(qty) !== 0)
                      .map(([productId, qty]) => {
                        const product = products.find(p => p.id === parseInt(productId));
                        const qtyNum = parseInt(qty);
                        return product ? (
                          <div key={productId}>
                            {product.name}: {qtyNum > 0 ? '+' : ''}{qtyNum} → Nouveau stock: {product.quantity + qtyNum}
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStockModal(false);
                    setStockAdditions({});
                    setStockSearch("");
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddStock}
                  disabled={saving || Object.entries(stockAdditions).filter(([, qty]) => qty && parseInt(qty) !== 0).length === 0}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Enregistrement..." : "Ajouter le stock"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
