import React, { useState, useEffect } from "react";
import { PageHeader, DailyStatistics, OrdersList } from './components/Commandes';
import { OrderFormModal } from './components/Modals/OrderFormModal';
import { TrouModal } from './components/Modals/TrouModal';
import { RetraitModal } from './components/Modals/RetraitModal';
import type { User, Product, OrderItem, Order, CreateOrderData, StandbyData } from './types/commandes.types';

export type { User, Product, OrderItem, Order };

type DailyClosing = {
  id: number;
  date: string;
  cashRevenue: number;
  qrRevenue: number;
  creditRevenue: number;
  trou: number;
  retrait: number;
  startingCash: number;
  endingCash: number;
  notes?: string;
  closedBy?: number;
  createdAt: string;
  updatedAt: string;
};

export default function DailyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // États pour le formulaire de nouvelle commande
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const [initialCart, setInitialCart] = useState<OrderItem[]>([]);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<"QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE" | null>(null);
  const [initialNotes, setInitialNotes] = useState("");
  const [initialDiscountValue, setInitialDiscountValue] = useState(0);
  const [initialDiscountComment, setInitialDiscountComment] = useState("");
  const [trouValue, setTrouValue] = useState<number>(0);
  const [retraitValue, setRetraitValue] = useState<number>(0);
  const [startingCashFund, setStartingCashFund] = useState<number>(0);

  const [standbyOrders, setStandbyOrders] = useState<StandbyData[]>([]);
  const [showStandbyList, setShowStandbyList] = useState(false);

  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [loadingClosing, setLoadingClosing] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: "",
    price: "",
    trainerPrice: "",
  });

  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: "",
    lastName: "",
    role: "USER" as "USER" | "TRAINER",
    balance: "",
  });

  const [refundPaymentMethod, setRefundPaymentMethod] = useState<"CASH" | "QRCODE" | null>(null);

  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundUser, setRefundUser] = useState<User | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundUserSearch, setRefundUserSearch] = useState("");

  const [showEditOrderForm, setShowEditOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [showTrouModal, setShowTrouModal] = useState(false);
  const [showRetraitModal, setShowRetraitModal] = useState(false);

  // États pour le modal d'édition de commande
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE">("CASH");
  const [notes, setNotes] = useState("");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsers(), fetchProducts(), fetchStandbyOrders()]);
  }, []);

  useEffect(() => {
    fetchDailyClosing(selectedDate);
  }, [selectedDate]);

  async function fetchDailyClosing(date: string) {
    console.log(`\n📅 [FRONTEND] Chargement des données pour ${date}`);
    setLoadingClosing(true);
    try {
      const response = await fetch(`/api/daily-reports/${date}`);

      if (response.ok) {
        const data: DailyClosing = await response.json();
        console.log('✅ [FRONTEND] Rapport trouvé:', {
          date,
          startingCash: data.startingCash,
          cashRevenue: data.cashRevenue,
          trou: data.trou,
          retrait: data.retrait,
          endingCash: data.endingCash
        });
        setDailyClosing(data);
        setTrouValue(Number(data.trou) || 0);
        setRetraitValue(Number(data.retrait) || 0);
        setStartingCashFund(Number(data.startingCash) || 0);
      } else if (response.status === 404) {
        console.log('⚠️  [FRONTEND] Pas de rapport pour ce jour, récupération du fond de départ...');
        setDailyClosing(null);
        setTrouValue(0);
        setRetraitValue(0);

        const startingFundResponse = await fetch(`/api/daily-reports/starting-cash/${date}`);

        if (startingFundResponse.ok) {
          const fundData = await startingFundResponse.json();
          const fundValue = Number(fundData.startingCash) || 0;
          console.log(`✅ [FRONTEND] Fond de départ récupéré: ${fundValue}€ (du ${fundData.previousDate ? new Date(fundData.previousDate).toISOString().split('T')[0] : 'aucun jour précédent'})`);
          setStartingCashFund(fundValue);
        } else {
          console.log('⚠️  [FRONTEND] Impossible de récupérer le fond de départ, défaut à 0€');
          setStartingCashFund(0);
        }
      }
    } catch (err) {
      console.error('❌ [FRONTEND] Erreur lors de la récupération:', err);
    } finally {
      setLoadingClosing(false);
    }
  }

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

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data: User[] = await response.json();

      const sortedUsers = data.sort((a, b) => {
        const nameA = `${a.lastName || ""} ${a.firstName || ""}`.trim().toLowerCase();
        const nameB = `${b.lastName || ""} ${b.firstName || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, "fr");
      });

      setUsers(sortedUsers);

      const venteInstantUser = sortedUsers.find(u =>
        getFullName(u).toLowerCase().includes("vente instant")
      );
      setSelectedUser(venteInstantUser || sortedUsers[0] || null);

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

  async function fetchStandbyOrders() {
    try {
      const response = await fetch("/api/standby-orders");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();

      // Convertir les données de la BDD au format StandbyData
      const standbyData: StandbyData[] = data.map((order: {
        id: number;
        user: User;
        cart: OrderItem[];
        paymentMethod: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE";
        notes: string | null;
        discountValue: number;
        discountComment: string | null;
        createdAt: string;
      }) => ({
        id: order.id.toString(),
        user: order.user,
        cart: order.cart,
        paymentMethod: order.paymentMethod,
        notes: order.notes || "",
        discountValue: order.discountValue || 0,
        discountComment: order.discountComment || "",
        timestamp: order.createdAt
      }));

      setStandbyOrders(standbyData);
    } catch (err) {
      console.error('Erreur lors de la récupération des commandes en standby:', err);
    }
  }

  async function handleAddMember(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);

    try {
      if (!newMemberForm.firstName?.trim() && !newMemberForm.lastName?.trim()) {
        throw new Error("Au moins le prénom ou le nom est obligatoire");
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: newMemberForm.firstName || null,
          lastName: newMemberForm.lastName || null,
          role: newMemberForm.role,
          balance: Number(newMemberForm.balance || 0),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const newUser = await response.json();
      await fetchUsers();

      // Sélectionner le nouveau membre dans le modal de commande
      setInitialUser(newUser);

      setShowAddMemberForm(false);
      setNewMemberForm({
        firstName: "",
        lastName: "",
        role: "USER",
        balance: "",
      });

    } catch (err) {
      console.error('Erreur lors de l\'ajout du membre:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible d'ajouter le membre.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }


  async function handleCreateOrder(orderData: CreateOrderData) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    await Promise.all([fetchOrders(), fetchDailyClosing(selectedDate)]);
    fetchProducts();
    fetchUsers();
  }

  async function handlePutOnStandby(standbyData: StandbyData) {
    try {
      const response = await fetch("/api/standby-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: standbyData.user?.id || null,
          cart: standbyData.cart,
          paymentMethod: standbyData.paymentMethod,
          notes: standbyData.notes,
          discountValue: standbyData.discountValue,
          discountComment: standbyData.discountComment
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Rafraîchir la liste des standby orders
      await fetchStandbyOrders();
    } catch (err) {
      console.error('Erreur lors de la mise en standby:', err);
      alert("Erreur lors de la mise en standby de la commande");
    }
  }

  async function handleResumeOrder(standbyId: string) {
    const order = standbyOrders.find(o => o.id === standbyId);
    if (!order) return;

    setInitialUser(order.user);
    setInitialCart(order.cart);
    setInitialPaymentMethod(order.paymentMethod || null);
    setInitialNotes(order.notes);
    setInitialDiscountValue(order.discountValue);
    setInitialDiscountComment(order.discountComment);

    // Supprimer de la base de données
    try {
      const response = await fetch(`/api/standby-orders/${standbyId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Rafraîchir la liste des standby orders
      await fetchStandbyOrders();
    } catch (err) {
      console.error('Erreur lors de la suppression du standby:', err);
    }

    setShowStandbyList(false);
    setShowForm(true);
  }

  async function handleDeleteStandby(standbyId: string) {
    if (confirm("Voulez-vous vraiment supprimer cette commande en stand-by ?")) {
      try {
        const response = await fetch(`/api/standby-orders/${standbyId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        // Rafraîchir la liste des standby orders
        await fetchStandbyOrders();
      } catch (err) {
        console.error('Erreur lors de la suppression du standby:', err);
        alert("Erreur lors de la suppression de la commande en standby");
      }
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

      setOrders(orders.filter(o => o.id !== order.id));

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

    if (!refundPaymentMethod) {
      alert("Veuillez sélectionner une méthode de paiement");
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
          paymentMethod: refundPaymentMethod,
          notes: refundNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      await response.json();
      setShowRefundForm(false);
      setRefundUser(null);
      setRefundAmount("");
      setRefundNotes("");
      setRefundPaymentMethod(null);

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

  async function handleSaveTrou(trou: number) {
    try {
      const response = await fetch(`/api/daily-reports/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trou })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Mettre à jour la valeur locale
      setTrouValue(trou);

      // Rafraîchir les données
      await fetchDailyClosing(selectedDate);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du trou:', err);
      throw err;
    }
  }

  async function handleSaveRetrait(retrait: number) {
    try {
      const response = await fetch(`/api/daily-reports/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retrait })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      // Mettre à jour la valeur locale
      setRetraitValue(retrait);

      // Rafraîchir les données
      await fetchDailyClosing(selectedDate);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du retrait:', err);
      throw err;
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

      setProducts((prev) =>
        prev.map(p => p.id === editingProduct.id ? updatedProduct : p)
      );

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

  function openEditOrderForm(order: Order) {
    setEditingOrder(order);
    setSelectedUser(order.client);
    setCart(order.products.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })));
    setPaymentMethod(order.paymentMethod);
    setNotes(order.notes || "");
    setDiscountValue(order.discount || 0);
    setShowEditOrderForm(true);
  }

  async function handleUpdateOrder() {
    if (!editingOrder || !selectedUser) {
      alert("Erreur lors de la modification");
      return;
    }
    if (cart.length === 0) {
      alert("Veuillez ajouter au moins un produit");
      return;
    }

    setSaving(true);
    try {
      const orderData = {
        clientId: selectedUser.id,
        paymentMethod: paymentMethod,
        notes: notes,
        discount: discountValue,
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      await Promise.all([fetchOrders(), fetchDailyClosing(selectedDate)]);
      setShowEditOrderForm(false);
      setEditingOrder(null);
      setSelectedUser(null);
      setCart([]);
      setPaymentMethod("CASH");
      setNotes("");
      setDiscountValue(0);
      setProductSearch("");

      fetchProducts();
      fetchUsers();

    } catch (err) {
      console.error('Erreur lors de la modification de la commande:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de modifier la commande";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  const getFullName = (user: User | undefined) => {
    if (!user) return "Utilisateur inconnu";
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
  };

  // Fonctions pour le modal d'édition de commande
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
    const subtotal = calculateSubtotal();
    if (discountValue <= 0) return subtotal;
    return Math.max(0, subtotal - discountValue);
  }

  function calculateSubtotal() {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }

  function calculateDiscount() {
    if (discountValue <= 0 || paymentMethod === "FREE") return 0;
    const subtotal = calculateSubtotal();
    return Math.min(discountValue, subtotal);
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredRefundUsers = users.filter(user =>
    getFullName(user).toLowerCase().includes(refundUserSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-8">
        <PageHeader
          onRefresh={fetchOrders}
          onNewOrder={() => setShowForm(true)}
          onRefund={() => setShowRefundForm(true)}
          onStandby={() => setShowStandbyList(true)}
          standbyCount={standbyOrders.length}
          loading={loading}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        <DailyStatistics
          selectedDate={selectedDate}
          orders={orders}
          dailyClosing={dailyClosing}
          loadingClosing={loadingClosing}
          trouValue={trouValue}
          retraitValue={retraitValue}
          onTrouClick={() => setShowTrouModal(true)}
          onRetraitClick={() => setShowRetraitModal(true)}
          startingCashFund={startingCashFund}
        />

        <OrdersList
          selectedDate={selectedDate}
          orders={orders}
          loading={loading}
          error={error}
          onCancelOrder={handleCancelOrder}
          onEditProduct={openEditForm}
          onEditOrder={openEditOrderForm}
        />

        {/* Modal nouvelle commande */}
        <OrderFormModal
          isOpen={showForm}
          users={users}
          products={products}
          onClose={() => {
            setShowForm(false);
            setInitialUser(null);
            setInitialCart([]);
            setInitialPaymentMethod(null);
            setInitialNotes("");
            setInitialDiscountValue(0);
            setInitialDiscountComment("");
          }}
          onCreate={handleCreateOrder}
          onStandby={handlePutOnStandby}
          onAddMember={(currentState) => {
            // Sauvegarder l'état actuel de la commande
            setInitialUser(currentState.user);
            setInitialCart(currentState.cart);
            setInitialPaymentMethod(currentState.paymentMethod);
            setInitialNotes(currentState.notes);
            setInitialDiscountValue(currentState.discountValue);
            setInitialDiscountComment(currentState.discountComment);
            // Ouvrir le modal d'ajout de membre
            setShowAddMemberForm(true);
          }}
          initialUser={initialUser}
          initialCart={initialCart}
          initialPaymentMethod={initialPaymentMethod}
          initialNotes={initialNotes}
          initialDiscountValue={initialDiscountValue}
          initialDiscountComment={initialDiscountComment}
        />

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membre à rembourser *
                  </label>

                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher un membre..."
                    value={refundUserSearch}
                    onChange={(e) => {
                      setRefundUserSearch(e.target.value);
                      if (!e.target.value) {
                        setRefundUser(null);
                      }
                    }}
                    className="w-full mb-2 border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />

                  {/* Liste de résultats */}
                  {refundUserSearch && !refundUser && (
                    <div className="border border-gray-300 rounded max-h-60 overflow-y-auto mb-2">
                      {filteredRefundUsers.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Aucun membre trouvé
                        </div>
                      ) : (
                        filteredRefundUsers.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setRefundUser(user);
                              setRefundUserSearch(getFullName(user));
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                          >
                            <div className="font-medium">{getFullName(user)}</div>
                            <div className="text-xs text-gray-600">
                              Solde: {Number(user.balance).toFixed(2)}€
                              {user.role === "TRAINER" && " • Entraîneur"}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Membre sélectionné */}
                  {refundUser && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200 mb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-blue-900">{getFullName(refundUser)}</div>
                          <div className="text-sm text-blue-700">
                            Solde actuel: <span className="font-medium">{Number(refundUser.balance).toFixed(2)}€</span>
                            {refundUser.role === "TRAINER" && " • Entraîneur"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRefundUser(null);
                            setRefundUserSearch("");
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          ✕ Changer
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant du remboursement (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moyen de paiement du remboursement *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundPaymentMethod("CASH")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${refundPaymentMethod === "CASH"
                          ? "border-green-500 bg-green-50 text-green-700 font-semibold"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                    >
                      💵 Espèces
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundPaymentMethod("QRCODE")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${refundPaymentMethod === "QRCODE"
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                    >
                      📱 QR Code
                    </button>
                  </div>
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
                    setRefundPaymentMethod(null);
                    setRefundUserSearch("");
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRefund}
                  disabled={saving || !refundUser || !refundAmount || Number(refundAmount) <= 0 || !refundPaymentMethod}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Remboursement..." : "Effectuer le remboursement"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'ajout rapide de membre */}
        {showAddMemberForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddMemberForm(false)} />
            <form
              onSubmit={handleAddMember}
              className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50"
            >
              <h3 className="text-xl font-semibold mb-4 text-black">Ajouter un membre</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as "USER" | "TRAINER" })}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="TRAINER">Entraîneur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    value={newMemberForm.firstName}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, firstName: e.target.value })}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Prénom (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    value={newMemberForm.lastName}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, lastName: e.target.value })}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Nom (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Solde initial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMemberForm.balance}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, balance: e.target.value })}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setNewMemberForm({
                      firstName: "",
                      lastName: "",
                      role: "USER",
                      balance: "",
                    });
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Ajout..." : "Ajouter le membre"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal des commandes en stand-by */}
        {showStandbyList && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowStandbyList(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-4 text-black">
                Commandes en stand-by ({standbyOrders.length})
              </h3>

              {standbyOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune commande en stand-by</p>
              ) : (
                <div className="space-y-4">
                  {standbyOrders.map((order) => {
                    const total = order.cart.reduce((sum, item) => {
                      return sum + (item.quantity * item.unitPrice);
                    }, 0);
                    const finalTotal = Math.max(0, total - order.discountValue);

                    return (
                      <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg text-black">
                              {order.user ? getFullName(order.user) : "Client non défini"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(order.timestamp).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {finalTotal.toFixed(2)}€
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.cart.length} article{order.cart.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3 space-y-1">
                          {order.cart.map((item, idx) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                              <div key={idx} className="text-sm text-gray-600 flex justify-between">
                                <span>{product?.name} x{item.quantity}</span>
                                <span>{(item.quantity * item.unitPrice).toFixed(2)}€</span>
                              </div>
                            );
                          })}
                        </div>

                        {order.notes && (
                          <p className="text-sm text-gray-600 mb-3">
                            📝 {order.notes}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResumeOrder(order.id)}
                            className="flex-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium"
                          >
                            ▶️ Reprendre
                          </button>
                          <button
                            onClick={() => handleDeleteStandby(order.id)}
                            className="px-4 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowStandbyList(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal modification de commande */}
        {showEditOrderForm && editingOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => {
              if (confirm("Voulez-vous annuler la modification ? Les changements seront perdus.")) {
                setShowEditOrderForm(false);
                setEditingOrder(null);
                setSelectedUser(null);
                setCart([]);
                setPaymentMethod("CASH");
                setNotes("");
                setDiscountValue(0);
                setProductSearch("");
              }
            }} />
            <div className="relative bg-white rounded-lg p-12 w-[900px] max-h-[90vh] overflow-y-auto shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-6 text-black">
                Modifier la commande #{editingOrder.id}
              </h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produits disponibles
                </label>

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
                              className="mt-0.5 bg-[#1E2A47] text-white px-1.5 py-0.5 rounded text-xs hover:bg-blue-600"
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

                    {paymentMethod !== "FREE" && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 mb-2">
                          <label className="text-sm font-medium text-gray-700">Réduction (€):</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={discountValue || ''}
                            onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                            onBlur={(e) => {
                              const value = Number(e.target.value) || 0;
                              if (value < 0) setDiscountValue(0);
                              if (value > calculateSubtotal()) setDiscountValue(calculateSubtotal());
                            }}
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

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Méthode de paiement *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${paymentMethod === "CASH"
                        ? "border-green-500 bg-green-50 text-green-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                  >
                    💵 Espèces
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("QRCODE")}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${paymentMethod === "QRCODE"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                  >
                    📱 QR Code
                  </button>

                  {selectedUser && !getFullName(selectedUser).includes("Vente instentané") && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ACCOUNT_DEBIT")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${paymentMethod === "ACCOUNT_DEBIT"
                          ? "border-purple-500 bg-purple-50 text-purple-700 font-semibold"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                    >
                      💳 Débit compte
                    </button>
                  )}
                </div>

                {paymentMethod === "ACCOUNT_DEBIT" && selectedUser && (
                  <div className="text-sm mt-3 p-3 bg-gray-50 rounded-lg">
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
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">{getFullName(selectedUser || undefined)}</div>
                  {selectedUser?.role === "TRAINER" && (
                    <span className="text-xs text-blue-600">Entraîneur</span>
                  )}
                </div>
              </div>

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
                  onClick={() => {
                    if (confirm("Voulez-vous annuler la modification ? Les changements seront perdus.")) {
                      setShowEditOrderForm(false);
                      setEditingOrder(null);
                      setSelectedUser(null);
                      setCart([]);
                      setPaymentMethod("CASH");
                      setNotes("");
                      setDiscountValue(0);
                      setProductSearch("");
                    }
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={saving || !selectedUser || cart.length === 0}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Modification..." : "Modifier la commande"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Trou de caisse */}
        <TrouModal
          isOpen={showTrouModal}
          currentTrou={trouValue}
          date={selectedDate}
          onClose={() => setShowTrouModal(false)}
          onSave={handleSaveTrou}
        />

        {/* Modal Retrait de caisse */}
        <RetraitModal
          isOpen={showRetraitModal}
          currentRetrait={retraitValue}
          date={selectedDate}
          onClose={() => setShowRetraitModal(false)}
          onSave={handleSaveRetrait}
        />
      </main>
    </div>
  );
}
