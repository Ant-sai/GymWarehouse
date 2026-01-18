// src/types/commandes.types.ts

export type UserRole = "USER" | "TRAINER";
export type PaymentMethod = "QRCODE" | "CASH" | "ACCOUNT_DEBIT" | "FREE";

export type User = {
  id: number;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  balance: number;
}

export type Product = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  trainerPrice: number;
  isActive: boolean;
}

export type OrderItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export type OrderProduct = {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type Order = {
  id: number;
  client: User;
  totalAmount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  discount?: number;
  products: OrderProduct[];
}

export type DailyClosing = {
  id: number;
  date: string;
  cashRevenue: number;
  qrRevenue: number;
  creditRevenue: number;
  trou: number;
  startingCash: number;
  endingCash: number;
  notes?: string;
  closedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export type DailyStats = {
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
}

export type StandbyOrder = {
  id: string;
  user: User;
  cart: OrderItem[];
  paymentMethod: PaymentMethod;
  notes: string;
  discountValue: number;
  discountComment: string;
  timestamp: number;
}

export type CreateOrderData = {
  clientId: number;
  paymentMethod: PaymentMethod;
  notes: string;
  discount: number;
  discountComment: string;
  useTrainerPrice?: boolean;
  products: Array<{
    productId: number;
    quantity: number;
  }>;
}

export type StandbyData = {
  id: string;
  user: User | null;
  cart: OrderItem[];
  paymentMethod: PaymentMethod | null;
  notes: string;
  discountValue: number;
  discountComment: string;
  timestamp: number;
}

export type RefundData = {
  userId: number;
  amount: number;
  paymentMethod: "CASH" | "QRCODE";
  notes: string;
}