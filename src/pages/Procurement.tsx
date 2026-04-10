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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Pengadaan Cerdas</h1>
          <p className="text-zinc-500">Analisis kebutuhan bahan baku berdasarkan tren penjualan.</p>
        </div>
        <Button 
          onClick={handleGenerateProcurement} 
          disabled={isGenerating}
          className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analisis Kebutuhan
        </Button>
      </div>

      {!insight ? (
        <Card className="border-dashed border-2 border-zinc-200 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-zinc-100 p-6">
              <Truck className="h-10 w-10 text-zinc-400" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-zinc-900">Mulai Analisis Pengadaan</h3>
            <p className="mt-2 max-w-sm text-zinc-500">
              Sistem akan menghitung konsumsi bahan baku dari transaksi terakhir dan memberikan rekomendasi belanja yang efisien.
            </p>
            <Button variant="outline" className="mt-8" onClick={handleGenerateProcurement} disabled={isGenerating}>
              Klik untuk Menganalisis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Summary Card */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-zinc-900" />
                Ringkasan Analisis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl bg-zinc-50 p-6">
                <p className="text-lg leading-relaxed text-zinc-700 italic">
                  "{insight.summary}"
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-100 p-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                    <Scale className="h-4 w-4" />
                    Skor Efisiensi
                  </div>
                  <div className="text-3xl font-bold text-zinc-900">{insight.efficiency_score}%</div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
                    <div 
                      className="h-full rounded-full bg-zinc-900 transition-all" 
                      style={{ width: `${insight.efficiency_score}%` }}
                    />
                  </div>
                </div>
                <div className={cn(
                  "rounded-xl border p-4",
                  insight.waste_risk_level === 'LOW' ? "bg-emerald-50 border-emerald-100" :
                  insight.waste_risk_level === 'MEDIUM' ? "bg-amber-50 border-amber-100" :
                  "bg-rose-50 border-rose-100"
                )}>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risiko Pemborosan
                  </div>
                  <div className={cn(
                    "text-3xl font-bold",
                    insight.waste_risk_level === 'LOW' ? "text-emerald-700" :
                    insight.waste_risk_level === 'MEDIUM' ? "text-amber-700" :
                    "text-rose-700"
                  )}>
                    {insight.waste_risk_level}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Rekomendasi Aksi</CardTitle>
              <CardDescription>Daftar bahan yang perlu perhatian.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] px-6">
                <div className="space-y-4 pb-6">
                  {insight.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="group relative rounded-xl border border-zinc-100 p-4 transition-all hover:border-zinc-200 hover:shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-zinc-900">{rec.item_name}</h4>
                        <Badge 
                          variant="secondary"
                          className={cn(
                            rec.action === 'RESTOCK' ? "bg-emerald-100 text-emerald-700" :
                            rec.action === 'REDUCE' ? "bg-rose-100 text-rose-700" :
                            "bg-zinc-100 text-zinc-700"
                          )}
                        >
                          {rec.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mb-3">{rec.reason}</p>
                      <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Estimasi Kebutuhan</span>
                        <span className="text-sm font-bold text-zinc-900">{rec.estimated_need} {rec.unit}</span>
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
