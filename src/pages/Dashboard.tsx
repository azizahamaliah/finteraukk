import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction, AIInsight, Expense } from '../types';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { generateFinancialInsight } from '../services/aiService';
import { dataService } from '../services/dataService';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInsight = async () => {
    setIsGenerating(true);
    try {
      const data = {
        transactions: transactions.slice(0, 20),
        expenses: expenses.slice(0, 20),
        summary: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: netProfit
        }
      };
      const insight = await generateFinancialInsight(data);
      if (insight) {
        await dataService.addInsight({
          ...insight,
          is_read: false,
          created_at: new Date().toISOString()
        });
        const updatedInsights = await dataService.getInsights();
        setInsights(updatedInsights);
        toast.success('Insight baru berhasil dibuat!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat insight.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, i, e] = await Promise.all([
          dataService.getTransactions(),
          dataService.getInsights(),
          dataService.getExpenses()
        ]);
        setTransactions(t);
        setInsights(i);
        setExpenses(e);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalRevenue = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRevenue = transactions
      .filter(t => t.status === 'SUCCESS' && t.created_at.startsWith(dateStr))
      .reduce((sum, t) => sum + t.total_amount, 0);
    const dayExpense = expenses
      .filter(e => e.transaction_date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      name: format(date, 'EEE', { locale: id }),
      revenue: dayRevenue,
      expense: dayExpense,
    };
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500">Ringkasan performa bisnis Anda hari ini.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
          {format(new Date(), 'dd MMMM yyyy', { locale: id })}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-zinc-400 mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-zinc-400 mt-1">Bulan ini</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-zinc-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Laba Bersih</CardTitle>
            <Wallet className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
            <p className="text-xs text-zinc-500 mt-1">Estimasi keuntungan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Arus Kas</CardTitle>
            <CardDescription>Perbandingan pendapatan dan pengeluaran 7 hari terakhir.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(value) => `Rp${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#f43f5e" 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Insights
              </CardTitle>
              <CardDescription>Analisis cerdas untuk bisnis Anda.</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 hover:text-amber-500"
              onClick={handleGenerateInsight}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="popLayout">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md",
                      insight.status === 'HEALTHY' && "bg-emerald-50 border-emerald-100",
                      insight.status === 'CAUTION' && "bg-amber-50 border-amber-100",
                      insight.status === 'CRITICAL' && "bg-rose-50 border-rose-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-1 rounded-full p-1.5",
                        insight.status === 'HEALTHY' && "bg-emerald-100 text-emerald-600",
                        insight.status === 'CAUTION' && "bg-amber-100 text-amber-600",
                        insight.status === 'CRITICAL' && "bg-rose-100 text-rose-600"
                      )}>
                        {insight.status === 'HEALTHY' ? <CheckCircle2 className="h-4 w-4" /> : 
                         insight.status === 'CAUTION' ? <AlertCircle className="h-4 w-4" /> : 
                         <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-zinc-900">{insight.title}</h4>
                        <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{insight.message}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                            {insight.type}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 group-hover:bg-white/50">
                            Detail <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-zinc-100 p-4">
                    <Info className="h-8 w-8 text-zinc-400" />
                  </div>
                  <p className="mt-4 text-sm text-zinc-500">Belum ada insight tersedia.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 gap-2"
                    onClick={handleGenerateInsight}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate Insight
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>Daftar penjualan terbaru dari POS.</CardDescription>
          </div>
          <Button variant="outline" size="sm">Lihat Semua</Button>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Waktu</th>
                  <th className="pb-3 font-medium">Metode</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="group hover:bg-zinc-50/50">
                    <td className="py-4 font-medium text-zinc-900">{t.order_number}</td>
                    <td className="py-4 text-zinc-500">{format(new Date(t.created_at), 'HH:mm')}</td>
                    <td className="py-4">
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100">
                        {t.payment_method}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          t.status === 'SUCCESS' ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className="text-zinc-600">{t.status}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-semibold text-zinc-900">
                      {formatCurrency(t.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
