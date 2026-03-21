import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AccountCenter } from './components/AccountCenter';
import { TradeJournal } from './components/TradeJournal';
import { StrategyCenter } from './components/Strategy';
import { AIInsights } from './components/AIInsights';
import { AuthProvider } from './contexts/AuthContext';
import { useState } from 'react';

type View = 'dashboard' | 'accounts' | 'journal' | 'ai' | 'strategy';

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
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-mono">
              FUTURES JOURNAL
            </h1>
            <p className="text-zinc-400">
              Professional trade tracking and AI-powered performance analysis.
            </p>
          </div>
          <button
            onClick={login}
            className="w-full py-3 px-4 bg-zinc-100 text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            Login with Google
          </button>
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
