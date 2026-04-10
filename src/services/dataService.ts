import { supabase } from '../lib/supabase';
import { 
  Product, 
  Category, 
  Transaction, 
  TransactionItem, 
  InventoryItem, 
  Recipe, 
  Budget, 
  Expense, 
  AIInsight 
} from '../types';

export const dataService = {
  // Products
  getProducts: async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return data as Product[];
  },
  addProduct: async (item: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert([item]).select().single();
    if (error) throw error;
    return data as Product;
  },
  updateProduct: async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
  },
  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Categories
  getCategories: async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data as Category[];
  },
  addCategory: async (item: Omit<Category, 'id'>) => {
    const { data, error } = await supabase.from('categories').insert([item]).select().single();
    if (error) throw error;
    return data as Category;
  },
  deleteCategory: async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  // Inventory
  getInventory: async () => {
    const { data, error } = await supabase.from('inventory_items').select('*').order('name');
    if (error) throw error;
    return data as InventoryItem[];
  },
  addInventoryItem: async (item: Omit<InventoryItem, 'id'>) => {
    const { data, error } = await supabase.from('inventory_items').insert([item]).select().single();
    if (error) throw error;
    return data as InventoryItem;
  },
  updateInventoryItem: async (id: string, updates: Partial<InventoryItem>) => {
    const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
    if (error) throw error;
  },
  deleteInventoryItem: async (id: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
  },

  // Recipes
  getRecipes: async () => {
    const { data, error } = await supabase.from('recipes').select('*');
    if (error) throw error;
    return data as Recipe[];
  },
  addRecipe: async (item: Omit<Recipe, 'id'>) => {
    const { data, error } = await supabase.from('recipes').insert([item]).select().single();
    if (error) throw error;
    return data as Recipe;
  },
  deleteRecipe: async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  },

  // Transactions
  getTransactions: async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Transaction[];
  },
  addTransaction: async (item: Omit<Transaction, 'id'>, items: Omit<TransactionItem, 'id' | 'transaction_id'>[]) => {
    // Start a "transaction" manually since Supabase JS doesn't have a built-in transaction helper for multiple tables easily
    // We'll use a single RPC or just sequential inserts (sequential is simpler for now)
    const { data: transaction, error: tError } = await supabase.from('transactions').insert([item]).select().single();
    if (tError) throw tError;

    const transactionItems = items.map(i => ({
      ...i,
      transaction_id: transaction.id
    }));

    const { error: iError } = await supabase.from('transaction_items').insert(transactionItems);
    if (iError) throw iError;

    return transaction as Transaction;
  },

  // Budgets
  getBudgets: async () => {
    const { data, error } = await supabase.from('budgets').select('*');
    if (error) throw error;
    return data as Budget[];
  },
  addBudget: async (item: Omit<Budget, 'id'>) => {
    const { data, error } = await supabase.from('budgets').insert([item]).select().single();
    if (error) throw error;
    return data as Budget;
  },

  // Expenses
  getExpenses: async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('transaction_date', { ascending: false });
    if (error) throw error;
    return data as Expense[];
  },
  addExpense: async (item: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase.from('expenses').insert([item]).select().single();
    if (error) throw error;
    return data as Expense;
  },

  // Insights
  getInsights: async () => {
    const { data, error } = await supabase.from('ai_insights').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as AIInsight[];
  },
  addInsight: async (item: Omit<AIInsight, 'id'>) => {
    const { data, error } = await supabase.from('ai_insights').insert([item]).select().single();
    if (error) throw error;
    return data as AIInsight;
  }
};
