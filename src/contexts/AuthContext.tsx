import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut } from '../firebase';

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

  // Mock taken usernames for demonstration
  const [takenUsernames] = useState<string[]>(['admin', 'trader', 'pro']);

  useEffect(() => {
    // Mock user for development
    setUser({
      uid: 'dev-user-id',
      displayName: 'Dev Trader',
      email: 'dev@example.com',
      photoURL: 'https://ui-avatars.com/api/?name=Dev+Trader&background=10b981&color=fff'
    } as any);
    setLoading(false);
  }, []);

  const login = async () => {};
  const logout = async () => {};
  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const isUsernameUnique = async (username: string) => {
    // In a real app, this would query Firestore
    // For mock, we check against takenUsernames and current user
    if (user && username.toLowerCase() === user.displayName?.toLowerCase()) return true;
    return !takenUsernames.includes(username.toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, isUsernameUnique }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
