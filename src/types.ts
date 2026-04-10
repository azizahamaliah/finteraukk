export interface Product {
  id: string;
  name: string;
  category_id: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Transaction {
  id: string;
  order_number: string;
  total_amount: number;
  tax_amount: number;
  payment_method: 'CASH' | 'CARD' | 'QRIS' | 'TRANSFER';
  status: 'SUCCESS' | 'PENDING' | 'CANCELLED';
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PCS' | 'UNIT';
  current_stock: number;
  min_stock_level: number;
  unit_cost: number;
  last_restock_date?: string;
}

export interface Recipe {
  id: string;
  product_id: string;
  inventory_item_id: string;
  quantity_required: number;
}

export interface Budget {
  id: string;
  category_name: string;
  limit_amount: number;
  period_month: number;
  period_year: number;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  description: string;
  transaction_date: string;
}

export interface AIInsight {
  id: string;
  type: 'CASHFLOW' | 'INVENTORY' | 'BUDGET' | 'PROMO';
  status: 'HEALTHY' | 'CAUTION' | 'CRITICAL';
  title: string;
  message: string;
  recommendation: string;
  is_read: boolean;
  created_at: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'MANAGER' | 'KASIR';
  created_at: string;
}
