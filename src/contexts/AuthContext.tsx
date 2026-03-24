import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string; appLogoURL?: string }) => Promise<void>;
  isUsernameUnique: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock session check
    const savedUser = localStorage.getItem('mock-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async () => {
    setLoading(true);
    // Mock login with a dummy user
    const mockUser: any = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      user_metadata: {
        display_name: 'Dev User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
        app_logo_url: '/api/attachments/a7122851-4034-4531-9025-667793656783'
      }
    };
    setUser(mockUser);
    localStorage.setItem('mock-user', JSON.stringify(mockUser));
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('mock-user');
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string; appLogoURL?: string }) => {
    if (user) {
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          display_name: data.displayName || user.user_metadata?.display_name,
          avatar_url: data.photoURL || user.user_metadata?.avatar_url,
          app_logo_url: data.appLogoURL || user.user_metadata?.app_logo_url
        }
      };
      setUser(updatedUser);
      localStorage.setItem('mock-user', JSON.stringify(updatedUser));
    }
  };

  const isUsernameUnique = async (username: string) => {
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, isUsernameUnique }}>
        {children}
      </AuthContext.Provider>
    </div>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
