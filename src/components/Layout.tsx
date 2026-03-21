import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Wallet, BrainCircuit, Target, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'ai', label: 'AI Insights', icon: BrainCircuit },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-6 space-y-10">
      <div className="flex items-center gap-4 px-2 group cursor-pointer">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
          <div className="w-6 h-6 bg-white rounded-lg rotate-45 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col">
          <span className="font-black tracking-tighter text-2xl font-display text-white leading-none">FUTURES</span>
          <span className="text-[10px] font-black tracking-[0.3em] text-emerald-500/70 uppercase mt-1">Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-sm font-bold tracking-wide group relative overflow-hidden",
              currentView === item.id 
                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active-glow" 
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            )}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} className={cn("transition-transform duration-300", currentView === item.id ? "scale-110" : "group-hover:scale-110")} />
            {item.label}
            {currentView === item.id && (
              <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="pt-8 border-t border-slate-800/50 space-y-6">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border-slate-800/30 hover:border-emerald-500/20 transition-colors duration-500 group">
          <div className="relative">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=10b981&color=fff`} 
              alt={user?.displayName || ''} 
              className="w-12 h-12 rounded-xl border border-slate-800 object-cover shadow-inner group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate font-display group-hover:text-emerald-400 transition-colors">{user?.displayName}</p>
            <p className="text-[10px] text-slate-500 truncate font-mono uppercase tracking-tighter opacity-70">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold tracking-wide group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="font-black tracking-tighter text-xl font-display text-white">FUTURES</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 border-r border-slate-800/50 flex-col sticky top-0 h-screen bg-slate-950/50 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Sidebar (Mobile Overlay) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
