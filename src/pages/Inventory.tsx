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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Inventory</h1>
          <p className="text-zinc-500">Kelola stok bahan baku dan pantau ketersediaan.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2" onClick={() => {
              setIsEditing(null);
              setFormData({ name: '', unit: 'GRAM', current_stock: 0, min_stock_level: 0, unit_cost: 0 });
            }}>
              <Plus className="h-4 w-4" />
              Tambah Bahan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Bahan</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={v => setFormData({...formData, unit: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {['KG', 'GRAM', 'LITER', 'ML', 'PCS', 'UNIT'].map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Biaya per Satuan</Label>
                  <Input 
                    id="unit_cost" 
                    type="number" 
                    value={formData.unit_cost} 
                    onChange={e => setFormData({...formData, unit_cost: Number(e.target.value)})}
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Stok Saat Ini</Label>
                  <Input 
                    id="current_stock" 
                    type="number" 
                    value={formData.current_stock} 
                    onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Batas Minimum</Label>
                  <Input 
                    id="min_stock_level" 
                    type="number" 
                    value={formData.min_stock_level} 
                    onChange={e => setFormData({...formData, min_stock_level: Number(e.target.value)})}
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Bahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Section */}
      {lowStockItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lowStockItems.map(item => (
            <Card key={item.id} className="border-rose-100 bg-rose-50/50 shadow-none">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-rose-100 p-2 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-rose-900">{item.name} Hampir Habis!</h4>
                  <p className="text-xs text-rose-600">
                    Stok: {item.current_stock} {item.unit} (Min: {item.min_stock_level})
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50">
                  Restock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inventory Table */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Inventaris</CardTitle>
            <CardDescription>Total {items.length} jenis bahan baku terdaftar.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Cari bahan..." 
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="pb-3 font-medium">Bahan</th>
                  <th className="pb-3 font-medium">Stok Saat Ini</th>
                  <th className="pb-3 font-medium">Satuan</th>
                  <th className="pb-3 font-medium">Biaya/Unit</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-zinc-50/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-zinc-100 p-2 text-zinc-500">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-zinc-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium text-zinc-900">{item.current_stock}</td>
                    <td className="py-4 text-zinc-500">{item.unit}</td>
                    <td className="py-4 text-zinc-500">{formatCurrency(item.unit_cost)}</td>
                    <td className="py-4">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          item.current_stock <= item.min_stock_level 
                            ? "bg-rose-100 text-rose-600" 
                            : "bg-emerald-100 text-emerald-600"
                        )}
                      >
                        {item.current_stock <= item.min_stock_level ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
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
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-rose-600"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
