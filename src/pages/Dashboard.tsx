import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, Category, Transaction, TransactionItem, Recipe, InventoryItem } from '../types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'QRIS' | 'TRANSFER'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c, r] = await Promise.all([
          dataService.getProducts(),
          dataService.getCategories(),
          dataService.getRecipes()
        ]);
        setProducts(p);
        setCategories(c);
        setRecipes(r);
      } catch (error) {
        console.error('Error loading POS data:', error);
      }
    };
    loadData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.is_active;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = total * 0.1; // 10% tax
  const grandTotal = total + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const orderNumber = `ORD-${new Date().getTime()}`;
      
      const transactionItems = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      // 1. Create Transaction
      await dataService.addTransaction({
        order_number: orderNumber,
        total_amount: grandTotal,
        tax_amount: tax,
        payment_method: paymentMethod,
        status: 'SUCCESS',
        created_at: new Date().toISOString()
      }, transactionItems);

      // 2. Update Inventory
      const inventory = await dataService.getInventory();
      for (const item of cart) {
        const productRecipes = recipes.filter(r => r.product_id === item.product.id);
        for (const recipe of productRecipes) {
          const invItem = inventory.find(i => i.id === recipe.inventory_item_id);
          if (invItem) {
            await dataService.updateInventoryItem(invItem.id, {
              current_stock: invItem.current_stock - (recipe.quantity_required * item.quantity)
            });
          }
        }
      }

      toast.success('Transaksi Berhasil!');
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-8 overflow-hidden">
      {/* Product Selection Area */}
      <div className="flex flex-1 flex-col gap-8 overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Cari menu favorit..." 
              className="h-12 pl-12 rounded-2xl border-zinc-200 bg-white shadow-sm focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "h-10 px-6 rounded-xl font-bold transition-all",
                selectedCategory === 'all' ? "shadow-lg shadow-primary/20" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              )}
            >
              Semua
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "h-10 px-6 rounded-xl font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat.id ? "shadow-lg shadow-primary/20" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                )}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="group cursor-pointer overflow-hidden border-none bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50 active:scale-95"
                onClick={() => addToCart(product)}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-300">
                      <ShoppingCart className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <CardContent className="p-4">
                  <h3 className="truncate font-bold text-zinc-900">{product.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-black text-primary">{formatCurrency(product.price)}</p>
                    <div className="rounded-lg bg-primary/10 p-1.5 text-primary opacity-0 transition-all group-hover:opacity-100">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Area */}
      <Card className="flex w-[400px] flex-col border-none bg-white shadow-2xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden ring-1 ring-zinc-100">
        <CardHeader className="px-8 py-6 border-b border-zinc-50">
          <CardTitle className="flex items-center justify-between text-xl font-black">
            Keranjang
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 rounded-lg">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Item
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          <ScrollArea className="flex-1 px-8 py-6">
            {cart.length > 0 ? (
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-4 group">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-100">
                      {item.product.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-300">
                          <ShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="truncate text-sm font-bold text-zinc-900">{item.product.name}</h4>
                      <p className="text-xs font-bold text-primary">{formatCurrency(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-50 rounded-xl p-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg bg-white shadow-sm hover:bg-zinc-100"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center text-sm font-black">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg bg-white shadow-sm hover:bg-zinc-100"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-3xl bg-zinc-50 p-8">
                  <ShoppingCart className="h-12 w-12 text-zinc-200" />
                </div>
                <p className="mt-6 text-sm font-bold text-zinc-400 uppercase tracking-widest">Keranjang Kosong</p>
              </div>
            )}
          </ScrollArea>

          <div className="bg-zinc-50/50 px-8 py-8 space-y-6 border-t border-zinc-100">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-zinc-400">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-zinc-400">
                <span>Pajak (10%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-zinc-900 pt-4 border-t border-zinc-200">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            <Button 
              className="w-full h-16 text-xl font-black gap-3 rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Bayar Sekarang
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {[
              { id: 'CASH', label: 'Tunai', icon: Banknote },
              { id: 'CARD', label: 'Kartu', icon: CreditCard },
              { id: 'QRIS', label: 'QRIS', icon: QrCode },
              { id: 'TRANSFER', label: 'Transfer', icon: ArrowRight },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
                    paymentMethod === method.id 
                      ? "border-zinc-900 bg-zinc-50" 
                      : "border-zinc-100 hover:border-zinc-200"
                  )}
                >
                  <Icon className={cn(
                    "h-8 w-8",
                    paymentMethod === method.id ? "text-zinc-900" : "text-zinc-400"
                  )} />
                  <span className="font-medium text-zinc-900">{method.label}</span>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl bg-zinc-900 p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Total Tagihan</span>
              <span className="text-xl font-bold">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-12 text-lg font-bold" 
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi Pembayaran'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(date: Date, formatStr: string) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return formatStr.replace('yyyy', String(yyyy)).replace('MM', mm).replace('dd', dd);
}