//OldCommandes.tsx
import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import PrimeroseVector from './assets/PrimeroseVector.svg';

export type User = {
  id: number;
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

type DailyClosing = {
  id: number;
  date: string;
  cashRevenue: number;
  qrRevenue: number;
  creditRevenue: number;
  trou: number;
  fondCaisse: number;
  startingCashFund: number;
  notes?: string;
  closedBy?: string;
  closedAt: string;
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
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountComment, setDiscountComment] = useState("");
  const [userSearch, setUserSearch] = useState("");
  // État pour le filtre de recherche produits
  const [productSearch, setProductSearch] = useState("");
const [trouValue, setTrouValue] = useState<number>(0);
const [startingCashFund, setStartingCashFund] = useState<number>(0);

// États pour les commandes en stand-by
const [standbyOrders, setStandbyOrders] = useState<Array<{
  id: string;
  user: User;
  cart: OrderItem[];
  paymentMethod: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE";
  notes: string;
  discountValue: number;
  discountComment: string;
  timestamp: number;
}>>([]);
const [showStandbyList, setShowStandbyList] = useState(false);


const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
const [loadingClosing, setLoadingClosing] = useState(false);

  // Variables pour le formulaire de modification
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: "",
    price: "",
    trainerPrice: "",
  });
  // États pour l'ajout rapide d'un nouveau membre
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: "",
    lastName: "",
    role: "USER" as "USER" | "TRAINER",
    balance: "",
  });

  const [refundPaymentMethod, setRefundPaymentMethod] = useState<"CASH" | "QRCODE">("CASH");

  // Charger toutes les données au montage
  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
  }, []);
  useEffect(() => {
  console.log('📅 [useEffect] Changement de date détecté:', selectedDate);
  fetchDailyClosing(selectedDate);
}, [selectedDate]);
// Sauvegarder immédiatement le trou quand il change
useEffect(() => {
  if (trouValue !== (dailyClosing?.trou || 0)) {
    saveTrouValue(selectedDate, trouValue);
  }
}, [trouValue, selectedDate]);

  // État pour le formulaire de remboursement
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundUser, setRefundUser] = useState<User | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundNotes, setRefundNotes] = useState("");

