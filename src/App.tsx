import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AccountCenter } from './components/AccountCenter';
import { TradeJournal } from './components/TradeJournal';
import { StrategyCenter } from './components/Strategy';
import { AIInsights } from './components/AIInsights';
import { ReferenceTab } from './components/ReferenceTab';
import { AuthProvider } from './contexts/AuthContext';
import { useState } from 'react';

type View = 'dashboard' | 'accounts' | 'journal' | 'ai' | 'strategy' | 'reference';

const AppContent: React.FC = () => {
  const { user, loading, login } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-100">
        <div className="animate-pulse text-xl font-mono">INITIALIZING...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <div className="w-10 h-10 bg-white rounded-lg rotate-45" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">RTFT DASHBOARD</h1>
            <p className="text-slate-500 text-sm font-medium">Professional Futures Trading Performance Tracking</p>
          </div>
          
          <button
            onClick={login}
            className="w-full bg-white text-slate-950 h-14 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <p className="text-[10px] text-slate-600 uppercase font-bold tracking-[0.2em]">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'accounts': return <AccountCenter />;
      case 'journal': return <TradeJournal />;
      case 'ai': return <AIInsights />;
      case 'strategy': return <StrategyCenter />;
      case 'reference': return <ReferenceTab />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
