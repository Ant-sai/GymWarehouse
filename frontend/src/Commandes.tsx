import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import PrimeroseVector from './assets/PrimeroseVector.svg';

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
  paymentMethod: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE";
  notes?: string;
  products: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

type DailyStats = {
  date: string;
  orders: Order[];
  totalRevenue: number;
  orderCount: number;
  cashRevenue: number;
  cardRevenue: number;
  qrRevenue: number;
  accountDebitRevenue: number;
  freeRevenue: number;
  trainerOrders: number;
  userOrders: number;
};

export default function DailyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date sélectionnée pour la vue journalière
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // États pour le formulaire de nouvelle commande
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE">("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // États pour la réduction
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // État pour le filtre de recherche produits
  const [productSearch, setProductSearch] = useState("");

  // Variables pour le formulaire de modification
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: "",
    price: "",
    trainerPrice: "",
  });

  // Charger toutes les données au montage
  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
  }, []);
  // État pour le formulaire de remboursement
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundUser, setRefundUser] = useState<User | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundNotes, setRefundNotes] = useState("");

  async function fetchOrders() {
    try {
      const response = await fetch("/api/orders");
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

  // Juste après avoir fetch les utilisateurs
  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data: User[] = await response.json();

      // Tri par ordre alphabétique (prend d’abord lastName puis firstName)
      const sortedUsers = data.sort((a, b) => {
        const nameA = `${a.lastName || ""} ${a.firstName || ""}`.trim().toLowerCase();
        const nameB = `${b.lastName || ""} ${b.firstName || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, "fr");
      });

      setUsers(sortedUsers);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
    }
  }


  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setProducts(data.filter((p: Product) => p.isActive));
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
    }
  }

  // Calculer les statistiques journalières
  function getDailyStats(date: string): DailyStats {
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.date).toISOString().split('T')[0];
      return orderDate === date;
    });

    const stats: DailyStats = {
      date,
      orders: dayOrders,
      totalRevenue: 0,
      orderCount: dayOrders.length,
      cashRevenue: 0,
      cardRevenue: 0,
      qrRevenue: 0,
      accountDebitRevenue: 0,
      freeRevenue: 0,
      trainerOrders: 0,
      userOrders: 0,
    };

    dayOrders.forEach(order => {
      const amount = Number(order.totalAmount);

      // Les commandes gratuites ne contribuent pas au chiffre d'affaires
      if (order.paymentMethod !== "FREE") {
        stats.totalRevenue += amount;
      }

      switch (order.paymentMethod) {
        case "CASH":
          stats.cashRevenue += amount;
          break;
        case "QRCODE":
          stats.qrRevenue += amount;
          break;
        case "ACCOUNT_DEBIT":
          stats.accountDebitRevenue += amount;
          break;
        case "FREE":
          // Les commandes gratuites n'ajoutent rien au CA
          break;
      }

      if (order.client?.role === "TRAINER") {
        stats.trainerOrders++;
      } else {
        stats.userOrders++;
      }
    });

    return stats;
  }

  // Obtenir les dates qui ont des commandes
  function getAvailableDates(): string[] {
    const dates = new Set<string>();
    orders.forEach(order => {
      const date = new Date(order.date).toISOString().split('T')[0];
      dates.add(date);
    });
    return Array.from(dates).sort().reverse(); // Plus récentes en premier
  }

  // Navigation entre les dates
  function navigateDate(direction: 'prev' | 'next') {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
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
    if (paymentMethod === "FREE") return 0;

    const subtotal = cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);

    if (discountValue <= 0) return subtotal;

    let discount = 0;
    if (discountType === "percentage") {
      discount = (subtotal * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    return Math.max(0, subtotal - discount);
  }

  function calculateSubtotal() {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }

  function calculateDiscount() {
    if (discountValue <= 0 || paymentMethod === "FREE") return 0;

    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100;
    } else {
      return Math.min(discountValue, subtotal);
    }
  }

  // Filtrer les produits selon la recherche
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

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
    // Avertissement pour les comptes qui vont devenir négatifs
    if (paymentMethod === "ACCOUNT_DEBIT" && Number(selectedUser.balance) < total) {
      const newBalance = Number(selectedUser.balance) - total;
      const confirmNegative = window.confirm(
        `Cette transaction créera un solde négatif.\n\n` +
        `Solde actuel: ${Number(selectedUser.balance).toFixed(2)}€\n` +
        `Montant à débiter: ${total.toFixed(2)}€\n` +
        `Nouveau solde: ${newBalance.toFixed(2)}€\n\n` +
        `Voulez-vous continuer ?`
      );

      if (!confirmNegative) {
        return;
      }
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

      const response = await fetch("/api/orders", {
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
      fetchUsers();

    } catch (err) {
      console.error('Erreur lors de la création de la commande:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de créer la commande";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelOrder(order: Order) {
    try {
      const response = await fetch(`/api/orders/${order.id}/hard`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restoreStock: true,
          reason: "Annulation demandée"
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Retirer la commande de la liste locale
      setOrders(orders.filter(o => o.id !== order.id));

      // Recharger les données pour avoir les stocks à jour
      fetchProducts();
      fetchUsers();

    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
    }
  }
  async function handleRefund() {
    if (!refundUser) {
      alert("Veuillez sélectionner un membre");
      return;
    }

    const amount = Number(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: refundUser.id,
          amount: amount,
          notes: refundNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Supprimez cette ligne car vous ne l'utilisez pas
      // const refundTransaction = await response.json();
      await response.json(); // Si vous voulez juste consommer la réponse

      alert(`Remboursement de ${amount.toFixed(2)}€ effectué avec succès !`);

      // Réinitialiser le formulaire
      setShowRefundForm(false);
      setRefundUser(null);
      setRefundAmount("");
      setRefundNotes("");

      // Recharger les données
      fetchOrders();
      fetchUsers();

    } catch (err) {
      console.error('Erreur lors du remboursement:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible d'effectuer le remboursement";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }
  async function handleEditProduct(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingProduct) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: Number(editForm.quantity),
          price: Number(editForm.price),
          trainerPrice: Number(editForm.trainerPrice),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const updatedProduct = await response.json();

      // Mettre à jour le state local
      setProducts((prev) =>
        prev.map(p => p.id === editingProduct.id ? updatedProduct : p)
      );

      // Réinitialiser le formulaire
      setShowEditForm(false);
      setEditingProduct(null);
      setEditForm({ quantity: "", price: "", trainerPrice: "" });

    } catch (err) {
      console.error('Erreur lors de la modification du produit:', err);
    } finally {
      setSaving(false);
    }
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setEditForm({
      quantity: product.quantity.toString(),
      price: product.price.toString(),
      trainerPrice: product.trainerPrice?.toString() || "",
    });
    setShowEditForm(true);
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
      case "ACCOUNT_DEBIT": return "Débit compte";
      case "FREE": return "Gratuit";
      default: return method;
    }
  };

  const dailyStats = getDailyStats(selectedDate);
  const availableDates = getAvailableDates();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E2A47] text-white p-8">
        <img
          src={PrimeroseVector}
          alt="Gym Warehouse"
          className="w-full h-auto mb-8"
        />        <nav className="space-y-4 text-sm">
          <Link to="/stock" className="block text-[#AAB4C3] hover:text-white transition-colors">
            Stock
          </Link>
          <Link to="/membres" className="block text-[#AAB4C3] hover:text-white transition-colors">
            Membres
          </Link>
          <div className="font-medium text-white">Commandes Journalières</div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-12">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-black">Vue Journalière</h1>
            <button
              onClick={fetchOrders}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              disabled={loading}
            >
              {loading ? "⟳" : "↻"} Actualiser
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRefundForm(true)}
              className="bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow-sm hover:bg-green-200"
            >
              💰 Remboursement
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
            >
              Nouvelle commande
            </button>
          </div>
        </header>

        {/* Navigation par date */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate('prev')}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded flex items-center gap-2"
              >
                ← Jour précédent
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => navigateDate('next')}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded flex items-center gap-2"
              >
                Jour suivant →
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Aujourd'hui
            </button>
          </div>

          {/* Statistiques du jour */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-700">
                {dailyStats.totalRevenue.toFixed(2)}€
              </div>
              <div className="text-sm text-green-600">Chiffre d'affaires</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-blue-700">
                {dailyStats.orderCount}
              </div>
              <div className="text-sm text-blue-600">Commandes</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-purple-700">
                {dailyStats.trainerOrders}
              </div>
              <div className="text-sm text-purple-600">Entraîneurs</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <div className="text-2xl font-bold text-orange-700">
                {dailyStats.userOrders}
              </div>
              <div className="text-sm text-orange-600">Membres</div>
            </div>
          </div>

          {/* Répartition par méthode de paiement */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-semibold text-gray-700">{dailyStats.cashRevenue.toFixed(2)}€</div>
              <div className="text-sm text-gray-500">Espèces</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-semibold text-gray-700">{dailyStats.qrRevenue.toFixed(2)}€</div>
              <div className="text-sm text-gray-500">QR Code</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-semibold text-gray-700">{dailyStats.accountDebitRevenue.toFixed(2)}€</div>
              <div className="text-sm text-gray-500">Débit</div>
            </div>
            <div className="bg-red-50 p-3 rounded text-center border border-red-200">
              <div className="font-semibold text-red-700">{dailyStats.orders.filter(o => o.paymentMethod === "FREE").length}</div>
              <div className="text-sm text-red-500">Gratuit</div>
            </div>
          </div>
        </div>

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

        {/* Liste des commandes du jour */}
        {!loading && !error && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black">
              Commandes du {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>

            <div className="space-y-4">
              {dailyStats.orders.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucune commande pour cette date</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Sélectionnez une autre date ou créez une nouvelle commande
                  </div>
                </div>
              )}

              {dailyStats.orders.map((order) => (
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
                        Heure: {new Date(order.date).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {Number(order.totalAmount).toFixed(2)}€
                      </div>
                      <div className={`px-3 py-1 rounded text-sm font-medium mb-2 ${order.paymentMethod === "ACCOUNT_DEBIT"
                        ? "bg-purple-100 text-purple-800"
                        : order.paymentMethod === "FREE"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                        }`}>
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </div>

                      <button
                        onClick={() => handleCancelOrder(order)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                        title="Annuler cette commande (restaure stocks et solde)"
                      >
                        🗑️ Annuler
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Produits:</h4>
                    <div className="space-y-1">
                      {order.products?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span>{item.product?.name || "Produit inconnu"} × {item.quantity}</span>
                            <button
                              onClick={() => openEditForm(item.product)}
                              className="p-1 hover:bg-blue-50 rounded"
                              title="Modifier ce produit"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
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
          </div>
        )}

        {/* Modals (inchangés) */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[900px] max-h-[90vh] overflow-y-auto shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-6 text-black">Nouvelle commande</h3>



              {/* Sélection des produits */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produits disponibles
                </label>

                {/* Filtre de recherche */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 max-h-60 overflow-y-auto border rounded p-4">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-3 text-center text-gray-500 py-4">
                      {productSearch ? "Aucun produit trouvé" : "Aucun produit disponible"}
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <div key={product.id} className="border rounded p-2">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            <p className="text-xs text-gray-600">Stock: {product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">
                              {selectedUser?.role === "TRAINER"
                                ? product.trainerPrice
                                : product.price}€
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              className="mt-0.5 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs hover:bg-blue-600"
                              disabled={product.quantity <= 0}
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>


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

                    {/* Section Réduction */}
                    {/* Section Réduction */}
                    {paymentMethod !== "FREE" && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 mb-2">
                          <label className="text-sm font-medium text-gray-700">Réduction (€):</label>
                          <input
                            type="number"
                            min="0"
                            max={calculateSubtotal()}
                            step={0.01}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm w-24"
                            placeholder="0.00"
                          />
                          <span className="text-sm text-gray-600">€</span>
                          {discountValue > 0 && (
                            <button
                              onClick={() => setDiscountValue(0)}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              ✕ Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Totaux */}
                    <div className="mt-4 text-right space-y-1">
                      <div className="text-sm text-gray-600">
                        Sous-total: {calculateSubtotal().toFixed(2)}€
                      </div>
                      {discountValue > 0 && paymentMethod !== "FREE" && (
                        <div className="text-sm text-red-600">
                          Réduction: -{calculateDiscount().toFixed(2)}€
                        </div>
                      )}
                      <div className={`text-xl font-bold ${paymentMethod === "FREE" ? "text-red-600" : ""}`}>
                        Total: {calculateTotal().toFixed(2)}€
                        {paymentMethod === "FREE" && <span className="text-sm ml-2">(GRATUIT)</span>}
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
                  <option value="QRCODE">QR Code</option>
                  {/* N'affiche l'option Débit compte que si ce n'est pas le client "Vente instantané" */}
                  {selectedUser && !getFullName(selectedUser).includes("Vente instentané") && (
                    <option value="ACCOUNT_DEBIT">Débit compte</option>
                  )}
                  <option value="FREE">Gratuit (produit défectueux/geste commercial)</option>
                </select>
                {paymentMethod === "ACCOUNT_DEBIT" && selectedUser && (
                  <div className="text-sm mt-1">
                    <span className={`${Number(selectedUser.balance) < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Solde disponible: {Number(selectedUser.balance).toFixed(2)}€
                      {Number(selectedUser.balance) < 0 && ' (DÉCOUVERT)'}
                    </span>
                    {cart.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Nouveau solde après achat: {(Number(selectedUser.balance) - calculateTotal()).toFixed(2)}€
                      </div>
                    )}
                  </div>
                )}
                {paymentMethod === "FREE" && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ Cette commande sera gratuite - aucun paiement ne sera demandé
                  </p>
                )}
              </div>
              {/* Sélection du client */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select
                  value={selectedUser?.id || ""}
                  onChange={(e) => {
                    const user = users.find(u => u.id === Number(e.target.value));
                    setSelectedUser(user || null);
                  }}
                  className="border rounded px-3 py-2"
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {getFullName(user)}
                    </option>
                  ))}
                </select>

              </div>

              {/* Notes */}
              {/* <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Commentaires sur la commande..."
                />
              </div> */}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                    setCart([]);
                    setPaymentMethod("CASH");
                    setNotes("");
                    setDiscountType("percentage");
                    setDiscountValue(0);
                    setProductSearch("");
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Fermer
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={saving || !selectedUser || cart.length === 0}
                  className={`px-4 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === "FREE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1E2A47] hover:bg-[#2A3B5A]"
                    }`}
                >
                  {saving ? "Création..." : paymentMethod === "FREE" ? "Créer commande gratuite" : "Créer la commande"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal modification produit */}
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
                  <label className="block text-sm font-medium text-gray-700">Quantité *</label>
                  <input
                    type="number"
                    min="0"
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
        {/* Modal remboursement */}
        {showRefundForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowRefundForm(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-6 text-black">Remboursement</h3>

              <div className="space-y-4">
                {/* Sélection du membre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membre à rembourser *
                  </label>
                  <select
                    value={refundUser?.id || ""}
                    onChange={(e) => {
                      const user = users.find(u => u.id === Number(e.target.value));
                      setRefundUser(user || null);
                    }}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un membre</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {getFullName(user)}
                      </option>
                    ))}
                  </select>
                  {refundUser && (
                    <div className="text-sm mt-2 text-gray-600">
                      Solde actuel: <span className="font-medium">{Number(refundUser.balance).toFixed(2)}€</span>
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
                    min="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {refundUser && refundAmount && Number(refundAmount) > 0 && (
                    <div className="text-sm mt-2 text-green-600">
                      Nouveau solde: <span className="font-medium">
                        {(Number(refundUser.balance) + Number(refundAmount)).toFixed(2)}€
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du remboursement (optionnel)
                  </label>
                  <textarea
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ex: Produit défectueux, erreur de facturation..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundForm(false);
                    setRefundUser(null);
                    setRefundAmount("");
                    setRefundNotes("");
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRefund}
                  disabled={saving || !refundUser || !refundAmount || Number(refundAmount) <= 0}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Remboursement..." : "Effectuer le remboursement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}