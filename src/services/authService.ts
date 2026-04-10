import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const authService = {
  register: async (email: string, name: string, role: 'MANAGER' | 'KASIR'): Promise<UserProfile | null> => {
    // For simplicity in this demo, we'll just use a users table
    // In a real app, you'd use supabase.auth.signUp
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          display_name: name, 
          role, 
          created_at: new Date().toISOString() 
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return null;
    }

    const profile: UserProfile = {
      uid: data.id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      created_at: data.created_at
    };

    localStorage.setItem('fintera_current_user', JSON.stringify(profile));
    return profile;
  },

  login: async (email: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.error('Login error:', error);
      return null;
    }

    const profile: UserProfile = {
      uid: data.id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      created_at: data.created_at
    };

    localStorage.setItem('fintera_current_user', JSON.stringify(profile));
    return profile;
  },

  logout: () => {
    localStorage.removeItem('fintera_current_user');
  },

  getCurrentUser: (): UserProfile | null => {
    const data = localStorage.getItem('fintera_current_user');
    return data ? JSON.parse(data) : null;
  }
};
