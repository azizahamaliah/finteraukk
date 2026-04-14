import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowUpRight, 
  MoreVertical,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { InventoryItem } from '../types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dataService } from '../services/dataService';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unit: 'GRAM' as any,
    current_stock: 0,
    min_stock_level: 0,
    unit_cost: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataService.getInventory();
        setItems(data);
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.current_stock <= item.min_stock_level);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dataService.updateInventoryItem(isEditing.id, formData);
        toast.success('Item berhasil diperbarui');
      } else {
        await dataService.addInventoryItem({
          ...formData,
          last_restock_date: new Date().toISOString()
        });
        toast.success('Item berhasil ditambahkan');
      }
      const updatedData = await dataService.getInventory();
      setItems(updatedData);
      setIsAddDialogOpen(false);
      setIsEditing(null);
      setFormData({ name: '', unit: 'GRAM', current_stock: 0, min_stock_level: 0, unit_cost: 0 });
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item ini?')) return;
    try {
      await dataService.deleteInventoryItem(id);
      const updatedData = await dataService.getInventory();
      setItems(updatedData);
      toast.success('Item dihapus');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus item.');
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
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Inventory</h1>
          <p className="mt-1 text-lg font-medium text-zinc-500">Kelola stok bahan baku dan pantau ketersediaan.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger>
            <Button className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
              setIsEditing(null);
              setFormData({ name: '', unit: 'GRAM', current_stock: 0, min_stock_level: 0, unit_cost: 0 });
            }}>
              <Plus className="h-5 w-5" />
              Tambah Bahan
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{isEditing ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-zinc-700 ml-1">Nama Bahan</Label>
                <Input 
                  id="name" 
                  className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-bold text-zinc-700 ml-1">Satuan</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={v => setFormData({...formData, unit: v as any})}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20">
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {['KG', 'GRAM', 'LITER', 'ML', 'PCS', 'UNIT'].map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost" className="text-sm font-bold text-zinc-700 ml-1">Biaya per Satuan</Label>
                  <Input 
                    id="unit_cost" 
                    type="number" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={formData.unit_cost} 
                    onChange={e => setFormData({...formData, unit_cost: Number(e.target.value)})}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="current_stock" className="text-sm font-bold text-zinc-700 ml-1">Stok Saat Ini</Label>
                  <Input 
                    id="current_stock" 
                    type="number" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={formData.current_stock} 
                    onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level" className="text-sm font-bold text-zinc-700 ml-1">Batas Minimum</Label>
                  <Input 
                    id="min_stock_level" 
                    type="number" 
                    className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                    value={formData.min_stock_level} 
                    onChange={e => setFormData({...formData, min_stock_level: Number(e.target.value)})}
                    required 
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Bahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Section */}
      {lowStockItems.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lowStockItems.map(item => (
            <Card key={item.id} className="border-none bg-rose-50/50 shadow-xl shadow-rose-100/20 rounded-[2rem] overflow-hidden">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-2xl bg-rose-500 p-3 text-white shadow-lg shadow-rose-200">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-rose-900">{item.name} Hampir Habis!</h4>
                  <p className="text-sm font-bold text-rose-600/70">
                    Stok: {item.current_stock} {item.unit}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl font-bold border-rose-200 bg-white text-rose-600 hover:bg-rose-50">
                  Restock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inventory Table */}
      <Card className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-8 pt-8">
          <div>
            <CardTitle className="text-xl font-black">Daftar Inventaris</CardTitle>
            <CardDescription className="font-medium">Total {items.length} jenis bahan baku terdaftar.</CardDescription>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Cari bahan..." 
              className="h-12 pl-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:ring-primary/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-50 text-zinc-400">
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Bahan</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Stok Saat Ini</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Satuan</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Biaya/Unit</th>
                  <th className="pb-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="pb-4 text-right font-black uppercase tracking-widest text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-zinc-100 p-2.5 text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-colors">
                          <Package className="h-5 w-5" />
                        </div>
                        <span className="font-black text-zinc-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-5 font-black text-zinc-900 text-lg">{item.current_stock}</td>
                    <td className="py-5 font-bold text-zinc-500">{item.unit}</td>
                    <td className="py-5 font-bold text-zinc-500">{formatCurrency(item.unit_cost)}</td>
                    <td className="py-5">
                      <Badge 
                        className={cn(
                          "border-none font-bold px-3 py-1 rounded-lg",
                          item.current_stock <= item.min_stock_level 
                            ? "bg-rose-100 text-rose-600" 
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {item.current_stock <= item.min_stock_level ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          onClick={() => {
                            setIsEditing(item);
                            setFormData({
                              name: item.name,
                              unit: item.unit,
                              current_stock: item.current_stock,
                              min_stock_level: item.min_stock_level,
                              unit_cost: item.unit_cost
                            });
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
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