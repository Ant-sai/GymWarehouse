// src/components/Commandes/Modals/OrderFormModal.tsx

import React, { useState, useEffect } from 'react';
import type { User, Product, OrderItem,CreateOrderData,StandbyData } from '../../types/commandes.types';

interface OrderFormModalProps {
  isOpen: boolean;
  users: User[];
  products: Product[];
  onClose: () => void;
  onCreate: (orderData: CreateOrderData) => Promise<void>;
  onStandby: (standbyData: StandbyData) => void;
  onAddMember: (currentState: {
    user: User | null;
    cart: OrderItem[];
    paymentMethod: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE" | null;
    notes: string;
    discountValue: number;
    discountComment: string;
  }) => void;
  // Pour restaurer une commande en stand-by
  initialUser?: User | null;
  initialCart?: OrderItem[];
  initialPaymentMethod?: "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE" | null;
  initialNotes?: string;
  initialDiscountValue?: number;
  initialDiscountComment?: string;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  users,
  products,
  onClose,
  onCreate,
  onStandby,
  onAddMember,
  initialUser = null,
  initialCart = [],
  initialPaymentMethod = null,
  initialNotes = "",
  initialDiscountValue = 0,
  initialDiscountComment = ""
}) => {
  // États du formulaire
  const [selectedUser, setSelectedUser] = useState<User | null>(initialUser);
  const [cart, setCart] = useState<OrderItem[]>(initialCart);
  const [paymentMethod, setPaymentMethod] = useState<"QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE" | null>(initialPaymentMethod || null);
  const [notes, setNotes] = useState(initialNotes);
  const [discountValue, setDiscountValue] = useState(initialDiscountValue);
  const [discountComment, setDiscountComment] = useState(initialDiscountComment);
  const [useTrainerPrice, setUseTrainerPrice] = useState(false);

  // États de recherche
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [userManuallyCleared, setUserManuallyCleared] = useState(false);

  const [saving, setSaving] = useState(false);

  // Restaurer les valeurs initiales quand elles changent
  useEffect(() => {
    console.log('🔄 [useEffect] Modal ouvert:', isOpen);
    if (isOpen) {
      console.log('🔄 [useEffect] Restauration des valeurs initiales:', {
        initialUser,
        initialCart,
        initialPaymentMethod,
        initialNotes,
        initialDiscountValue,
        initialDiscountComment
      });
      setSelectedUser(initialUser);
      setCart(initialCart);
      setPaymentMethod(initialPaymentMethod || null);
      setNotes(initialNotes);
      setDiscountValue(initialDiscountValue);
      setDiscountComment(initialDiscountComment);
      setUserManuallyCleared(false);
    }
  }, [isOpen, initialUser, initialCart, initialPaymentMethod, initialNotes, initialDiscountValue, initialDiscountComment]);

  // Sélectionner automatiquement "Vente instantané" au premier chargement
  useEffect(() => {
    console.log('👤 [useEffect] Auto-sélection utilisateur:', {
      isOpen,
      hasInitialUser: !!initialUser,
      usersCount: users.length,
      hasSelectedUser: !!selectedUser,
      userManuallyCleared
    });

    if (isOpen && initialUser && !selectedUser && !userManuallyCleared) {
      console.log('👤 [useEffect] Utilisateur initial:', initialUser);
      setSelectedUser(initialUser);
    }
  }, [isOpen, initialUser, selectedUser, userManuallyCleared]);

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
    };

    if (showUserDropdown || showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown, showProductDropdown]);

  if (!isOpen) return null;

  console.log('🎨 [Render] Modal OrderFormModal rendu');
  console.log('🎨 [Render] État actuel:', {
    selectedUser,
    cartLength: cart.length,
    paymentMethod,
    usersLength: users.length,
    productsLength: products.length
  });

  const getFullName = (user: User) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Utilisateur sans nom';
  };

  const filteredUsers = users.filter(user =>
    getFullName(user).toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Gestion du panier
  const addToCart = (product: Product) => {
    console.log('🛒 [addToCart] Ajout au panier:', product.name);
    console.log('🛒 [addToCart] selectedUser:', selectedUser);

    const price = useTrainerPrice ? product.trainerPrice : product.price;
    console.log('🛒 [addToCart] Prix calculé:', price, 'useTrainerPrice:', useTrainerPrice);

    const existingItem = cart.find(item => item.productId === product.id);
    console.log('🛒 [addToCart] Item existant?', existingItem);

    if (existingItem) {
      const newCart = cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      console.log('🛒 [addToCart] Mise à jour panier:', newCart);
      setCart(newCart);
    } else {
      const newCart = [...cart, { productId: product.id, quantity: 1, unitPrice: price }];
      console.log('🛒 [addToCart] Nouveau panier:', newCart);
      setCart(newCart);
    }

    // Réinitialiser le champ de recherche de produit
    setProductSearch('');
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    console.log('📝 [updateCartQuantity] Mise à jour quantité:', productId, quantity);

    if (quantity <= 0) {
      const newCart = cart.filter(item => item.productId !== productId);
      console.log('📝 [updateCartQuantity] Retrait du panier:', newCart);
      setCart(newCart);
    } else {
      const newCart = cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
      console.log('📝 [updateCartQuantity] Nouveau panier:', newCart);
      setCart(newCart);
    }
  };

  // Calculs
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };
  const calculateTotal = () => {
    if (paymentMethod === "FREE") return 0;
    const subtotal = calculateSubtotal();
    if (discountValue <= 0) return subtotal;
    return Math.max(0, subtotal - discountValue);
  };

  // Handlers
  const handleSubmit = async () => {
    if (!selectedUser) {
      alert("Veuillez sélectionner un client");
      return;
    }
    if (cart.length === 0) {
      alert("Veuillez ajouter au moins un produit");
      return;
    }
    if (!paymentMethod) {
      alert("Veuillez sélectionner une méthode de paiement");
      return;
    }

    setSaving(true);

    try {
      const orderData = {
        clientId: selectedUser.id,
        paymentMethod: paymentMethod,
        notes: notes,
        discount: discountValue,
        discountComment: discountComment,
        useTrainerPrice: useTrainerPrice,
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      await onCreate(orderData);
      handleClose();
    } catch (err) {
      console.error('Erreur:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de créer la commande";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePutOnStandby = () => {
    if (cart.length === 0) {
      alert("Veuillez ajouter au moins un produit");
      return;
    }

    if (!selectedUser) {
      alert("Veuillez sélectionner un client");
      return;
    }

    // La méthode de paiement peut être définie plus tard
    const standbyData = {
      id: `standby_${Date.now()}`,
      user: selectedUser,
      cart: [...cart],
      paymentMethod,
      notes,
      discountValue,
      discountComment,
      timestamp: Date.now()
    };

    onStandby(standbyData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedUser(null);
    setCart([]);
    setPaymentMethod(null);
    setNotes("");
    setDiscountValue(0);
    setDiscountComment("");
    setUseTrainerPrice(false);
    setUserSearch("");
    setProductSearch("");
    setShowUserDropdown(false);
    setUserManuallyCleared(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg p-8 w-[900px] max-h-[90vh] overflow-y-auto shadow-lg z-50">

              {/* Sélection du client */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative user-search-container">
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setShowUserDropdown(true);
                }}
                onFocus={() => setShowUserDropdown(true)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />

              {/* Dropdown de résultats */}
              {showUserDropdown && userSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Aucun client trouvé
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch('');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-sm border-b last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <span>{getFullName(user)}</span>
                          <span className={`font-medium ${Number(user.balance) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {Number(user.balance).toFixed(2)}€
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Affichage du client sélectionné */}
              {selectedUser && (
                <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getFullName(selectedUser)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setUserSearch('');
                        setUserManuallyCleared(true);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Changer de client"
                    >
                      ✕
                    </button>
                  </div>
                  <span className={`font-medium ${Number(selectedUser.balance) < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    Solde: {Number(selectedUser.balance).toFixed(2)}€
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onAddMember({
                user: selectedUser,
                cart: cart,
                paymentMethod: paymentMethod,
                notes: notes,
                discountValue: discountValue,
                discountComment: discountComment
              })}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
              title="Ajouter un nouveau membre"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Nouveau
            </button>
          </div>
        </div>

        {/* Sélection des produits */}
        <div className="mb-6">
          <div className="relative product-search-container">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />

            {/* Dropdown de résultats */}
            {showProductDropdown && productSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    Aucun produit trouvé
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        addToCart(product);
                        setShowProductDropdown(false);
                      }}
                      disabled={product.quantity <= 0}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-sm border-b last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-gray-500 ml-2">Stock: {product.quantity}</span>
                        </div>
                        <span className="text-gray-600">
                          {useTrainerPrice ? product.trainerPrice : product.price}€
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panier */}
        {cart.length > 0 && (
          <div className="mb-6">
            <div className="border rounded p-4">
              {cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div 
                    key={item.productId} 
                    className="flex justify-between items-center py-2"
                  >
                    <div>
                      <span className="font-medium">{product?.name}</span>
                      <span className="text-gray-600 ml-2">({item.unitPrice}€/unité)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
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

              {/* Réduction */}
              {paymentMethod !== "FREE" && (
                <div className="mt-4">
                  <div className="flex items-center gap-4 mb-2">
                    <label className="text-sm font-medium text-gray-700">Réduction (€):</label>
                    <input
                      type="number"
                      min="0"
                      max={calculateSubtotal()}
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="border rounded px-2 py-1 text-sm w-24 outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="0.00"
                    />
                    <span className="text-sm text-gray-600">€</span>
                    {discountValue > 0 && (
                      <button
                        onClick={() => {
                          setDiscountValue(0);
                          setDiscountComment("");
                        }}
                        className="text-red-500 text-sm hover:text-red-700 transition-colors"
                      >
                        ✕ Supprimer
                      </button>
                    )}
                                                    {/* Checkbox Prix Entraîneur */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useTrainerPrice}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseTrainerPrice(checked);
                          // Recalculer les prix du panier
                          setCart(cart.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return item;
                            const newPrice = checked ? product.trainerPrice : product.price;
                            return { ...item, unitPrice: newPrice };
                          }));
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Prix mono
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Totaux */}
              <div className="mt-4 text-right space-y-1">
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
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => {
        setPaymentMethod("CASH");
      }}
      className={`px-4 py-3 rounded-lg border-2 transition-all shadow-md hover:shadow-lg ${
        paymentMethod === "CASH"
          ? "border-green-500 bg-green-50 text-green-700 font-semibold"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      💵 Espèces
    </button>

    <button
      type="button"
      onClick={() => {
        setPaymentMethod("QRCODE");
      }}
      className={`px-4 py-3 rounded-lg border-2 transition-all shadow-md hover:shadow-lg ${
        paymentMethod === "QRCODE"
          ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      📱 QR Code
    </button>

    <button
      type="button"
      onClick={() => {
        setPaymentMethod("ACCOUNT_DEBIT");
      }}
      className={`px-4 py-3 rounded-lg border-2 transition-all shadow-md hover:shadow-lg ${
        paymentMethod === "ACCOUNT_DEBIT"
          ? "border-purple-500 bg-purple-50 text-purple-700 font-semibold"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      💳 Crédit
    </button>

    {paymentMethod === "ACCOUNT_DEBIT" && selectedUser && (
      <div className="text-sm p-3 bg-gray-50 rounded-lg flex-1">
        <span className={`${Number(selectedUser.balance) < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          Solde: {Number(selectedUser.balance).toFixed(2)}€
          {Number(selectedUser.balance) < 0 && ' (DÉCOUVERT)'}
        </span>
        {cart.length > 0 && (
          <span className="text-xs text-gray-500 ml-3">
            → Après achat: {(Number(selectedUser.balance) - calculateTotal()).toFixed(2)}€
          </span>
        )}
      </div>
    )}
  </div>
</div>






        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handlePutOnStandby}
            disabled={saving || cart.length === 0 || !selectedUser}
            className="px-5 py-2 rounded border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            ⏸️ Mettre en stand-by
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedUser || !paymentMethod || cart.length === 0}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              paymentMethod === "FREE"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#1E2A47] hover:bg-[#2A3B5A]"
            }`}
          >
            {saving ? "Création..." : paymentMethod === "FREE" ? "Créer commande gratuite" : "Créer la commande"}
          </button>
        </div>

        
        {/* Notes */}
        <div className="mb-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            rows={1}
            placeholder="Commentaires sur la commande..."
          />
        </div>
      </div>
    </div>
  );
};