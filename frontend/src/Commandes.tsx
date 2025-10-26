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

type StandByOrder = {
  id: string;
  user: User;
  cart: OrderItem[];
  paymentMethod: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE";
  notes: string;
  discountValue: number;
  discountComment: string;
  createdAt: string;
  label?: string;
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
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountComment, setDiscountComment] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // États pour l'ajout rapide d'un nouveau membre
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    firstName: "",
    lastName: "",
    role: "USER" as "USER" | "TRAINER",
    balance: "",
  });

  // États pour les commandes en Stand By
  const [standByOrders, setStandByOrders] = useState<StandByOrder[]>([]);
  const [showStandByList, setShowStandByList] = useState(false);
  const [standByLabel, setStandByLabel] = useState("");
  const [showStandByLabelModal, setShowStandByLabelModal] = useState(false);

  // Charger toutes les données au montage
  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]).finally(() => setLoading(false));
    loadStandByOrders();
  }, []);

  // Recharger les commandes quand la date change
  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  // Sauvegarder automatiquement les commandes Stand By dans le localStorage
  useEffect(() => {
    if (standByOrders.length > 0) {
      localStorage.setItem('standByOrders', JSON.stringify(standByOrders));
    } else {
      localStorage.removeItem('standByOrders');
    }
  }, [standByOrders]);

  // Charger les commandes Stand By depuis localStorage
  function loadStandByOrders() {
    try {
      const saved = localStorage.getItem('standByOrders');
      if (saved) {
        const parsed = JSON.parse(saved);
        setStandByOrders(parsed);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commandes Stand By:', err);
    }
  }

  // Mettre une commande en Stand By
  function putOrderOnStandBy() {
    if (!selectedUser || cart.length === 0) {
      alert('Veuillez sélectionner un client et ajouter des produits');
      return;
    }

    const newStandBy: StandByOrder = {
      id: Date.now().toString(),
      user: selectedUser,
      cart: [...cart],
      paymentMethod,
      notes,
      discountValue,
      discountComment,
      createdAt: new Date().toISOString(),
      label: standByLabel || `${getFullName(selectedUser)} - ${new Date().toLocaleTimeString('fr-FR')}`,
    };

    setStandByOrders([...standByOrders, newStandBy]);

    // Réinitialiser le formulaire
    resetOrderForm();
    setShowForm(false);
    setStandByLabel("");

    alert('✅ Commande mise en Stand By !');
  }

  // Fonction pour demander un label avant de mettre en Stand By
  function initiateStandBy() {
    setShowStandByLabelModal(true);
  }

  // Confirmer la mise en Stand By avec le label
  function confirmStandBy() {
    putOrderOnStandBy();
    setShowStandByLabelModal(false);
    setStandByLabel("");
  }

  // Restaurer une commande Stand By
  function restoreStandByOrder(standBy: StandByOrder) {
    setSelectedUser(standBy.user);
    setCart([...standBy.cart]);
    setPaymentMethod(standBy.paymentMethod);
    setNotes(standBy.notes);
    setDiscountValue(standBy.discountValue);
    setDiscountComment(standBy.discountComment);
    
    // Supprimer de la liste Stand By
    setStandByOrders(standByOrders.filter(s => s.id !== standBy.id));
    
    // Fermer la liste et ouvrir le formulaire
    setShowStandByList(false);
    setShowForm(true);

    alert('✅ Commande restaurée !');
  }

  // Supprimer une commande Stand By
  function deleteStandByOrder(id: string) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      setStandByOrders(standByOrders.filter(s => s.id !== id));
      alert('🗑️ Commande supprimée');
    }
  }

  // Réinitialiser le formulaire de commande
  function resetOrderForm() {
    setSelectedUser(null);
    setCart([]);
    setPaymentMethod("CASH");
    setNotes("");
    setDiscountValue(0);
    setDiscountComment("");
    setUserSearch("");
    setProductSearch("");
  }

  // Fonctions de récupération de données
  async function fetchOrders() {
    try {
      const response = await fetch(`/api/orders?date=${selectedDate}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des commandes');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Erreur lors de la récupération des produits');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }

  // Fonction utilitaire pour obtenir le nom complet
  function getFullName(user: User): string {
    const parts = [];
    if (user.firstName) parts.push(user.firstName);
    if (user.lastName) parts.push(user.lastName);
    return parts.length > 0 ? parts.join(' ') : `Utilisateur #${user.id}`;
  }

  // Ajouter un produit au panier
  function addToCart(product: Product) {
    const price = selectedUser?.role === "TRAINER" ? product.trainerPrice : product.price;
    
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Augmenter la quantité
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Ajouter un nouveau produit
      setCart([...cart, {
        productId: product.id,
        quantity: 1,
        unitPrice: price
      }]);
    }
  }

  // Supprimer un produit du panier
  function removeFromCart(productId: number) {
    setCart(cart.filter(item => item.productId !== productId));
  }

  // Mettre à jour la quantité dans le panier
  function updateCartQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  }

  // Calculer le total du panier
  function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return Math.max(0, subtotal - discountValue);
  }

  // Enregistrer la commande
  async function saveOrder() {
    if (!selectedUser) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (cart.length === 0) {
      alert('Veuillez ajouter des produits au panier');
      return;
    }

    setSaving(true);
    try {
      const orderData = {
        userId: selectedUser.id,
        items: cart,
        paymentMethod,
        notes,
        discountValue,
        discountComment,
        totalAmount: calculateTotal(),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Erreur lors de la création de la commande');

      alert('✅ Commande enregistrée avec succès !');
      
      // Rafraîchir les données
      await Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
      
      // Réinitialiser le formulaire
      resetOrderForm();
      setShowForm(false);
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'enregistrement de la commande');
    } finally {
      setSaving(false);
    }
  }

  // Ajouter un nouveau membre
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    
    setSaving(true);
    try {
      const memberData = {
        firstName: newMemberForm.firstName || undefined,
        lastName: newMemberForm.lastName || undefined,
        role: newMemberForm.role,
        balance: parseFloat(newMemberForm.balance) || 0,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) throw new Error('Erreur lors de la création du membre');

      const newUser = await response.json();
      
      alert('✅ Membre ajouté avec succès !');
      
      // Rafraîchir la liste des utilisateurs
      await fetchUsers();
      
      // Sélectionner automatiquement le nouveau membre
      setSelectedUser(newUser);
      
      // Réinitialiser et fermer le formulaire
      setNewMemberForm({
        firstName: "",
        lastName: "",
        role: "USER",
        balance: "",
      });
      setShowAddMemberForm(false);
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur lors de l\'ajout du membre');
    } finally {
      setSaving(false);
    }
  }

  // Calculer les statistiques du jour
  function calculateDailyStats(): DailyStats | null {
    if (!orders || orders.length === 0) return null;

    const stats: DailyStats = {
      date: selectedDate,
      orders: orders,
      totalRevenue: 0,
      orderCount: orders.length,
      cashRevenue: 0,
      cardRevenue: 0,
      qrRevenue: 0,
      accountDebitRevenue: 0,
      freeRevenue: 0,
      trainerOrders: 0,
      userOrders: 0,
    };

    orders.forEach(order => {
      stats.totalRevenue += order.totalAmount;
      
      switch (order.paymentMethod) {
        case 'CASH':
          stats.cashRevenue += order.totalAmount;
          break;
        case 'QRCODE':
          stats.qrRevenue += order.totalAmount;
          break;
        case 'ACCOUNT_DEBIT':
          stats.accountDebitRevenue += order.totalAmount;
          break;
        case 'FREE':
          stats.freeRevenue += order.totalAmount;
          break;
      }

      if (order.client.role === 'TRAINER') {
        stats.trainerOrders++;
      } else {
        stats.userOrders++;
      }
    });

    return stats;
  }

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const fullName = getFullName(user).toLowerCase();
    return fullName.includes(userSearch.toLowerCase());
  });

  // Filtrer les produits actifs
  const filteredProducts = products.filter(product => 
    product.isActive && 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const dailyStats = calculateDailyStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={PrimeroseVector} alt="Primerose" className="h-10 w-10" />
              <span className="text-xl font-semibold text-gray-900">Primerose Gym</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
              
              <button
                onClick={() => setShowStandByList(true)}
                className="relative px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                ⏸️ Stand By
                {standByOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {standByOrders.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  resetOrderForm();
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Nouvelle commande
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques du jour */}
        {dailyStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Statistiques du {new Date(selectedDate).toLocaleDateString('fr-FR')}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">Nombre de commandes</div>
                <div className="text-2xl font-bold text-blue-600">{dailyStats.orderCount}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-gray-600">Revenu total</div>
                <div className="text-2xl font-bold text-green-600">{dailyStats.totalRevenue.toFixed(2)}€</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-gray-600">Espèces</div>
                <div className="text-2xl font-bold text-purple-600">{dailyStats.cashRevenue.toFixed(2)}€</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded">
                <div className="text-sm text-gray-600">QR Code</div>
                <div className="text-2xl font-bold text-orange-600">{dailyStats.qrRevenue.toFixed(2)}€</div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des commandes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Commandes du jour</h2>
          </div>
          
          <div className="divide-y">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune commande pour cette date
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">
                        {getFullName(order.client)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.date).toLocaleTimeString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {order.paymentMethod} • {order.products.length} produit(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {order.totalAmount.toFixed(2)}€
                      </div>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      Note: {order.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Formulaire de nouvelle commande */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[90vw] max-w-6xl max-h-[90vh] overflow-auto shadow-lg z-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-black">Nouvelle commande</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sélection du client */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Client</label>
                    <button
                      onClick={() => setShowAddMemberForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Nouveau membre
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                  />

                  <div className="border rounded max-h-60 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="font-medium">{getFullName(user)}</div>
                        <div className="text-sm text-gray-600">
                          {user.role === 'TRAINER' ? '🏋️ Entraîneur' : '👤 Membre'} • 
                          Solde: {user.balance.toFixed(2)}€
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sélection des produits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Produits</label>
                  
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                  />

                  <div className="border rounded max-h-60 overflow-y-auto">
                    {filteredProducts.map(product => {
                      const price = selectedUser?.role === "TRAINER" ? product.trainerPrice : product.price;
                      return (
                        <div
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className="p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                Stock: {product.quantity}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {price.toFixed(2)}€
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panier */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Panier</h4>
                
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 border rounded">
                    Le panier est vide
                  </div>
                ) : (
                  <div className="border rounded">
                    {cart.map(item => {
                      const product = products.find(p => p.id === item.productId);
                      if (!product) return null;
                      
                      return (
                        <div key={item.productId} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.unitPrice.toFixed(2)}€ × {item.quantity}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              🗑️
                            </button>
                            <div className="font-bold text-green-600 min-w-[80px] text-right">
                              {(item.quantity * item.unitPrice).toFixed(2)}€
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Options de commande */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="QRCODE">QR Code</option>
                    <option value="ACCOUNT_DEBIT">Débit compte</option>
                    <option value="FREE">Gratuit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réduction
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="0.00"
                  />
                </div>

                {discountValue > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commentaire sur la réduction
                    </label>
                    <input
                      type="text"
                      value={discountComment}
                      onChange={(e) => setDiscountComment(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Raison de la réduction..."
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="Notes sur la commande..."
                  />
                </div>
              </div>

              {/* Total et actions */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold">Total:</span>
                  <span className="text-3xl font-bold text-green-600">
                    {calculateTotal().toFixed(2)}€
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={initiateStandBy}
                    disabled={!selectedUser || cart.length === 0}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⏸️ Mettre en Stand By
                  </button>
                  
                  <button
                    onClick={saveOrder}
                    disabled={!selectedUser || cart.length === 0 || saving}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Enregistrement...' : '✓ Enregistrer la commande'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajout de membre */}
        {showAddMemberForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddMemberForm(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-4 text-black">Ajouter un nouveau membre</h3>

              <form onSubmit={handleAddMember}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={newMemberForm.role}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as "USER" | "TRAINER" })}
                      className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="USER">Membre</option>
                      <option value="TRAINER">Entraîneur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={newMemberForm.firstName}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, firstName: e.target.value })}
                      className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Prénom (optionnel)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
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
          </div>
        )}

        {/* Modal Liste des commandes Stand By */}
        {showStandByList && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowStandByList(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[700px] max-h-[80vh] overflow-auto shadow-lg z-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-black">⏸️ Commandes en Stand By</h3>
                <button
                  onClick={() => setShowStandByList(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {standByOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucune commande en attente
                </div>
              ) : (
                <div className="space-y-4">
                  {standByOrders.map((standBy) => {
                    const subtotal = standBy.cart.reduce((sum, item) => {
                      return sum + (item.quantity * item.unitPrice);
                    }, 0);
                    const total = Math.max(0, subtotal - standBy.discountValue);

                    return (
                      <div key={standBy.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-lg text-gray-900">
                              {standBy.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              Client: {getFullName(standBy.user)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Créé le: {new Date(standBy.createdAt).toLocaleString('fr-FR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-orange-600">
                              {total.toFixed(2)}€
                            </div>
                            <div className="text-xs text-gray-500">
                              {standBy.cart.length} produit(s)
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 mb-3">
                          <div className="text-sm text-gray-700">Produits:</div>
                          {standBy.cart.map((item) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                              <div key={item.productId} className="text-sm text-gray-600 flex items-center justify-between">
                                <span>
                                  {product?.name || 'Produit inconnu'} × {item.quantity}
                                </span>
                                <span>
                                  {(item.quantity * item.unitPrice).toFixed(2)}€
                                </span>
                              </div>
                            );
                          })}
                          {standBy.discountValue > 0 && (
                            <div className="text-sm text-red-600 flex items-center justify-between mt-1">
                              <span>Réduction: {standBy.discountComment}</span>
                              <span>-{standBy.discountValue.toFixed(2)}€</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => restoreStandByOrder(standBy)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            ▶️ Restaurer
                          </button>
                          <button
                            onClick={() => deleteStandByOrder(standBy.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal pour demander un label avant Stand By */}
        {showStandByLabelModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowStandByLabelModal(false)} />
            <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-4 text-black">⏸️ Mettre en Stand By</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la commande (optionnel)
                </label>
                <input
                  type="text"
                  value={standByLabel}
                  onChange={(e) => setStandByLabel(e.target.value)}
                  placeholder={selectedUser ? `${getFullName(selectedUser)} - ${new Date().toLocaleTimeString('fr-FR')}` : ''}
                  className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Ce nom vous aidera à retrouver la commande plus tard
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStandByLabelModal(false);
                    setStandByLabel("");
                  }}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmStandBy}
                  className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
                >
                  ⏸️ Mettre en Stand By
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}