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
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-1 text-lg font-medium text-zinc-500">Konfigurasi produk, kategori, dan resep bahan baku.</p>
      </div>

      <Tabs defaultValue="products" className="space-y-8">
        <TabsList className="bg-white p-1.5 rounded-2xl shadow-sm ring-1 ring-zinc-100">
          <TabsTrigger value="products" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Coffee className="h-4 w-4" /> Produk
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Tag className="h-4 w-4" /> Kategori
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <ChefHat className="h-4 w-4" /> Resep
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsProductDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-5 w-5" /> Tambah Produk
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(p => (
              <Card key={p.id} className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden group">
                <CardContent className="flex items-center gap-5 p-6">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-100 overflow-hidden ring-1 ring-zinc-100">
                    {p.image_url ? (
                      <img src={p.image_url} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-300">
                        <Coffee className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-black text-zinc-900 truncate">{p.name}</h4>
                    <p className="text-sm font-bold text-primary">Rp{p.price.toLocaleString()}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteItem('products', p.id)} 
                    className="h-10 w-10 rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsCategoryDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-5 w-5" /> Tambah Kategori
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(c => (
              <Card key={c.id} className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-black text-zinc-900">{c.name}</h4>
                    <p className="text-sm font-medium text-zinc-500">{c.description || 'Tidak ada deskripsi'}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteItem('categories', c.id)} 
                    className="h-10 w-10 rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsRecipeDialogOpen(true)} className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-5 w-5" /> Tambah Resep
            </Button>
          </div>
          <Card className="border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-50 text-zinc-400">
                    <th className="p-6 font-black uppercase tracking-widest text-[10px]">Produk</th>
                    <th className="p-6 font-black uppercase tracking-widest text-[10px]">Bahan Baku</th>
                    <th className="p-6 font-black uppercase tracking-widest text-[10px]">Jumlah Dibutuhkan</th>
                    <th className="p-6 text-right font-black uppercase tracking-widest text-[10px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {recipes.map(r => {
                    const product = products.find(p => p.id === r.product_id);
                    const inv = inventory.find(i => i.id === r.inventory_item_id);
                    return (
                      <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-6 font-bold text-zinc-900">{product?.name || 'Unknown'}</td>
                        <td className="p-6 font-medium text-zinc-600">{inv?.name || 'Unknown'}</td>
                        <td className="p-6">
                          <Badge className="bg-primary/10 text-primary border-none font-bold px-3 py-1 rounded-lg">
                            {r.quantity_required} {inv?.unit}
                          </Badge>
                        </td>
                        <td className="p-6 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteItem('recipes', r.id)} 
                            className="h-10 w-10 rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
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
        <DialogContent className="rounded-[2rem] p-8">
          <DialogHeader><DialogTitle className="text-2xl font-black">Tambah Produk</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-6 mt-4">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-zinc-700 ml-1">Gambar Produk</Label>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-3xl bg-zinc-50 overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-200 transition-all hover:border-primary/50">
                  {productForm.image_url ? (
                    <img src={productForm.image_url} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Coffee className="h-10 w-10 text-zinc-200" />
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={isUploading}
                    className="h-12 rounded-xl border-zinc-200 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {isUploading && <p className="text-xs font-bold text-primary mt-2 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Mengunggah...</p>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-zinc-700 ml-1">Nama Produk</Label>
              <Input 
                className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                value={productForm.name} 
                onChange={e => setProductForm({...productForm, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-zinc-700 ml-1">Harga</Label>
              <Input 
                type="number" 
                className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                value={productForm.price} 
                onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-zinc-700 ml-1">Kategori</Label>
              <select 
                className="w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20" 
                value={productForm.category_id} 
                onChange={e => setProductForm({...productForm, category_id: e.target.value})} 
                required
              >
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Simpan Produk
            </Button>
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