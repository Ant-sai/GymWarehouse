// hooks/useCommandes.ts

import { useState, useEffect, useCallback } from 'react';
import type { 
  Order, User, Product, DailyClosing, StandbyOrder, CreateOrderData,RefundData 
} from '../types/commandes.types';
import { ordersApi } from '../services/api/orders';
import { usersApi } from '../services/api/users';
import { productsApi } from '../services/api/products';
import { dailyClosingApi } from '../services/api/dailyClosing';

export function useCommandes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [loadingClosing, setLoadingClosing] = useState(false);
  const [trouValue, setTrouValue] = useState<number>(0);
  const [startingCashFund, setStartingCashFund] = useState<number>(0);
  
  const [standbyOrders, setStandbyOrders] = useState<StandbyOrder[]>([]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersApi.fetchAll();
      setOrders(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des commandes:', err);
      setError("Impossible de récupérer les commandes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const sortedUsers = await usersApi.fetchAll();
      setUsers(sortedUsers);
      return sortedUsers;
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const activeProducts = await productsApi.fetchAll();
      setProducts(activeProducts);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
    }
  }, []);

  // Fetch daily closing
  const fetchDailyClosing = useCallback(async (date: string) => {
    console.log('🔍 [useCommandes] Chargement clôture pour:', date);
    setLoadingClosing(true);
    try {
      const { closing, startingFund } = await dailyClosingApi.fetch(date);
      
      setDailyClosing(closing);
      setTrouValue(Number(closing?.trou) || 0);
      setStartingCashFund(startingFund);
    } catch (err) {
      console.error('💥 [useCommandes] Erreur:', err);
    } finally {
      setLoadingClosing(false);
    }
  }, []);

  // Update trou value
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (trouValue !== (dailyClosing?.trou || 0)) {
        dailyClosingApi.updateTrou(selectedDate, trouValue).catch(console.error);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [trouValue, selectedDate, dailyClosing]);

  // Initial load
  useEffect(() => {
    Promise.all([fetchOrders(), fetchUsers(), fetchProducts()]);
  }, [fetchOrders, fetchUsers, fetchProducts]);

  // Load daily closing when date changes
  useEffect(() => {
    fetchDailyClosing(selectedDate);
  }, [selectedDate, fetchDailyClosing]);

  // Create order
  const createOrder = useCallback(async (orderData: CreateOrderData) => {
    const newOrder = await ordersApi.create(orderData);
    setOrders([newOrder, ...orders]);
    await Promise.all([fetchOrders(), fetchDailyClosing(selectedDate)]);
    return newOrder;
  }, [orders, selectedDate, fetchOrders, fetchDailyClosing]);

  // Cancel order
  const cancelOrder = useCallback(async (order: Order) => {
    await ordersApi.hardDelete(order.id, true);
    setOrders(orders.filter(o => o.id !== order.id));
    await Promise.all([fetchProducts(), fetchUsers()]);
  }, [orders, fetchProducts, fetchUsers]);

  // Update product
  const updateProduct = useCallback(async (productId: number, updates: Partial<Product>) => {
    const updatedProduct = await productsApi.update(productId, updates);
    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    return updatedProduct;
  }, []);

  // Add user
  const addUser = useCallback(async (userData: Partial<User>) => {
    const newUser = await usersApi.create(userData);
    await fetchUsers();
    return newUser;
  }, [fetchUsers]);

  // Refund
  const refund = useCallback(async (refundData: RefundData) => {
    await usersApi.refund(refundData);
    await Promise.all([fetchOrders(), fetchUsers()]);
  }, [fetchOrders, fetchUsers]);

  // Standby orders management
  const putOrderOnStandby = useCallback((standbyOrder: StandbyOrder) => {
    setStandbyOrders(prev => [...prev, standbyOrder]);
  }, []);

  const resumeStandbyOrder = useCallback((standbyId: string) => {
    const order = standbyOrders.find(o => o.id === standbyId);
    setStandbyOrders(prev => prev.filter(o => o.id !== standbyId));
    return order;
  }, [standbyOrders]);

  const deleteStandbyOrder = useCallback((standbyId: string) => {
    setStandbyOrders(prev => prev.filter(o => o.id !== standbyId));
  }, []);

  return {
    // State
    orders,
    users,
    products,
    loading,
    error,
    selectedDate,
    dailyClosing,
    loadingClosing,
    trouValue,
    startingCashFund,
    standbyOrders,
    
    // Setters
    setSelectedDate,
    setTrouValue,
    
    // Actions
    fetchOrders,
    fetchUsers,
    fetchProducts,
    fetchDailyClosing,
    createOrder,
    cancelOrder,
    updateProduct,
    addUser,
    refund,
    putOrderOnStandby,
    resumeStandbyOrder,
    deleteStandbyOrder,
  };
}