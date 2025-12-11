// src/Commandes.tsx
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import PrimeroseVector from './assets/PrimeroseVector.svg';

// Import des composants
import { DateNavigation } from './components/Commandes/DateNavigation';
import { DailyStatsCard } from './components/Commandes/DailyStats';
import { OrderCard } from './components/Commandes/OrderCard';
import {
  OrderFormModal,
  RefundModal,
  EditProductModal,
  StandbyOrdersModal,
  AddMemberModal
} from './components/Modals';

// Import des types depuis le fichier centralisé
import type { 
  Product, 
  Order, 
  DailyClosing, 
  StandbyOrder, 
  User,
  CreateOrderData,
  StandbyData
} from './types/commandes.types';

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

export default function CommandesPage() {
  // ========== ÉTATS ==========
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [loadingClosing, setLoadingClosing] = useState(false);
  const [trouValue, setTrouValue] = useState<number>(0);
  const [startingCashFund, setStartingCashFund] = useState<number>(0);

  // États pour les modals
  const [showForm, setShowForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStandbyList, setShowStandbyList] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // États pour les données
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [standbyOrders, setStandbyOrders] = useState<StandbyOrder[]>([]);

  // ========== FONCTIONS UTILITAIRES ==========
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
      if (order.paymentMethod !== "FREE") {
        stats.totalRevenue += amount;
      }

      switch (order.paymentMethod) {
        case "CASH": stats.cashRevenue += amount; break;
        case "QRCODE": stats.qrRevenue += amount; break;
        case "ACCOUNT_DEBIT": stats.accountDebitRevenue += amount; break;
        case "FREE": stats.freeRevenue += amount; break;
      }

      if (order.client?.role === "TRAINER") {
        stats.trainerOrders++;
      } else {
        stats.userOrders++;
      }
    });

    return stats;
  }

  function getAvailableDates(): string[] {
    const dates = new Set<string>();
    orders.forEach(order => {
      const date = new Date(order.date).toISOString().split('T')[0];
      dates.add(date);
    });
    return Array.from(dates).sort().reverse();
  }

  // ========== API CALLS ==========
  async function fetchOrders() {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de récupérer les commandes");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
    }
  }

  async function fetchDailyClosing(date: string) {
    setLoadingClosing(true);
    try {
      const response = await fetch(`/api/daily-closing/${date}`);
      
      if (response.ok) {
        const data: DailyClosing = await response.json();
        setDailyClosing(data);
        setTrouValue(Number(data.trou) || 0);
        setStartingCashFund(Number(data.startingCashFund) || 0);
      } else if (response.status === 404) {
        setDailyClosing(null);
        setTrouValue(0);
        
        const startingFundResponse = await fetch(`/api/daily-closing/starting-fund/${date}`);
        if (startingFundResponse.ok) {
          const fundData = await startingFundResponse.json();
          const fundValue = Number(fundData.fondCaisse || fundData.startingCashFund) || 0;
          setStartingCashFund(fundValue);
        } else {
          setStartingCashFund(0);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoadingClosing(false);
    }
  }

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

  async function handleCancelOrder(order: Order) {
    if (!window.confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    
    try {
      const response = await fetch(`/api/orders/${order.id}/hard`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restoreStock: true, reason: "Annulation demandée" }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      setOrders(orders.filter(o => o.id !== order.id));
      alert('Commande annulée avec succès');
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de l\'annulation');
    }
  }

  // ========== HANDLERS MODAUX ==========
  // Handler pour créer une commande
  const handleCreateOrder = async (orderData: CreateOrderData) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création de la commande');
    }

    // Rafraîchir les données
    await fetchOrders();
    await fetchProducts(); // Pour mettre à jour le stock
  };

  // Handler pour les commandes en standby
  const handleStandby = (standbyData: StandbyData) => {
    setStandbyOrders([...standbyOrders, standbyData]);
  };

  const handleResumeStandby = (standbyId: string) => {
    // Retirer de la liste standby
    setStandbyOrders(standbyOrders.filter(order => order.id !== standbyId));

    // Ouvrir le modal de commande avec les données
    setShowForm(true);
  };

  const handleDeleteStandby = (standbyId: string) => {
    setStandbyOrders(standbyOrders.filter(order => order.id !== standbyId));
  };

  // Handler pour ajouter un membre
  const handleAddMember = () => {
    setShowForm(false); // Fermer le modal de commande
    setShowAddMemberModal(true); // Ouvrir le modal d'ajout de membre
  };

  const handleAddMemberSubmit = async (userData: Partial<User>) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création du membre');
    }

    const newUser = await response.json();

    // Rafraîchir la liste des utilisateurs
    await fetchUsers();
    setShowAddMemberModal(false);
    setShowForm(true); // Rouvrir le modal de commande

    return newUser;
  };

  // Handler pour éditer un produit
  const handleUpdateProduct = async (productId: number, updatedData: Partial<Product>) => {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du produit');
    }

    await fetchProducts();
    await fetchOrders();
  };

  // Handler pour le remboursement
  const handleRefund = async (userId: number, amount: number, paymentMethod: 'CASH' | 'QRCODE', notes: string) => {
    const response = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, paymentMethod, notes })
    });

    if (!response.ok) {
      throw new Error('Erreur lors du remboursement');
    }

    await fetchUsers(); // Rafraîchir pour mettre à jour les soldes
  };

  // ========== NAVIGATION ==========
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchOrders();
    fetchUsers();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDailyClosing(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (trouValue !== (dailyClosing?.trou || 0)) {
      const timeoutId = setTimeout(() => {
        saveTrouValue(selectedDate, trouValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trouValue, selectedDate, dailyClosing]);

  // ========== CALCULS ==========
  const dailyStats = getDailyStats(selectedDate);
  const availableDates = getAvailableDates();

  // ========== RENDER ==========
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E2A47] text-white p-8">
        <img src={PrimeroseVector} alt="Gym Warehouse" className="w-full h-auto mb-8" />
        <nav className="space-y-4 text-sm">
          <Link to="/stock" className="block text-[#AAB4C3] hover:text-white transition-colors">
            Stock
          </Link>
          <Link to="/membres" className="block text-[#AAB4C3] hover:text-white transition-colors">
            Membres
          </Link>
          <div className="font-medium text-white">Commandes Journalières</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-black">Vue Journalière</h1>
            <button
              onClick={fetchOrders}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              {loading ? "⟳" : "↻"} Actualiser
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowRefundForm(true)}
              className="bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow-sm hover:bg-green-200 transition-colors"
            >
              💰 Remboursement crédit
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4] transition-colors"
            >
              Nouvelle commande
            </button>
            <button
              onClick={() => setShowStandbyList(true)}
              className="relative px-6 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-medium shadow-sm transition-colors"
            >
              ⏸️ Stand-by
              {standbyOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {standbyOrders.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Date Navigation & Stats */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <DateNavigation
            selectedDate={selectedDate}
            availableDates={availableDates}
            onDateChange={setSelectedDate}
            onNavigate={navigateDate}
            onToday={goToToday}
          />

          <DailyStatsCard
            cashRevenue={dailyStats.cashRevenue}
            qrRevenue={dailyStats.qrRevenue}
            accountDebitRevenue={dailyStats.accountDebitRevenue}
            startingCashFund={startingCashFund}
            trouValue={trouValue}
            onTrouChange={setTrouValue}
            dailyClosing={dailyClosing}
            loadingClosing={loadingClosing}
          />
        </div>

        {/* Loading & Error */}
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

        {/* Orders List */}
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

            {dailyStats.orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Aucune commande pour cette date</div>
                <div className="text-sm text-gray-400 mt-2">
                  Sélectionnez une autre date ou créez une nouvelle commande
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyStats.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onCancel={handleCancelOrder}
                    onEditProduct={(product) => {
                      setEditingProduct(product);
                      setShowEditForm(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <OrderFormModal
          isOpen={showForm}
          users={users}
          products={products}
          onClose={() => setShowForm(false)}
          onCreate={handleCreateOrder}
          onStandby={handleStandby}
          onAddMember={handleAddMember}
        />

        <RefundModal
          isOpen={showRefundForm}
          users={users}
          onClose={() => setShowRefundForm(false)}
          onRefund={handleRefund}
        />

        {editingProduct && (
          <EditProductModal
            isOpen={showEditForm}
            product={editingProduct}
            onClose={() => {
              setShowEditForm(false);
              setEditingProduct(null);
            }}
            onSave={handleUpdateProduct}
          />
        )}

        <StandbyOrdersModal
          isOpen={showStandbyList}
          standbyOrders={standbyOrders}
          products={products}
          onClose={() => setShowStandbyList(false)}
          onResume={handleResumeStandby}
          onDelete={handleDeleteStandby}
        />

        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onAdd={handleAddMemberSubmit}
        />
      </main>
    </div>
  );
}