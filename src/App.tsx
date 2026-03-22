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
