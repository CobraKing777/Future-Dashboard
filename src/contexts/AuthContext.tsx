import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  isUsernameUnique: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync profile to profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            email: currentUser.email,
            display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0],
            avatar_url: currentUser.user_metadata?.avatar_url,
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error("Error syncing profile:", profileError);
        }
      }
    });

    // Handle cross-tab session syncing (e.g. from login popup)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('auth-token')) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async () => {
    try {
      const redirectUrl = window.location.origin;
      console.log("Attempting login with redirect to:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Open in a new window to avoid iframe restrictions
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      alert("Login failed: " + (err.message || "Please check your Supabase URL Configuration."));
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    const { error: authError } = await supabase.auth.updateUser({
      data: { 
        display_name: data.displayName,
        avatar_url: data.photoURL
      }
    });
    if (authError) throw authError;

    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          avatar_url: data.photoURL,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error("Error updating profile table:", profileError);
      }
    }
  };

  const isUsernameUnique = async (username: string) => {
    // In Supabase, you'd typically have a profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();
    
    if (error && error.code === 'PGRST116') return true; // Not found
    return !data;
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
