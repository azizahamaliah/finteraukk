import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ChefHat, 
  Tag, 
  Coffee,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, Category, Recipe, InventoryItem } from '../types';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { dataService } from '../services/dataService';

export default function Settings() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [productForm, setProductForm] = useState({ name: '', price: 0, category_id: '', image_url: '', is_active: true });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [recipeForm, setRecipeForm] = useState({ product_id: '', inventory_item_id: '', quantity_required: 0 });

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c, r, i] = await Promise.all([
          dataService.getProducts(),
          dataService.getCategories(),
          dataService.getRecipes(),
          dataService.getInventory()
        ]);
        setProducts(p);
        setCategories(c);
        setRecipes(r);
        setInventory(i);
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addProduct({ ...productForm, created_at: new Date().toISOString() });
      const updated = await dataService.getProducts();
      setProducts(updated);
      toast.success('Produk ditambahkan');
      setIsProductDialogOpen(false);
      setProductForm({ name: '', price: 0, category_id: '', image_url: '', is_active: true });
    } catch (e) { toast.error('Gagal'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await dataService.uploadProductImage(file);
      setProductForm({ ...productForm, image_url: url });
      toast.success('Gambar berhasil diunggah');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengunggah gambar. Pastikan bucket "product-images" sudah dibuat di Supabase Storage.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addCategory(categoryForm);
      const updated = await dataService.getCategories();
      setCategories(updated);
      toast.success('Kategori ditambahkan');
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', description: '' });
    } catch (e) { toast.error('Gagal'); }
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addRecipe(recipeForm);
      const updated = await dataService.getRecipes();
      setRecipes(updated);
      toast.success('Resep ditambahkan');
      setIsRecipeDialogOpen(false);
      setRecipeForm({ product_id: '', inventory_item_id: '', quantity_required: 0 });
    } catch (e) { toast.error('Gagal'); }
  };

  const deleteItem = async (col: string, id: string) => {
    if (!confirm('Hapus item ini?')) return;
    try {
      if (col === 'products') await dataService.deleteProduct(id);
      if (col === 'categories') await dataService.deleteCategory(id);
      if (col === 'recipes') await dataService.deleteRecipe(id);
      
      const [p, c, r] = await Promise.all([
        dataService.getProducts(),
        dataService.getCategories(),
        dataService.getRecipes()
      ]);
      setProducts(p);
      setCategories(c);
      setRecipes(r);
      toast.success('Dihapus');
    } catch (e) { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-zinc-500">Konfigurasi produk, kategori, dan resep bahan baku.</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-zinc-100 p-1">
          <TabsTrigger value="products" className="gap-2"><Coffee className="h-4 w-4" /> Produk</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><Tag className="h-4 w-4" /> Kategori</TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2"><ChefHat className="h-4 w-4" /> Resep</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsProductDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Produk
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(p => (
              <Card key={p.id} className="border-none shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-12 w-12 rounded-lg bg-zinc-100 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : <Coffee className="h-6 w-6 m-3 text-zinc-300" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-semibold truncate">{p.name}</h4>
                    <p className="text-sm text-zinc-500">Rp{p.price.toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem('products', p.id)} className="text-zinc-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCategoryDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Kategori
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(c => (
              <Card key={c.id} className="border-none shadow-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-semibold">{c.name}</h4>
                    <p className="text-sm text-zinc-500">{c.description || 'Tidak ada deskripsi'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem('categories', c.id)} className="text-zinc-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsRecipeDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Resep
            </Button>
          </div>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-500">
                    <th className="p-4 font-medium">Produk</th>
                    <th className="p-4 font-medium">Bahan Baku</th>
                    <th className="p-4 font-medium">Jumlah Dibutuhkan</th>
                    <th className="p-4 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {recipes.map(r => {
                    const product = products.find(p => p.id === r.product_id);
                    const inv = inventory.find(i => i.id === r.inventory_item_id);
                    return (
                      <tr key={r.id}>
                        <td className="p-4 font-medium">{product?.name || 'Unknown'}</td>
                        <td className="p-4">{inv?.name || 'Unknown'}</td>
                        <td className="p-4">{r.quantity_required} {inv?.unit}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteItem('recipes', r.id)} className="text-zinc-400 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Produk</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="space-y-2">
              <Label>Gambar Produk</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center border border-zinc-200">
                  {productForm.image_url ? (
                    <img src={productForm.image_url} className="h-full w-full object-cover" />
                  ) : (
                    <Coffee className="h-8 w-8 text-zinc-300" />
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {isUploading && <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Mengunggah...</p>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Produk</Label>
              <Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Harga</Label>
              <Input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} required />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <select className="w-full rounded-md border p-2" value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})} required>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full">Simpan</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kategori</Label>
              <Input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">Simpan</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Resep</DialogTitle></DialogHeader>
          <form onSubmit={handleAddRecipe} className="space-y-4">
            <div className="space-y-2">
              <Label>Produk</Label>
              <select className="w-full rounded-md border p-2" value={recipeForm.product_id} onChange={e => setRecipeForm({...recipeForm, product_id: e.target.value})} required>
                <option value="">Pilih Produk</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Bahan Baku</Label>
              <select className="w-full rounded-md border p-2" value={recipeForm.inventory_item_id} onChange={e => setRecipeForm({...recipeForm, inventory_item_id: e.target.value})} required>
                <option value="">Pilih Bahan</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah Dibutuhkan</Label>
              <Input type="number" value={recipeForm.quantity_required} onChange={e => setRecipeForm({...recipeForm, quantity_required: Number(e.target.value)})} required />
            </div>
            <Button type="submit" className="w-full">Simpan</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}