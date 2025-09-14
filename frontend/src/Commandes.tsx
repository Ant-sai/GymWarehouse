import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

export type User = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "USER" | "TRAINER";
  balance: number;
};

export type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  trainerPrice: number;
  isActive: boolean;
};

export type OrderItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: number;
  client: User;
  totalAmount: number;
  date: string;
  paymentMethod: "QRCODE" | "CASH" | "CREDITCARD" | "ACCOUNT_DEBIT";
  notes?: string;
  products: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"QRCODE" | "CASH" | "CREDITCARD" | "ACCOUNT_DEBIT">("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Charger toutes les données au montage
  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
  }, []);

  async function fetchOrders() {
    try {
      const response = await fetch("http://localhost:3000/api/orders");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des commandes:', err);
      setError("Impossible de récupérer les commandes");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch("http://localhost:3000/api/users");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch("http://localhost:3000/api/products");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setProducts(data.filter((p: Product) => p.isActive));
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
    }
  }

  function addToCart(product: Product) {
    const price = selectedUser?.role === "TRAINER" ? product.trainerPrice : product.price;
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, unitPrice: price }]);
    }
  }

  function updateCartQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  }

  function calculateTotal() {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }

  async function handleCreateOrder() {
    if (!selectedUser) {
      alert("Veuillez sélectionner un client");
      return;
    }
    if (cart.length === 0) {
      alert("Veuillez ajouter au moins un produit");
      return;
    }

    const total = calculateTotal();
    if (paymentMethod === "ACCOUNT_DEBIT" && Number(selectedUser.balance) < total) {
      alert(`Solde insuffisant. Solde disponible: ${Number(selectedUser.balance).toFixed(2)}€`);
      return;
    }

    setSaving(true);
    try {
      const orderData = {
        clientId: selectedUser.id,
        paymentMethod: paymentMethod,
        notes: notes,
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const newOrder = await response.json();
      setOrders([newOrder, ...orders]);

      // Réinitialiser le formulaire
      setShowForm(false);
      setSelectedUser(null);
      setCart([]);
      setPaymentMethod("CASH");
      setNotes("");

      alert("Commande créée avec succès !");

      // Recharger les données pour avoir les stocks à jour
      fetchProducts();
      fetchUsers(); // Pour le solde mis à jour si paiement par compte

    } catch (err) {
      console.error('Erreur lors de la création de la commande:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de créer la commande";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  const getFullName = (user: User | undefined) => {
    if (!user) return "Utilisateur inconnu";
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : user.email;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "QRCODE": return "QR Code";
      case "CASH": return "Espèces";
      case "CREDITCARD": return "Carte bancaire";
      case "ACCOUNT_DEBIT": return "Débit compte";
      default: return method;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E2A47] text-white p-8">
        <h2 className="text-xl font-semibold mb-8">Gym Warehouse</h2>
        <nav className="space-y-4 text-sm">
          <Link to="/stock" className="block text-[#AAB4C3] hover:text-white transition-colors">
            Stock
          </Link>
          <Link to="/membres" className="block text-[#AAB4C3] hover:text-white transition-colors">
            Membres
          </Link>
          <div className="font-medium text-white">Commandes</div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-12">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-black">Commandes</h1>
            <button
              onClick={fetchOrders}
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
            Nouvelle commande
          </button>
        </header>

        {/* États de chargement et d'erreur */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Chargement des commandes...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700 font-medium">Erreur</div>
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Liste des commandes */}
        {!loading && !error && (
          <div className="space-y-4">
            {orders.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">Aucune commande</div>
                <div className="text-sm text-gray-400 mt-2">
                  Créez votre première commande en cliquant sur "Nouvelle commande"
                </div>
              </div>
            )}

            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Commande #{order.id}</h3>
                    <p className="text-gray-600">
                      Client: {order.client ? getFullName(order.client) : "Client inconnu"}
                      {order.client?.role === "TRAINER" && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Entraîneur
                        </span>
                      )}
                    </p>
                    <p className="text-gray-600">
                      Date: {new Date(order.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {Number(order.totalAmount).toFixed(2)}€
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${order.paymentMethod === "ACCOUNT_DEBIT"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                      }`}>
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Produits:</h4>
                  <div className="space-y-1">
                    {order.products?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product?.name || "Produit inconnu"} × {item.quantity}</span>
                        <span>{Number(item.totalPrice).toFixed(2)}€</span>
                      </div>
                    )) || <div className="text-gray-500">Aucun produit</div>}
                  </div>
                  {order.notes && (
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal nouvelle commande */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[900px] max-h-[90vh] overflow-y-auto shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-6 text-black">Nouvelle commande</h3>

              {/* Sélection du client */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  value={selectedUser?.id || ""}
                  onChange={(e) => {
                    const user = users.find(u => u.id === Number(e.target.value));
                    setSelectedUser(user || null);
                    setCart([]); // Réinitialiser le panier quand on change de client
                  }}
                  className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {users.filter(user => user != null).map(user => (
                    <option key={user.id} value={user.id}>
                      {getFullName(user)} - {Number(user.balance).toFixed(2)}€
                      {user.role === "TRAINER" ? " (Entraîneur)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection des produits */}
              {selectedUser && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produits disponibles</label>
                  <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded p-4">
                    {products.map(product => (
                      <div key={product.id} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              {selectedUser.role === "TRAINER" ? product.trainerPrice : product.price}€
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              className="mt-1 bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                              disabled={product.quantity <= 0}
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panier */}
              {cart.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Panier</label>
                  <div className="border rounded p-4">
                    {cart.map(item => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <span className="font-medium">{product?.name}</span>
                            <span className="text-gray-600 ml-2">({item.unitPrice}€/unité)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              className="bg-gray-200 px-2 py-1 rounded text-sm"
                            >
                              -
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              className="bg-gray-200 px-2 py-1 rounded text-sm"
                            >
                              +
                            </button>
                            <span className="ml-4 font-medium">
                              {(item.quantity * item.unitPrice).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 text-right">
                      <div className="text-xl font-bold">
                        Total: {calculateTotal().toFixed(2)}€
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Méthode de paiement */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CASH">Espèces</option>
                  <option value="CREDITCARD">Carte bancaire</option>
                  <option value="QRCODE">QR Code</option>
                  <option value="ACCOUNT_DEBIT">Débit compte</option>
                </select>
                {paymentMethod === "ACCOUNT_DEBIT" && selectedUser && (
                  <p className="text-sm text-gray-600 mt-1">
                    Solde disponible: {Number(selectedUser.balance).toFixed(2)}€
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Commentaires sur la commande..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={saving || !selectedUser || cart.length === 0}
                  className="px-4 py-2 rounded bg-[#1E2A47] text-white hover:bg-[#2A3B5A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Création..." : "Créer la commande"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}