import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck,
  Wallet, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS / Kasir', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'procurement', label: 'Pengadaan', icon: Truck },
  { id: 'budgeting', label: 'Budgeting', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout({ children, user, onLogout, currentPage, onPageChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const SidebarContent = () => {
    const filteredNavItems = navItems.filter(item => {
      if (user.role === 'KASIR') {
        return item.id === 'pos';
      }
      return true;
    });

    return (
      <div className="flex h-full flex-col bg-white text-zinc-600">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <span className="text-xl font-bold">f</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">fintera</span>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-zinc-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=20b66f&color=fff`} 
                alt={user.displayName} 
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-white"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-zinc-900">{user.displayName}</p>
                <p className="truncate text-[10px] font-bold text-primary uppercase tracking-wider">{user.role || 'User'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="mt-4 w-full justify-start gap-3 rounded-xl text-zinc-500 hover:bg-white hover:text-rose-600 hover:shadow-sm"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-semibold">Keluar</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 border-r border-zinc-100 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-zinc-100 bg-white px-6 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-bold">f</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">fintera</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger >
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}