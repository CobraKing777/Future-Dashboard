import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, db } from '../firebase';
import { Account, Trade } from '../types';
import { analyzePerformance } from '../services/geminiService';
import { BrainCircuit, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

import { useAuth } from '../contexts/AuthContext';

export const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribeAccounts = onSnapshot(qAccounts, (snapshot) => {
      const accs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id!);
      }
    });

    const qTrades = query(collection(db, 'trades'), where('userId', '==', user.uid));
    const unsubscribeTrades = onSnapshot(qTrades, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)));
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeTrades();
    };
  }, [user]);

  const handleAnalyze = async () => {
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    setLoading(true);
    const accountTrades = trades.filter(t => t.accountId === selectedAccountId);
    const result = await analyzePerformance(accountTrades, account);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">AI INSIGHTS</h1>
          <p className="text-zinc-500">AI-powered analysis of your trading patterns and psychology.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedAccountId}
            className="bg-zinc-100 text-zinc-950 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate Analysis
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {analysis ? (
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl prose prose-invert max-w-none">
              <div className="flex items-center gap-2 mb-6 text-zinc-400">
                <BrainCircuit size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Gemini AI Analysis</span>
              </div>
              <div className="markdown-body">
                <Markdown>{analysis}</Markdown>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/30 border border-zinc-800 border-dashed p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                <BrainCircuit size={32} className="text-zinc-700" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold">Ready for Analysis?</h3>
                <p className="text-sm text-zinc-500">
                  Select an account and click "Generate Analysis" to get personalized feedback on your trading performance.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">How it works</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-bold">1</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We aggregate your recent trades, including TA notes and psychological reflections.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-bold">2</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gemini AI analyzes your exit reasons (like "Partial Closed" for mental vs structural reasons).
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-bold">3</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You receive actionable feedback on what to improve, what to fix, and how to adjust your rules.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/50 p-6 rounded-2xl flex gap-4">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pro Tip</p>
              <p className="text-xs text-amber-200/70 leading-relaxed">
                The more detailed your notes in the Trade Journal, the better the AI can identify your psychological blind spots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
