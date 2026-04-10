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
      <div className="flex h-full flex-col bg-zinc-900 text-zinc-400">
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-900">
            <span className="font-bold">f</span>
          </div>
          <span className="text-xl font-bold text-white">fintera</span>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
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
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-zinc-800 text-white" 
                    : "hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt={user.displayName} 
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user.displayName}</p>
              <div className="flex items-center gap-1">
                <p className="truncate text-[10px] text-zinc-500 uppercase tracking-wider">{user.role || 'User'}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="mt-2 w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-zinc-200 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <span className="font-bold">f</span>
            </div>
            <span className="text-xl font-bold text-zinc-900">fintera</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
