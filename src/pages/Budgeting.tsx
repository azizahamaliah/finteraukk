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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Budgeting</h1>
          <p className="text-zinc-500">Kontrol anggaran dan pantau pengeluaran operasional.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Catat Pengeluaran
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exp_category">Kategori Budget</Label>
                  <select 
                    id="exp_category"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                  <Label htmlFor="exp_amount">Jumlah (Rp)</Label>
                  <Input 
                    id="exp_amount" 
                    type="number" 
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_desc">Deskripsi</Label>
                  <Input 
                    id="exp_desc" 
                    value={expenseForm.description} 
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_date">Tanggal</Label>
                  <Input 
                    id="exp_date" 
                    type="date" 
                    value={expenseForm.transaction_date} 
                    onChange={e => setExpenseForm({...expenseForm, transaction_date: e.target.value})}
                    required 
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Simpan Pengeluaran</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Anggaran Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBudget} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bud_name">Nama Kategori</Label>
                  <Input 
                    id="bud_name" 
                    placeholder="e.g. Marketing, Gaji, Sewa"
                    value={budgetForm.category_name} 
                    onChange={e => setBudgetForm({...budgetForm, category_name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bud_limit">Limit Anggaran (Rp)</Label>
                  <Input 
                    id="bud_limit" 
                    type="number" 
                    value={budgetForm.limit_amount} 
                    onChange={e => setBudgetForm({...budgetForm, limit_amount: Number(e.target.value)})}
                    required 
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Simpan Budget</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Progress Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {budgets.map(budget => {
          const categoryExpenses = expenses
            .filter(e => e.category_id === budget.category_name)
            .reduce((sum, e) => sum + e.amount, 0);
          const usage = (categoryExpenses / budget.limit_amount) * 100;
          const remaining = budget.limit_amount - categoryExpenses;

          return (
            <Card key={budget.id} className="border-none shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.category_name}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      usage >= 100 ? "bg-rose-100 text-rose-600" :
                      usage >= 80 ? "bg-amber-100 text-amber-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    {usage >= 100 ? 'Critical' : usage >= 80 ? 'Warning' : 'Aman'}
                  </Badge>
                </div>
                <CardDescription>
                  Periode {format(new Date(budget.period_year, budget.period_month - 1), 'MMMM yyyy', { locale: id })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Terpakai: {formatCurrency(categoryExpenses)}</span>
                  <span className="font-bold text-zinc-900">{Math.round(usage)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      usage >= 100 ? "bg-rose-500" :
                      usage >= 80 ? "bg-amber-500" :
                      "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, usage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">Limit</span>
                    <span className="text-sm font-semibold">{formatCurrency(budget.limit_amount)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">Sisa</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      remaining < 0 ? "text-rose-500" : "text-emerald-600"
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
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Pengeluaran Terbaru</CardTitle>
          <CardDescription>Daftar biaya operasional yang telah dicatat.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="pb-3 font-medium">Kategori</th>
                  <th className="pb-3 font-medium">Deskripsi</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 text-right font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {expenses.slice(0, 10).map((e) => (
                  <tr key={e.id} className="group hover:bg-zinc-50/50">
                    <td className="py-4">
                      <Badge variant="outline" className="font-medium">{e.category_id}</Badge>
                    </td>
                    <td className="py-4 text-zinc-600">{e.description}</td>
                    <td className="py-4 text-zinc-500">{format(new Date(e.transaction_date), 'dd MMM yyyy', { locale: id })}</td>
                    <td className="py-4 text-right font-semibold text-rose-600">
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
