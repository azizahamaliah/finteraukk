import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  BarChart3,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';
import { Transaction, InventoryItem, Recipe, Product } from '../types';
import { generateProcurementInsight } from '../services/procurementService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Procurement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [insight, setInsight] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, i, r, p] = await Promise.all([
          dataService.getTransactions(),
          dataService.getInventory(),
          dataService.getRecipes(),
          dataService.getProducts()
        ]);
        setTransactions(t);
        setInventory(i);
        setRecipes(r);
        setProducts(p);
      } catch (error) {
        console.error('Error loading procurement data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerateProcurement = async () => {
    setIsGenerating(true);
    try {
      // Prepare data for AI: calculate usage based on transactions and recipes
      const data = {
        inventory: inventory.map(i => ({
          name: i.name,
          current_stock: i.current_stock,
          unit: i.unit,
          min_level: i.min_stock_level
        })),
        recent_sales: transactions.slice(0, 50).map(t => ({
          date: t.created_at,
          amount: t.total_amount
        })),
        // Simplified mapping for AI context
        recipe_context: recipes.map(r => {
          const p = products.find(prod => prod.id === r.product_id);
          const i = inventory.find(inv => inv.id === r.inventory_item_id);
          return {
            product: p?.name,
            ingredient: i?.name,
            qty: r.quantity_required
          };
        })
      };

      const result = await generateProcurementInsight(data);
      if (result) {
        setInsight(result);
        toast.success('Analisis pengadaan selesai!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghasilkan analisis.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Pengadaan Cerdas</h1>
          <p className="mt-1 text-lg font-medium text-zinc-500">Analisis kebutuhan bahan baku berdasarkan tren penjualan.</p>
        </div>
        <Button 
          onClick={handleGenerateProcurement} 
          disabled={isGenerating}
          className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          Analisis Kebutuhan
        </Button>
      </div>

      {!insight ? (
        <Card className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[3rem] overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-[2.5rem] bg-zinc-50 p-10 shadow-inner">
              <Truck className="h-16 w-16 text-zinc-300" />
            </div>
            <h3 className="mt-10 text-3xl font-black text-zinc-900">Mulai Analisis Pengadaan</h3>
            <p className="mt-4 max-w-md text-lg font-medium text-zinc-500 leading-relaxed">
              Sistem AI akan menghitung konsumsi bahan baku dari transaksi terakhir dan memberikan rekomendasi belanja yang efisien.
            </p>
            <Button 
              variant="outline" 
              className="mt-10 h-14 px-8 rounded-2xl font-black text-lg border-zinc-200 hover:bg-zinc-50 transition-all" 
              onClick={handleGenerateProcurement} 
              disabled={isGenerating}
            >
              Klik untuk Menganalisis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Summary Card */}
          <Card className="lg:col-span-2 border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-black">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                Ringkasan Analisis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              <div className="rounded-[2rem] bg-zinc-50 p-8 shadow-inner">
                <p className="text-xl leading-relaxed text-zinc-700 font-medium italic">
                  "{insight.summary}"
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-zinc-100 p-6 bg-white shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                    <Scale className="h-4 w-4" />
                    Skor Efisiensi
                  </div>
                  <div className="flex items-end gap-2 mb-4">
                    <div className="text-5xl font-black text-zinc-900">{insight.efficiency_score}</div>
                    <div className="text-xl font-black text-primary mb-1">%</div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary shadow-[0_0_12px_rgba(32,182,111,0.4)] transition-all duration-1000" 
                      style={{ width: `${insight.efficiency_score}%` }}
                    />
                  </div>
                </div>
                <div className={cn(
                  "rounded-[2rem] border p-6 shadow-sm",
                  insight.waste_risk_level === 'LOW' ? "bg-emerald-50/50 border-emerald-100" :
                  insight.waste_risk_level === 'MEDIUM' ? "bg-amber-50/50 border-amber-100" :
                  "bg-rose-50/50 border-rose-100"
                )}>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    Risiko Pemborosan
                  </div>
                  <div className={cn(
                    "text-5xl font-black",
                    insight.waste_risk_level === 'LOW' ? "text-emerald-600" :
                    insight.waste_risk_level === 'MEDIUM' ? "text-amber-600" :
                    "text-rose-600"
                  )}>
                    {insight.waste_risk_level}
                  </div>
                  <p className="mt-4 text-sm font-bold opacity-60">
                    {insight.waste_risk_level === 'LOW' ? "Aman untuk stok saat ini." :
                     insight.waste_risk_level === 'MEDIUM' ? "Perlu pemantauan berkala." :
                     "Segera kurangi pembelian berlebih."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <Card className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-xl font-black">Rekomendasi Aksi</CardTitle>
              <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Daftar bahan yang perlu perhatian.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] px-8">
                <div className="space-y-6 pb-8">
                  {insight.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="group relative rounded-[1.5rem] border border-zinc-100 p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-black text-zinc-900 text-lg">{rec.item_name}</h4>
                        <Badge 
                          className={cn(
                            "border-none font-black px-3 py-1 rounded-lg",
                            rec.action === 'RESTOCK' ? "bg-primary text-white" :
                            rec.action === 'REDUCE' ? "bg-rose-500 text-white" :
                            "bg-zinc-100 text-zinc-600"
                          )}
                        >
                          {rec.action}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-4">{rec.reason}</p>
                      <div className="flex items-center justify-between border-t border-zinc-50 pt-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Estimasi Kebutuhan</span>
                        <span className="text-lg font-black text-zinc-900">{rec.estimated_need} {rec.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}