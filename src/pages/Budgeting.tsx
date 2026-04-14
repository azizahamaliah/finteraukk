import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Plus, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Budget, Expense } from '../types';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { dataService } from '../services/dataService';

export default function Budgeting() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    category_name: '',
    limit_amount: 0,
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear()
  });

  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    amount: 0,
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [b, e] = await Promise.all([
          dataService.getBudgets(),
          dataService.getExpenses()
        ]);
        setBudgets(b);
        setExpenses(e);
      } catch (error) {
        console.error('Error loading budgeting data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addBudget({
        ...budgetForm,
        created_at: new Date().toISOString()
      });
      const updatedBudgets = await dataService.getBudgets();
      setBudgets(updatedBudgets);
      toast.success('Budget berhasil diset');
      setIsAddBudgetOpen(false);
      setBudgetForm({ category_name: '', limit_amount: 0, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan budget.');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addExpense(expenseForm);
      const updatedExpenses = await dataService.getExpenses();
      setExpenses(updatedExpenses);
      toast.success('Pengeluaran dicatat');
      setIsAddExpenseOpen(false);
      setExpenseForm({ category_id: '', amount: 0, description: '', transaction_date: format(new Date(), 'yyyy-MM-dd') });
      
      // Check budget threshold
      const budget = budgets.find(b => b.category_name === expenseForm.category_id);
      if (budget) {
        const categoryExpenses = updatedExpenses
          .filter(e => e.category_id === budget.category_name)
          .reduce((sum, e) => sum + e.amount, 0);
        
        const usage = (categoryExpenses / budget.limit_amount) * 100;
        if (usage >= 100) {
          toast.error(`Budget ${budget.category_name} telah terlampaui!`);
          await dataService.addInsight({
            type: 'BUDGET',
            status: 'CRITICAL',
            title: `Overbudget: ${budget.category_name}`,
            message: `Pengeluaran untuk ${budget.category_name} telah mencapai ${Math.round(usage)}% dari limit.`,
            recommendation: 'Segera tinjau pengeluaran dan kurangi biaya non-esensial.',
            is_read: false,
            created_at: new Date().toISOString()
          });
        } else if (usage >= 80) {
          toast.warning(`Budget ${budget.category_name} mendekati limit (80%)`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mencatat pengeluaran.');
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
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Budgeting</h1>
          <p className="mt-1 text-lg font-medium text-zinc-500">Kontrol anggaran dan pantau pengeluaran operasional.</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger >
              <Button variant="outline" className="h-12 px-6 rounded-xl font-bold gap-2 border-zinc-200 hover:bg-zinc-50 transition-all">
                <TrendingDown className="h-5 w-5" />
                Catat Pengeluaran
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Catat Pengeluaran Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="exp_category" className="text-sm font-bold text-zinc-700 ml-1">Kategori Budget</Label>
                  <select 
                    id="exp_category"
                    className="w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={expenseForm.category_id}
                    onChange={e => setExpenseForm({...expenseForm, category_id: e.target.value})}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {budgets.map(b => (
                      <option key={b.id} value={b.category_name}>{b.category_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_amount" className="text-sm font-bold text-zinc-700 ml-1">Jumlah (Rp)</Label>
                  <Input 
                    id="exp_amount" 
                    type="number" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_desc" className="text-sm font-bold text-zinc-700 ml-1">Deskripsi</Label>
                  <Input 
                    id="exp_desc" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={expenseForm.description} 
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_date" className="text-sm font-bold text-zinc-700 ml-1">Tanggal</Label>
                  <Input 
                    id="exp_date" 
                    type="date" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={expenseForm.transaction_date} 
                    onChange={e => setExpenseForm({...expenseForm, transaction_date: e.target.value})}
                    required 
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Simpan Pengeluaran</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
            <DialogTrigger >
              <Button className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-5 w-5" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Set Anggaran Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBudget} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bud_name" className="text-sm font-bold text-zinc-700 ml-1">Nama Kategori</Label>
                  <Input 
                    id="bud_name" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    placeholder="e.g. Marketing, Gaji, Sewa"
                    value={budgetForm.category_name} 
                    onChange={e => setBudgetForm({...budgetForm, category_name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bud_limit" className="text-sm font-bold text-zinc-700 ml-1">Limit Anggaran (Rp)</Label>
                  <Input 
                    id="bud_limit" 
                    type="number" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={budgetForm.limit_amount} 
                    onChange={e => setBudgetForm({...budgetForm, limit_amount: Number(e.target.value)})}
                    required 
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Simpan Budget</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Progress Cards */}
      <div className="grid gap-8 md:grid-cols-2">
        {budgets.map(budget => {
          const categoryExpenses = expenses
            .filter(e => e.category_id === budget.category_name)
            .reduce((sum, e) => sum + e.amount, 0);
          const usage = (categoryExpenses / budget.limit_amount) * 100;
          const remaining = budget.limit_amount - categoryExpenses;

          return (
            <Card key={budget.id} className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden group">
              <CardHeader className="px-8 pt-8 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black text-zinc-900">{budget.category_name}</CardTitle>
                  <Badge 
                    className={cn(
                      "border-none font-black px-3 py-1 rounded-lg",
                      usage >= 100 ? "bg-rose-500 text-white" :
                      usage >= 80 ? "bg-amber-500 text-white" :
                      "bg-primary text-white"
                    )}
                  >
                    {usage >= 100 ? 'Critical' : usage >= 80 ? 'Warning' : 'Aman'}
                  </Badge>
                </div>
                <CardDescription className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">
                  Periode {format(new Date(budget.period_year, budget.period_month - 1), 'MMMM yyyy', { locale: id })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Terpakai</span>
                    <div className="text-2xl font-black text-zinc-900">{formatCurrency(categoryExpenses)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary">{Math.round(usage)}%</span>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000 ease-out rounded-full",
                      usage >= 100 ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" :
                      usage >= 80 ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]" :
                      "bg-primary shadow-[0_0_12px_rgba(32,182,111,0.4)]"
                    )}
                    style={{ width: `${Math.min(100, usage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Limit Anggaran</span>
                    <span className="text-lg font-black text-zinc-900">{formatCurrency(budget.limit_amount)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sisa Saldo</span>
                    <span className={cn(
                      "text-lg font-black",
                      remaining < 0 ? "text-rose-500" : "text-primary"
                    )}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Expenses */}
      <Card className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden">
        <CardHeader className="px-8 pt-8">
          <CardTitle className="text-xl font-black">Pengeluaran Terbaru</CardTitle>
          <CardDescription className="font-medium">Daftar biaya operasional yang telah dicatat.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400">
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Kategori</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Deskripsi</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Tanggal</th>
                  <th className="pb-4 text-right font-black uppercase tracking-widest text-[10px]">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {expenses.slice(0, 10).map((e) => (
                  <tr key={e.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="py-5">
                      <Badge className="bg-zinc-100 text-zinc-600 border-none font-bold px-3 py-1 rounded-lg">{e.category_id}</Badge>
                    </td>
                    <td className="py-5 font-bold text-zinc-900">{e.description}</td>
                    <td className="py-5 font-medium text-zinc-500">{format(new Date(e.transaction_date), 'dd MMM yyyy', { locale: id })}</td>
                    <td className="py-5 text-right font-black text-rose-500 text-lg">
                      - {formatCurrency(e.amount)}
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