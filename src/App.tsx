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
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-white">
            <span className="text-2xl font-bold">f</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">fintera</h1>
          <p className="mt-2 text-zinc-500">Kelola keuangan cerdas untuk bisnis Anda.</p>
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-zinc-200/50">
          <div className="mb-6 flex gap-4 border-b border-zinc-100 pb-4">
            <button 
              onClick={() => setAuthMode('login')}
              className={`flex-1 pb-2 text-sm font-bold transition-all ${authMode === 'login' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400'}`}
            >
              Masuk
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              className={`flex-1 pb-2 text-sm font-bold transition-all ${authMode === 'register' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-400'}`}
            >
              Daftar
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Email</label>
                <Input 
                  type="email" 
                  placeholder="nama@email.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full gap-2">
                <LogIn className="h-4 w-4" /> Masuk
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nama Lengkap</label>
                <Input 
                  placeholder="John Doe" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Email</label>
                <Input 
                  type="email" 
                  placeholder="nama@email.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Pilih Peran</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('MANAGER')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${selectedRole === 'MANAGER' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 bg-white'}`}
                  >
                    <ShieldCheck className={`h-6 w-6 ${selectedRole === 'MANAGER' ? 'text-zinc-900' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-bold ${selectedRole === 'MANAGER' ? 'text-zinc-900' : 'text-zinc-400'}`}>Manager</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('KASIR')}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${selectedRole === 'KASIR' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 bg-white'}`}
                  >
                    <UserCog className={`h-6 w-6 ${selectedRole === 'KASIR' ? 'text-zinc-900' : 'text-zinc-400'}`} />
                    <span className={`text-xs font-bold ${selectedRole === 'KASIR' ? 'text-zinc-900' : 'text-zinc-400'}`}>Kasir</span>
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2">
                <UserPlus className="h-4 w-4" /> Daftar
              </Button>
            </form>
          )}
        </div>
        <Toaster />
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
