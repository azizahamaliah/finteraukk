
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Procurement from './pages/Procurement';
import Budgeting from './pages/Budgeting';
import Settings from './pages/Settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, Loader2, ShieldCheck, UserCog, UserPlus } from 'lucide-react';
import { UserProfile } from './types';
import { authService } from './services/authService';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'KASIR'>('KASIR');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setUserProfile(user);
      if (user.role === 'KASIR') setCurrentPage('pos');
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.login(email);
      if (user) {
        setUserProfile(user);
        if (user.role === 'KASIR') setCurrentPage('pos');
        toast.success('Berhasil masuk!');
      } else {
        toast.error('Email tidak ditemukan. Silakan daftar.');
      }
    } catch (error) {
      toast.error('Gagal masuk. Periksa koneksi Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.register(email, name, selectedRole);
      if (user) {
        setUserProfile(user);
        if (user.role === 'KASIR') setCurrentPage('pos');
        toast.success(`Berhasil mendaftar sebagai ${selectedRole}`);
      } else {
        toast.error('Gagal mendaftar.');
      }
    } catch (error) {
      toast.error('Gagal mendaftar. Periksa koneksi Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUserProfile(null);
    setCurrentPage('dashboard');
    toast.success('Berhasil keluar!');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
            <span className="text-4xl font-bold">f</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900">fintera</h1>
          <p className="mt-3 text-lg font-medium text-zinc-500">Kelola keuangan cerdas untuk bisnis Anda.</p>
        </div>

        <div className="w-full max-w-md rounded-[2rem] bg-white p-10 shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-100">
          <div className="mb-8 flex p-1 bg-zinc-50 rounded-2xl">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${authMode === 'login' ? 'bg-white text-primary shadow-sm ring-1 ring-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              Masuk
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${authMode === 'register' ? 'bg-white text-primary shadow-sm ring-1 ring-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              Daftar
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 ml-1">Email</label>
                <Input 
                  type="email" 
                  placeholder="nama@email.com" 
                  className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <LogIn className="mr-2 h-5 w-5" /> Masuk
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 ml-1">Nama Lengkap</label>
                <Input 
                  placeholder="John Doe" 
                  className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 ml-1">Email</label>
                <Input 
                  type="email" 
                  placeholder="nama@email.com" 
                  className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 ml-1">Pilih Peran</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('MANAGER')}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-200 ${selectedRole === 'MANAGER' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'}`}
                  >
                    <ShieldCheck className={`h-8 w-8 ${selectedRole === 'MANAGER' ? 'text-primary' : 'text-zinc-300'}`} />
                    <span className="text-sm font-bold">Manager</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('KASIR')}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-200 ${selectedRole === 'KASIR' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'}`}
                  >
                    <UserCog className={`h-8 w-8 ${selectedRole === 'KASIR' ? 'text-primary' : 'text-zinc-300'}`} />
                    <span className="text-sm font-bold">Kasir</span>
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <UserPlus className="mr-2 h-5 w-5" /> Daftar
              </Button>
            </form>
          )}
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  const renderPage = () => {
    // Role-based access control
    if (userProfile.role === 'KASIR' && currentPage !== 'pos') {
      return <POS />;
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'inventory': return <Inventory />;
      case 'procurement': return <Procurement />;
      case 'budgeting': return <Budgeting />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      user={userProfile} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
    >
      {renderPage()}
      <Toaster />
    </Layout>
  );
}