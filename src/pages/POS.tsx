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
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Product Selection Area */}
      <div className="flex flex-1 flex-col gap-6 overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Cari produk..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="whitespace-nowrap"
            >
              Semua
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:ring-2 hover:ring-zinc-900"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-zinc-100">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-300">
                      <ShoppingCart className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="truncate font-semibold text-zinc-900">{product.name}</h3>
                  <p className="mt-1 text-sm font-bold text-zinc-900">{formatCurrency(product.price)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Area */}
      <Card className="flex w-96 flex-col border-none shadow-lg">
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="flex items-center justify-between">
            Keranjang
            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Item
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
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
                      <h4 className="truncate text-sm font-medium text-zinc-900">{item.product.name}</h4>
                      <p className="text-xs text-zinc-500">{formatCurrency(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 rounded-full"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-zinc-100 p-4">
                  <ShoppingCart className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="mt-4 text-sm text-zinc-500">Keranjang masih kosong.</p>
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Pajak (10%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            <Button 
              className="w-full h-12 text-lg font-bold gap-2" 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Bayar Sekarang
              <ArrowRight className="h-5 w-5" />
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