async function fetchDailyClosing(date: string) {
  console.log('🔍 [fetchDailyClosing] Début du chargement pour la date:', date);
  setLoadingClosing(true);
  try {
    // Récupérer la clôture du jour
    console.log('📡 [fetchDailyClosing] Appel API: /api/daily-closing/' + date);
    const response = await fetch(`/api/daily-closing/${date}`);
    
    if (response.ok) {
      const data: DailyClosing = await response.json();
      console.log('✅ [fetchDailyClosing] Clôture trouvée pour ce jour:', {
        date: data.date,
        trou: data.trou,
        startingCashFund: data.startingCashFund,
        fondCaisse: data.fondCaisse,
        cashRevenue: data.cashRevenue
      });
      
      setDailyClosing(data);
      setTrouValue(Number(data.trou) || 0);
      setStartingCashFund(Number(data.startingCashFund) || 0);
      
      console.log('💾 [fetchDailyClosing] État mis à jour:', {
        trouValue: Number(data.trou) || 0,
        startingCashFund: Number(data.startingCashFund) || 0
      });
      
    } else if (response.status === 404) {
      console.log('⚠️ [fetchDailyClosing] Pas de clôture pour ce jour');
      
      // Pas de clôture pour ce jour, récupérer le fond de caisse du jour précédent
      setDailyClosing(null);
      setTrouValue(0);
      
      console.log('📡 [fetchDailyClosing] Appel API: /api/daily-closing/starting-fund/' + date);
      const startingFundResponse = await fetch(`/api/daily-closing/starting-fund/${date}`);
      
      if (startingFundResponse.ok) {
        const fundData = await startingFundResponse.json();
        console.log('✅ [fetchDailyClosing] Données du jour précédent reçues:', fundData);
        
        // Utiliser fondCaisse si disponible, sinon fallback sur startingCashFund
        const fundValue = Number(fundData.fondCaisse || fundData.startingCashFund) || 0;
        
        console.log('💰 [fetchDailyClosing] Calcul du fond de départ:', {
          fondCaisse: fundData.fondCaisse,
          startingCashFund: fundData.startingCashFund,
          valeurChoisie: fundValue
        });
        
        setStartingCashFund(fundValue);
        
        console.log('💾 [fetchDailyClosing] État mis à jour:', {
          trouValue: 0,
          startingCashFund: fundValue
        });
      } else {
        console.log('❌ [fetchDailyClosing] Erreur récupération jour précédent:', startingFundResponse.status);
        setStartingCashFund(0);
      }
    } else {
      console.log('❌ [fetchDailyClosing] Erreur HTTP inattendue:', response.status);
    }
  } catch (err) {
    console.error('💥 [fetchDailyClosing] Erreur lors de la récupération:', err);
  } finally {
    setLoadingClosing(false);
    console.log('🏁 [fetchDailyClosing] Fin du chargement');
  }
}
// Sauvegarder automatiquement le trou quand il change
async function saveTrouValue(date: string, trou: number) {
  try {
    await fetch(`/api/daily-closing/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trou })
    });
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du trou:', err);
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

  // Juste après avoir fetch les utilisateurs
  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data: User[] = await response.json();

      // Tri par ordre alphabétique (prend d'abord lastName puis firstName)
      const sortedUsers = data.sort((a, b) => {
        const nameA = `${a.lastName || ""} ${a.firstName || ""}`.trim().toLowerCase();
        const nameB = `${b.lastName || ""} ${b.firstName || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, "fr");
      });

      setUsers(sortedUsers);

      // ✅ Sélectionner automatiquement "Vente instantané" ou le premier utilisateur
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


  // Fonction pour ajouter un nouveau membre rapidement
  async function handleAddMember(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);

    try {
      // Validation côté client
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

      // Mettre à jour la liste des utilisateurs
      await fetchUsers();

      // Sélectionner automatiquement le nouveau membre
      setSelectedUser(newUser);

      // Réinitialiser et fermer le formulaire
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

    const subtotal = calculateSubtotal();

    if (discountValue <= 0) return subtotal;

    // Réduction directe en euros
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
        discount: discountValue,
        discountComment: discountComment,
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

      await Promise.all([fetchOrders(), fetchDailyClosing(selectedDate)]);
      setShowForm(false);
      setSelectedUser(null);
      setCart([]);
      setPaymentMethod("CASH");
      setNotes("");
      setDiscountValue(0);
      setDiscountComment("");
      setUserSearch("");
      setProductSearch("");

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
  function handlePutOnStandby() {
  if (!selectedUser || cart.length === 0) return;
  
  const standbyOrder = {
    id: `standby_${Date.now()}`,
    user: selectedUser,
    cart: [...cart],
    paymentMethod,
    notes,
    discountValue,
    discountComment,
    timestamp: Date.now()
  };
  
  setStandbyOrders([...standbyOrders, standbyOrder]);
  
  // Réinitialiser le formulaire
  setCart([]);
  setNotes("");
  setDiscountValue(0);
  setDiscountComment("");
  setShowForm(false);
  
}
function handleResumeOrder(standbyId: string) {
  const order = standbyOrders.find(o => o.id === standbyId);
  if (!order) return;
  
  // Restaurer la commande
  setSelectedUser(order.user);
  setCart(order.cart);
  setPaymentMethod(order.paymentMethod);
  setNotes(order.notes);
  setDiscountValue(order.discountValue);
  setDiscountComment(order.discountComment);
  
  // Retirer de la liste stand-by
  setStandbyOrders(standbyOrders.filter(o => o.id !== standbyId));
  setShowStandbyList(false);
  setShowForm(true);
}
function handleDeleteStandby(standbyId: string) {
  if (confirm("Voulez-vous vraiment supprimer cette commande en stand-by ?")) {
    setStandbyOrders(standbyOrders.filter(o => o.id !== standbyId));
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
          paymentMethod: refundPaymentMethod,
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
      // Réinitialiser le formulaire
      setShowRefundForm(false);
      setRefundUser(null);
      setRefundAmount("");
      setRefundNotes("");
      setRefundPaymentMethod("CASH");

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
    return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  // Filtrer les produits selon la recherche

  const filteredUsers = users.filter(user =>
    getFullName(user).toLowerCase().includes(userSearch.toLowerCase())
  );
  function getAvailableDates(): string[] {
    const dates = new Set<string>();
    orders.forEach(order => {
      const date = new Date(order.date).toISOString().split('T')[0];
      dates.add(date);
    });
    return Array.from(dates).sort().reverse(); // Plus récentes en premier
  }

  const dailyStats = getDailyStats(selectedDate);
  const availableDates = getAvailableDates();
  
  // Calculer le fond de caisse (Starting Fund + Espèces du jour - Trou)
  const fondCaisse = startingCashFund + dailyStats.cashRevenue - trouValue;
  
  // Log pour déboguer le calcul du fond de caisse
  console.log('💵 [Calcul fond de caisse]', {
    date: selectedDate,
    startingCashFund,
    cashRevenue: dailyStats.cashRevenue,
    trouValue,
    fondCaisse,
    calcul: `${startingCashFund} + ${dailyStats.cashRevenue} - ${trouValue} = ${fondCaisse}`
  });
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
              💰 Remboursement crédit
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
            >
              Nouvelle commande
            </button>
            <button
  onClick={() => setShowStandbyList(true)}
  className="relative px-6 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-medium shadow-sm"
>
  ⏸️ Stand-by {standbyOrders.length > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
      {standbyOrders.length}
    </span>
  )}
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
              className="bg-[#1E2A47] hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Aujourd'hui
            </button>
          </div>

          {/* Statistiques du jour */}
<div className="bg-white p-6 rounded-lg shadow-sm">
  {(
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center">
        <span className="text-blue-700 font-medium">Caisse de début de journée</span>
        <span className="text-xl font-bold text-blue-700">
          {startingCashFund.toFixed(2)}€
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        (Fond de caisse du jour précédent)
      </div>
    </div>
  )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Crédit</span>
                <span className="text-xl font-bold text-purple-700">
                  {dailyStats.accountDebitRevenue.toFixed(2)}€
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">QR Code</span>
                <span className="text-xl font-bold text-blue-700">
                  {dailyStats.qrRevenue.toFixed(2)}€
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Espèces</span>
                <span className="text-xl font-bold text-green-700">
                  {dailyStats.cashRevenue.toFixed(2)}€
                </span>
              </div>
<div className="border-b pb-2">
  <div className="text-sm text-gray-600 flex items-center gap-2">
    Trou
    {loadingClosing && <span className="text-xs">(chargement...)</span>}
  </div>
  <div className="flex items-center gap-2">
    <input
  type="number"
  step="0.01"
  value={trouValue}
  onChange={(e) => setTrouValue(Number(e.target.value))}
  className="w-full px-2 py-1 border rounded text-lg font-bold text-red-600"
  disabled={loadingClosing}
  placeholder="0.00"
/>
    <span className="text-lg font-bold text-red-600">€</span>
  </div>
  {dailyClosing && (
    <div className="text-xs text-gray-500 mt-1">
      Dernière mise à jour: {new Date(dailyClosing.closedAt).toLocaleTimeString('fr-FR')}
    </div>
  )}
</div>
              <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded">
                <span className="text-gray-700 font-medium">Fond de caisse</span>
                <span className={`text-xl font-bold ${fondCaisse >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {fondCaisse.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>

          {/* Répartition par méthode de paiement */}
          {/* <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="text-sm text-gray-500">Crédit</div>
            </div>
          </div> */}

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
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="text-gray-900 font-medium">
                          {order.client ? getFullName(order.client) : "Client inconnu"}
                        </p>
                        {order.client?.role === "TRAINER" && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Entraîneur
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.paymentMethod === "CASH"
                            ? "bg-green-100 text-green-800"
                            : order.paymentMethod === "QRCODE"
                              ? "bg-blue-100 text-blue-800"
                              : order.paymentMethod === "ACCOUNT_DEBIT"
                                ? "bg-purple-100 text-purple-800"
                                : order.paymentMethod === "FREE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}>
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </span>
                        <p className="text-gray-500 text-sm">
                          {new Date(order.date).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600">
                        {Number(order.totalAmount).toFixed(2)}€
                      </div>
                      <button
                        onClick={() => handleCancelOrder(order)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors mt-2"
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
            <div className="relative bg-white rounded-lg p-12 w-[900px] max-h-[90vh] overflow-y-auto shadow-lg z-50">
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

                    {/* Section Réduction avec commentaire */}
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
                              onClick={() => {
                                setDiscountValue(0);
                                setDiscountComment("");
                              }}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              ✕ Supprimer
                            </button>
                          )}
                        </div>

                        {/* Commentaire pour la réduction */}
                        {discountValue > 0 && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={discountComment}
                              onChange={(e) => setDiscountComment(e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="Raison de la réduction (optionnel)..."
                            />
                          </div>
                        )}
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
              {/* Sélection du client */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>

                {/* Barre de recherche */}
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full mb-2 border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <div className="flex gap-2">
                  <select
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const user = users.find(u => u.id === Number(e.target.value));
                      setSelectedUser(user || null);
                    }}
                    className="flex-1 border rounded px-3 py-2"
                  >
                    {filteredUsers.length === 0 ? (
                      <option value="">Aucun client trouvé</option>
                    ) : (
                      filteredUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {getFullName(user)}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                    title="Ajouter un nouveau membre"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Nouveau
                  </button>
                </div>
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
                  onClick={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                    setCart([]);
                    setPaymentMethod("CASH");
                    setNotes("");
                    setDiscountValue(0);
                    setProductSearch("");
                    setUserSearch("");
                    setDiscountComment("");
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Fermer
                </button>
                    <button
      type="button"
      onClick={handlePutOnStandby}
      disabled={saving || cart.length === 0}
      className="px-5 py-2 rounded border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      ⏸️ Mettre en stand-by
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
                {/* Méthode de paiement du remboursement */}
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
                    setRefundPaymentMethod("CASH");
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
                      {getFullName(order.user)}
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
        
      </main>
    </div>
  );
}