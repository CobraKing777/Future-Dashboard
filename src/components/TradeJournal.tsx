import React, { useState, useEffect } from 'react';
import { db } from '../supabase';
import { Trade, Account, Strategy, TradeExit } from '../types';
import { formatCurrency, calculatePnL, calculateExitPnL, calculateRiskReward, cn } from '../utils';
import { InfoTooltip } from './InfoTooltip';
import { Plus, Calendar, ArrowUpRight, ArrowDownRight, Filter, ChevronDown, ChevronUp, Image as ImageIcon, X, Target, LogOut as ExitIcon, Brain, Info, Shield, Activity, TrendingUp, Edit2, Trash2, Check } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const TradeJournal: React.FC = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showStrategyRef, setShowStrategyRef] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const clearAllTrades = async () => {
    if (!user) return;
    
    setIsClearingAll(true);
    setShowClearConfirm(false);
    try {
      await db.trades.clear(user.id);
      setNotification({ message: 'All trades cleared successfully.', type: 'success' });
    } catch (error) {
      console.error('Error clearing trades:', error);
      setNotification({ message: 'Failed to clear trades.', type: 'error' });
    } finally {
      setIsClearingAll(false);
    }
  };
  
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const isFailed = selectedAccount?.type === 'Failed';
  const isNoAccountSelected = !selectedAccountId;

  useEffect(() => {
    if (!user) return;

    // Initial load
    db.accounts.list(user.id).then(accs => {
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id!);
      }
    });
    db.trades.list(user.id).then(setTrades);
    db.strategies.list(user.id).then(setStrategies);

    // Subscriptions
    const unsubAccounts = db.accounts.subscribe(user.id, (payload) => {
      if (payload.eventType === 'INSERT') setAccounts(prev => [...prev, payload.new as Account]);
      if (payload.eventType === 'UPDATE') setAccounts(prev => prev.map(a => a.id === payload.new.id ? payload.new as Account : a));
      if (payload.eventType === 'DELETE') setAccounts(prev => prev.filter(a => a.id !== payload.old.id));
    });

    const unsubTrades = db.trades.subscribe(user.id, (payload) => {
      if (payload.eventType === 'INSERT') setTrades(prev => [...prev, payload.new as Trade]);
      if (payload.eventType === 'UPDATE') setTrades(prev => prev.map(t => t.id === payload.new.id ? payload.new as Trade : t));
      if (payload.eventType === 'DELETE') setTrades(prev => prev.filter(t => t.id !== payload.old.id));
    });

    const unsubStrategies = db.strategies.subscribe(user.id, (payload) => {
      if (payload.eventType === 'INSERT') setStrategies(prev => [...prev, payload.new as Strategy]);
      if (payload.eventType === 'UPDATE') setStrategies(prev => prev.map(s => s.id === payload.new.id ? payload.new as Strategy : s));
      if (payload.eventType === 'DELETE') setStrategies(prev => prev.filter(s => s.id !== payload.old.id));
    });

    return () => {
      unsubAccounts();
      unsubTrades();
      unsubStrategies();
    };
  }, [user]);

  const [formData, setFormData] = useState({
    id: '',
    accountId: '',
    strategyId: '',
    asset: 'NQ' as any,
    direction: 'Long' as 'Long' | 'Short',
    contractSize: 1,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    exits: [] as TradeExit[],
    date: new Date(),
    beforeImage: '',
    afterImage: '',
    // Strategy Checkpoints
    entryContext: '',
    marketRegime: '',
    fundamentalContext: '',
    exitLogicFollowed: true,
    psychologyStatus: 'Calm' as any,
  });

  // Auto-calculate direction and risk/reward
  useEffect(() => {
    if (formData.entryPrice && formData.takeProfit && formData.stopLoss) {
      const direction = formData.takeProfit > formData.entryPrice ? 'Long' : 'Short';
      setFormData(prev => ({ ...prev, direction }));
    }
  }, [formData.entryPrice, formData.takeProfit, formData.stopLoss]);

  const handleImageUpload = (file: File, field: 'beforeImage' | 'afterImage') => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'beforeImage' | 'afterImage') => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, field);
  };

  const onDrop = (e: React.DragEvent, field: 'beforeImage' | 'afterImage') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file, field);
  };

  const onPaste = (e: React.ClipboardEvent, field: 'beforeImage' | 'afterImage') => {
    const item = e.clipboardData.items[0];
    if (item?.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) handleImageUpload(file, field);
    }
  };

  const selectedStrategy = strategies.find(s => s.id === formData.strategyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.accountId) {
      setNotification({ message: 'Please select an account for this trade.', type: 'error' });
      return;
    }

    const account = accounts.find(a => a.id === formData.accountId);
    const commissionPerContract = account?.commissions?.[formData.asset] || 0;

    const pnl = calculatePnL(
      formData.asset, 
      formData.direction, 
      formData.contractSize, 
      formData.entryPrice, 
      formData.exits,
      commissionPerContract
    );
    const totalClosedContracts = formData.exits.reduce((sum, e) => sum + e.contracts, 0);
    const totalCommission = commissionPerContract * totalClosedContracts;
    const rr = calculateRiskReward(formData.direction, formData.entryPrice, formData.stopLoss, formData.takeProfit);

    try {
      if (formData.id) {
        // Update existing trade
        const oldTrade = trades.find(t => t.id === formData.id);

        if (oldTrade) {
          // Revert old balance
          const oldAccount = accounts.find(a => a.id === oldTrade.accountId);
          if (oldAccount) {
            const revertedBalance = oldAccount.currentBalance - oldTrade.pnl;
            
            if (oldTrade.accountId === formData.accountId) {
              // Same account
              const newBalance = revertedBalance + pnl;
              await db.accounts.update(oldTrade.accountId, {
                currentBalance: newBalance,
                maxBalance: Math.max(oldAccount.maxBalance || 0, newBalance)
              });
            } else {
              // Different account
              await db.accounts.update(oldTrade.accountId, { currentBalance: revertedBalance });
              
              const newAccount = accounts.find(a => a.id === formData.accountId);
              if (newAccount) {
                const newBalance = newAccount.currentBalance + pnl;
                await db.accounts.update(formData.accountId, {
                  currentBalance: newBalance,
                  maxBalance: Math.max(newAccount.maxBalance || 0, newBalance)
                });
              }
            }
          }
        }

        await db.trades.update(formData.id, {
          ...formData,
          pnl,
          commission: totalCommission,
          riskReward: rr,
          userId: user.id,
          date: formData.date.toISOString(),
        });
      } else {
        // Add new trade
        await db.trades.add({
          ...formData,
          pnl,
          commission: totalCommission,
          riskReward: rr,
          userId: user.id,
          date: formData.date.toISOString(),
        });

        // Update account balance
        const account = accounts.find(a => a.id === formData.accountId);
        if (account) {
          const newBalance = account.currentBalance + pnl;
          const newMaxBalance = Math.max(account.maxBalance || 0, newBalance);
          await db.accounts.update(formData.accountId, {
            currentBalance: newBalance,
            maxBalance: newMaxBalance,
          });
        }
      }

      setShowForm(false);
      setFormData({
        id: '',
        accountId: accounts[0]?.id || '',
        strategyId: strategies[0]?.id || '',
        asset: 'NQ',
        direction: 'Long',
        contractSize: 1,
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        exits: [],
        date: new Date(),
        beforeImage: '',
        afterImage: '',
        entryContext: '',
        marketRegime: '',
        fundamentalContext: '',
        exitLogicFollowed: true,
        psychologyStatus: 'Calm',
      });
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  };

  const handleEdit = (trade: Trade) => {
    setFormData({
      id: trade.id || '',
      accountId: trade.accountId,
      strategyId: trade.strategyId || '',
      asset: trade.asset,
      direction: trade.direction,
      contractSize: trade.contractSize,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      exits: trade.exits || [],
      date: new Date(trade.date),
      beforeImage: trade.beforeImage || '',
      afterImage: trade.afterImage || '',
      entryContext: trade.entryContext || '',
      marketRegime: trade.marketRegime || '',
      fundamentalContext: trade.fundamentalContext || '',
      exitLogicFollowed: trade.exitLogicFollowed ?? true,
      psychologyStatus: trade.psychologyStatus || 'Calm',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (trade: Trade) => {
    setTradeToDelete(trade);
  };

  const confirmDelete = async () => {
    if (!tradeToDelete) return;
    const trade = tradeToDelete;
    
    try {
      if (!trade.id) {
        throw new Error('Trade ID is missing. Cannot delete.');
      }
      
      const account = accounts.find(a => a.id === trade.accountId);
      if (account) {
        const newBalance = account.currentBalance - trade.pnl;
        await db.accounts.update(trade.accountId, {
          currentBalance: newBalance,
        });
      }

      await db.trades.delete(trade.id);
      setTradeToDelete(null);
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const filteredTrades = selectedAccountId 
    ? trades.filter(t => t.accountId === selectedAccountId)
    : trades;

  const currentPnL = calculatePnL(
    formData.asset,
    formData.direction,
    formData.contractSize,
    formData.entryPrice,
    formData.exits,
    accounts.find(a => a.id === formData.accountId)?.commissions?.[formData.asset] || 0
  );

  return (
    <div className={cn("space-y-8 transition-all", accounts.find(a => a.id === selectedAccountId)?.type === 'Failed' ? "grayscale opacity-75" : "")}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono">TRADE JOURNAL</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Record and analyze every execution.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={isClearingAll}
            className="flex-1 sm:flex-none px-3 py-2 bg-red-500/10 text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            {isClearingAll ? 'Clearing...' : 'Clear All'}
          </button>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value || null)}
            className="flex-1 sm:flex-none bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
          >
            <option value="">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!showForm) {
                setFormData(prev => ({
                  ...prev,
                  accountId: selectedAccountId || accounts[0]?.id || '',
                  strategyId: strategies[0]?.id || ''
                }));
              }
              setShowForm(!showForm);
            }}
            disabled={isNoAccountSelected || isFailed}
            className={cn(
              "w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all shrink-0",
              isNoAccountSelected || isFailed
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20"
            )}
            title={isNoAccountSelected ? "Select an account to log a trade" : isFailed ? "Cannot log trades for a failed account" : "New Trade"}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-4 sm:p-8 rounded-2xl space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">
              {formData.id ? 'Edit Trade Execution' : 'Log New Trade Execution'}
            </h2>
            {formData.id && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    id: '',
                    accountId: accounts[0]?.id || '',
                    strategyId: strategies[0]?.id || '',
                    asset: 'NQ',
                    direction: 'Long',
                    contractSize: 1,
                    entryPrice: 0,
                    stopLoss: 0,
                    takeProfit: 0,
                    exits: [] as TradeExit[],
                    date: new Date(),
                    beforeImage: '',
                    afterImage: '',
                    entryContext: '',
                    marketRegime: '',
                    fundamentalContext: '',
                    exitLogicFollowed: true,
                    psychologyStatus: 'Calm',
                  });
                  setShowForm(false);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Account</label>
              <select
                required
                value={formData.accountId}
                onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Asset</label>
              <select
                value={formData.asset}
                onChange={e => setFormData({ ...formData, asset: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              >
                <option value="NQ">NQ</option>
                <option value="MNQ">MNQ</option>
                <option value="ES">ES</option>
                <option value="MES">MES</option>
                <option value="GC">GC</option>
                <option value="MGC">MGC</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Date</label>
              <DatePicker
                selected={formData.date}
                onChange={(date: Date | null) => date && setFormData({ ...formData, date })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm"
                wrapperClassName="w-full"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Contract Size</label>
              <input
                required
                type="number"
                value={formData.contractSize}
                onChange={e => setFormData({ ...formData, contractSize: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Entry Price</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.entryPrice}
                onChange={e => setFormData({ ...formData, entryPrice: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Take Profit</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.takeProfit}
                onChange={e => setFormData({ ...formData, takeProfit: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Stop Loss</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.stopLoss}
                onChange={e => setFormData({ ...formData, stopLoss: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
            </div>
          </div>

          {/* Exits Section */}
          <div className="pt-6 border-t border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExitIcon size={16} className="text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500">Exits (Scaling Out)</h3>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  exits: [...formData.exits, { contracts: 0, price: 0, reason: 'TP', logic: 'Structural' }]
                })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500/20 transition-all"
              >
                <Plus size={14} />
                Add Exit
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {formData.exits.map((exit, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-zinc-950/30 p-4 rounded-2xl border border-zinc-800/50 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Closed Contract</label>
                    <input
                      type="number"
                      value={exit.contracts}
                      onChange={e => {
                        const newExits = [...formData.exits];
                        newExits[index].contracts = Number(e.target.value);
                        setFormData({ ...formData, exits: newExits });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Exit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exit.price}
                      onChange={e => {
                        const newExits = [...formData.exits];
                        newExits[index].price = Number(e.target.value);
                        setFormData({ ...formData, exits: newExits });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reason</label>
                    <select
                      value={exit.reason}
                      onChange={e => {
                        const newExits = [...formData.exits];
                        newExits[index].reason = e.target.value as any;
                        // Default logic to Structural when changing reason
                        if (!newExits[index].logic) newExits[index].logic = 'Structural';
                        setFormData({ ...formData, exits: newExits });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    >
                      <option value="TP">Take Profit</option>
                      <option value="SL">Stop Loss</option>
                      <option value="Partial Closed">Partial Closed</option>
                      <option value="Cut Loss">Cut Loss</option>
                      <option value="Breakeven">Breakeven</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Exit Logic</label>
                    <select
                      value={exit.logic || 'Structural'}
                      disabled={!['Partial Closed', 'Cut Loss', 'Breakeven'].includes(exit.reason)}
                      onChange={e => {
                        const newExits = [...formData.exits];
                        newExits[index].logic = e.target.value as any;
                        setFormData({ ...formData, exits: newExits });
                      }}
                      className={cn(
                        "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700",
                        !['Partial Closed', 'Cut Loss', 'Breakeven'].includes(exit.reason) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <option value="Structural">Structural</option>
                      <option value="Mental">Mental (Fear/Greed)</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newExits = formData.exits.filter((_, i) => i !== index);
                        setFormData({ ...formData, exits: newExits });
                      }}
                      className="flex-1 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {formData.exits.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No exits added yet. Add at least one to complete the trade.</p>
                </div>
              )}
            </div>
          </div>

          {/* Strategy Checkpoints Section */}
          <div className="pt-6 border-t border-zinc-800 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500">Strategy Checkpoints</h3>
            
            <div className="bg-zinc-950/30 border border-zinc-800/50 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-purple-500" />
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Select Active Strategy</label>
                </div>
                <span className="text-[10px] text-zinc-600 font-bold uppercase">Required for tracking</span>
              </div>
              <select
                value={formData.strategyId}
                onChange={e => setFormData(prev => ({ ...prev, strategyId: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm text-zinc-200"
              >
                <option value="">Select a Strategy...</option>
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {strategies.length === 0 && (
                <p className="text-[10px] text-red-400 font-medium italic">
                  No strategies found. Go to the Strategy tab to create one.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Entry Context</label>
                  {selectedStrategy?.entry.context && (
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, entryContext: selectedStrategy.entry.context })}
                      className="text-[9px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-tighter"
                    >
                      Auto-fill
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.entryContext}
                  onChange={e => setFormData({ ...formData, entryContext: e.target.value })}
                  placeholder="e.g. HTF Supply Zone"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Market Regime</label>
                  {selectedStrategy?.entry.marketRegime && (
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, marketRegime: selectedStrategy.entry.marketRegime })}
                      className="text-[9px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-tighter"
                    >
                      Auto-fill
                    </button>
                  )}
                </div>
                <select
                  value={formData.marketRegime}
                  onChange={e => setFormData({ ...formData, marketRegime: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                >
                  <option value="">Select Regime</option>
                  <option value="HRLR">HRLR</option>
                  <option value="LRLR">LRLR</option>
                  <option value="Trending">Trending</option>
                  <option value="Volatile">Volatile</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Psychology Status</label>
                <select
                  value={formData.psychologyStatus}
                  onChange={e => setFormData({ ...formData, psychologyStatus: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                >
                  <option value="Calm">Calm</option>
                  <option value="Flow">Flow</option>
                  <option value="Fear">Fear</option>
                  <option value="Greed">Greed</option>
                  <option value="Exhausted">Exhausted</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Fundamental Context</label>
                <input
                  type="text"
                  value={formData.fundamentalContext}
                  onChange={e => setFormData({ ...formData, fundamentalContext: e.target.value })}
                  placeholder="e.g. Post-CPI Volatility"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.exitLogicFollowed}
                      onChange={e => setFormData({ ...formData, exitLogicFollowed: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-zinc-800 rounded-full peer peer-checked:bg-blue-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest group-hover:text-zinc-200 transition-colors">Exit Logic Followed</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest block">Entry Screenshot (Before)</label>
              <div 
                className={cn(
                  "relative group cursor-pointer border-2 border-dashed border-zinc-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 outline-none focus:border-blue-500/50",
                  formData.beforeImage ? "border-solid border-blue-500/30" : ""
                )}
                onDragOver={e => e.preventDefault()}
                onDrop={e => onDrop(e, 'beforeImage')}
                onPaste={e => onPaste(e, 'beforeImage')}
                onMouseEnter={e => e.currentTarget.focus()}
                tabIndex={0}
              >
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <ImageIcon size={32} className={cn("transition-colors", formData.beforeImage ? "text-blue-500" : "text-zinc-600")} />
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                    {formData.beforeImage ? "Image Uploaded" : "Drag & Drop or Paste Image"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => onFileChange(e, 'beforeImage')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {formData.beforeImage && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 mt-2">
                    <img src={formData.beforeImage} alt="Before" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, beforeImage: '' }));
                      }}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest block">Exit Screenshot (After)</label>
              <div 
                className={cn(
                  "relative group cursor-pointer border-2 border-dashed border-zinc-800 rounded-2xl p-4 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 outline-none focus:border-blue-500/50",
                  formData.afterImage ? "border-solid border-blue-500/30" : ""
                )}
                onDragOver={e => e.preventDefault()}
                onDrop={e => onDrop(e, 'afterImage')}
                onPaste={e => onPaste(e, 'afterImage')}
                onMouseEnter={e => e.currentTarget.focus()}
                tabIndex={0}
              >
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <ImageIcon size={32} className={cn("transition-colors", formData.afterImage ? "text-blue-500" : "text-zinc-600")} />
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                    {formData.afterImage ? "Image Uploaded" : "Drag & Drop or Paste Image"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => onFileChange(e, 'afterImage')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {formData.afterImage && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 mt-2">
                    <img src={formData.afterImage} alt="After" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, afterImage: '' }));
                      }}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Drawdown (MAE)</label>
                <input
                  type="number"
                  step="0.01"
                  // value={formData.mae}
                  // onChange={e => setFormData({ ...formData, mae: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Runup (MFE)</label>
                <input
                  type="number"
                  step="0.01"
                  // value={formData.mfe}
                  // onChange={e => setFormData({ ...formData, mfe: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-6">
            {(formData.entryPrice > 0 && formData.exits.length > 0) && (
              <div className="flex flex-col items-end gap-1 mr-auto">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Projected PnL</span>
                <span className={cn(
                  "text-xl font-bold font-mono tracking-tight",
                  currentPnL >= 0 ? "text-blue-400" : "text-red-400"
                )}>
                  {formatCurrency(currentPnL)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowStrategyRef(!showStrategyRef)}
              className={cn(
                "w-full sm:w-auto px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                showStrategyRef ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Brain size={14} />
              {showStrategyRef ? "Hide Rules" : "Show Strategy Rules"}
            </button>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    id: '',
                    accountId: accounts[0]?.id || '',
                    strategyId: strategies[0]?.id || '',
                    asset: 'NQ',
                    direction: 'Long',
                    contractSize: 1,
                    entryPrice: 0,
                    stopLoss: 0,
                    takeProfit: 0,
                    exits: [] as TradeExit[],
                    date: new Date(),
                    beforeImage: '',
                    afterImage: '',
                    entryContext: '',
                    marketRegime: '',
                    fundamentalContext: '',
                    exitLogicFollowed: true,
                    psychologyStatus: 'Calm',
                  });
                }}
                className="flex-1 sm:flex-none w-14 h-14 flex items-center justify-center bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 hover:text-zinc-200 transition-all"
                title="Cancel"
              >
                <X size={24} />
              </button>
              <button
                type="submit"
                disabled={isNoAccountSelected || isFailed}
                className={cn(
                  "flex-1 sm:flex-none w-14 h-14 flex items-center justify-center rounded-xl font-bold transition-all",
                  isNoAccountSelected || isFailed
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20"
                )}
                title={formData.id ? 'Update Trade' : 'Log Trade'}
              >
                <Check size={24} />
              </button>
            </div>
          </div>

          {/* Strategy Reference Panel */}
          {showStrategyRef && selectedStrategy && (
            <div className="mt-8 pt-8 border-t border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Strategy:</span>
                <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{selectedStrategy.name}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950/50 border border-zinc-800/50 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Target size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Entry Rules</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Context:</p>
                    <p className="text-xs text-zinc-300 leading-relaxed italic">"{selectedStrategy.entry.context || 'Not defined'}"</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Regime:</p>
                    <p className="text-xs text-zinc-300 italic">"{selectedStrategy.entry.marketRegime || 'Not defined'}"</p>
                  </div>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/50 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-500">
                    <ExitIcon size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Exit Rules</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Partial Logic:</p>
                    <p className="text-xs text-zinc-300 italic">"{selectedStrategy.exit.partialCloseLogic || 'Not defined'}"</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">SL/BE Logic:</p>
                    <p className="text-xs text-zinc-300 italic">"{selectedStrategy.exit.moveSLBEStructure || 'Not defined'}"</p>
                  </div>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/50 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-500">
                    <Brain size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mental Triggers</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Fear:</span>
                      <Shield size={10} className="text-blue-500" />
                    </div>
                    <p className="text-xs text-zinc-300 italic">"{selectedStrategy.psychology.fearFactors || 'Not defined'}"</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Greed:</span>
                      <Activity size={10} className="text-red-500" />
                    </div>
                    <p className="text-xs text-zinc-300 italic">"{selectedStrategy.psychology.greedFactors || 'Not defined'}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Symbol</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Quantity</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Entry Price</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Exit Price</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">PL</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Drawdown</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Runup</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Commission</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Strategy</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reason</th>
                <th className="px-6 py-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredTrades
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((trade, idx) => (
                  <React.Fragment key={trade.id || `trade-${idx}`}>
                    {trade.exits.length > 0 ? (
                      trade.exits.map((exit, exitIdx) => (
                        <tr 
                          key={`${trade.id}-exit-${exitIdx}`} 
                          className={cn(
                            "hover:bg-zinc-800/30 transition-colors group",
                            exitIdx !== 0 && "border-t border-zinc-800/30"
                          )}
                        >
                          <td className="px-6 py-4">
                            {exitIdx === 0 ? <span className="text-sm font-bold font-mono">{trade.asset}</span> : ''}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-400">
                            {exitIdx === 0 ? new Date(trade.date).toLocaleDateString() : ''}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-sm font-bold font-mono",
                              trade.direction === 'Long' ? "text-blue-400" : "text-red-400"
                            )}>
                              {trade.direction === 'Long' ? '+' : '-'}{exit.contracts}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono">
                            {exitIdx === 0 ? trade.entryPrice : ''}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono">
                            {exit.price}
                          </td>
                          <td className={cn(
                            "px-6 py-4 text-sm font-bold font-mono",
                            calculateExitPnL(trade.asset, trade.direction, trade.entryPrice, exit.price, exit.contracts) >= 0 ? "text-blue-400" : "text-red-400"
                          )}>
                            {formatCurrency(calculateExitPnL(trade.asset, trade.direction, trade.entryPrice, exit.price, exit.contracts))}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400/70 font-mono text-center">
                            -
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-400/70 font-mono text-center">
                            -
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400/70 font-mono">
                            {exitIdx === 0 ? `-${formatCurrency(trade.commission || 0)}` : ''}
                          </td>
                          <td className="px-6 py-4">
                            {exitIdx === 0 ? (
                              <div className="flex flex-col gap-1">
                                {trade.strategyId && (
                                  <span className="text-[9px] text-purple-400 font-black uppercase tracking-tighter">
                                    {strategies.find(s => s.id === trade.strategyId)?.name || 'Unknown Strategy'}
                                  </span>
                                )}
                                {trade.psychologyStatus && (
                                  <span className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter w-fit",
                                    trade.psychologyStatus === 'Flow' || trade.psychologyStatus === 'Calm' ? "bg-blue-500/10 text-blue-400" :
                                    trade.psychologyStatus === 'Fear' || trade.psychologyStatus === 'Greed' ? "bg-red-500/10 text-red-400" :
                                    "bg-zinc-800 text-zinc-400"
                                  )}>
                                    {trade.psychologyStatus}
                                  </span>
                                )}
                                {trade.exitLogicFollowed !== undefined && (
                                  <span className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter w-fit",
                                    trade.exitLogicFollowed ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                                  )}>
                                    {trade.exitLogicFollowed ? 'Exit Followed' : 'Exit Deviated'}
                                  </span>
                                )}
                              </div>
                            ) : ''}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-md font-bold uppercase tracking-widest text-zinc-400 w-fit">
                                {exit.reason}
                              </span>
                              {exit.logic && (
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded w-fit",
                                  exit.logic === 'Structural' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-400"
                                )}>
                                  {exit.logic}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {exitIdx === 0 ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setViewingTrade(trade)}
                                  className="p-2 text-zinc-500 hover:text-zinc-200 transition-all"
                                  title="View Details"
                                >
                                  <ImageIcon size={16} />
                                </button>
                                {(() => {
                                  const tradeAccount = accounts.find(a => a.id === trade.accountId);
                                  const isTradeAccountFailed = tradeAccount?.type === 'Failed';
                                  return (
                                    <>
                                      <button 
                                        onClick={() => handleEdit(trade)}
                                        disabled={isTradeAccountFailed}
                                        className={cn(
                                          "p-2 transition-all",
                                          isTradeAccountFailed 
                                            ? "text-zinc-800 cursor-not-allowed" 
                                            : "text-zinc-500 hover:text-blue-400"
                                        )}
                                        title={isTradeAccountFailed ? "Cannot edit trades for a failed account" : "Edit Trade"}
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(trade)}
                                        disabled={isTradeAccountFailed}
                                        className={cn(
                                          "p-2 transition-all",
                                          isTradeAccountFailed 
                                            ? "text-zinc-800 cursor-not-allowed" 
                                            : "text-zinc-500 hover:text-red-400"
                                        )}
                                        title={isTradeAccountFailed ? "Cannot delete trades for a failed account" : "Delete Trade"}
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : ''}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-400">
                          {new Date(trade.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold font-mono">{trade.asset}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-bold",
                            trade.direction === 'Long' ? "text-blue-400" : "text-red-400"
                          )}>
                            {trade.direction === 'Long' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {trade.direction}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">{trade.entryPrice}</td>
                        <td className="px-6 py-4 text-sm font-mono text-zinc-600 italic">No exits recorded</td>
                        <td className={cn(
                          "px-6 py-4 text-sm font-bold font-mono",
                          trade.pnl >= 0 ? "text-blue-400" : "text-red-400"
                        )}>
                          {formatCurrency(trade.pnl)}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-400/70 font-mono">
                          -{formatCurrency(trade.commission || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{trade.riskReward}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {trade.strategyId && (
                              <span className="text-[9px] text-purple-400 font-black uppercase tracking-tighter">
                                {strategies.find(s => s.id === trade.strategyId)?.name || 'Unknown Strategy'}
                              </span>
                            )}
                            {trade.psychologyStatus && (
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter w-fit",
                                trade.psychologyStatus === 'Flow' || trade.psychologyStatus === 'Calm' ? "bg-blue-500/10 text-blue-400" :
                                trade.psychologyStatus === 'Fear' || trade.psychologyStatus === 'Greed' ? "bg-red-500/10 text-red-400" :
                                "bg-zinc-800 text-zinc-400"
                              )}>
                                {trade.psychologyStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-md font-bold uppercase tracking-widest text-zinc-400">
                            N/A
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setViewingTrade(trade)}
                              className="p-2 text-zinc-500 hover:text-zinc-200 transition-all"
                              title="View Details"
                            >
                              <ImageIcon size={16} />
                            </button>
                            <button 
                              onClick={() => handleEdit(trade)}
                              className="p-2 text-zinc-500 hover:text-blue-400 transition-all"
                              title="Edit Trade"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(trade)}
                              className="p-2 text-zinc-500 hover:text-red-400 transition-all"
                              title="Delete Trade"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Details Modal */}
      {viewingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-6xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold font-mono">TRADE DETAILS</h3>
                  {viewingTrade.strategyId && (
                    <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">
                      Strategy: {strategies.find(s => s.id === viewingTrade.strategyId)?.name || 'Unknown'}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  viewingTrade.pnl >= 0 ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                )}>
                  {formatCurrency(viewingTrade.pnl)}
                </span>
              </div>
              <button 
                onClick={() => setViewingTrade(null)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-10">
              {/* Strategy Checkpoints Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-6 rounded-2xl border-zinc-800/50 space-y-4">
                  <div className="flex items-center gap-3 text-blue-500">
                    <Target size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Entry Context</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-zinc-300 leading-relaxed">{viewingTrade.entryContext || 'No context recorded'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Regime:</span>
                      <span className="text-[10px] text-zinc-100 font-bold uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded">
                        {viewingTrade.marketRegime || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border-zinc-800/50 space-y-4">
                  <div className="flex items-center gap-3 text-blue-500">
                    <ExitIcon size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Exit Logic</h4>
                  </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Compliance:</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                          viewingTrade.exitLogicFollowed ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {viewingTrade.exitLogicFollowed ? 'Followed' : 'Deviated'}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800 pb-2">Exit Breakdown</p>
                        {viewingTrade.exits.map((exit, idx) => (
                          <div key={idx} className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded font-black text-zinc-400 uppercase tracking-tighter">Exit #{idx + 1}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">Price</span>
                                <span className="text-sm font-mono font-bold text-zinc-100">{exit.price}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">Contracts</span>
                                <span className="text-sm font-mono font-bold text-zinc-100">{exit.contracts}</span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold">Reason</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-300 italic">"{exit.reason}"</span>
                                {exit.logic && (
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                                    exit.logic === 'Structural' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-400"
                                  )}>
                                    {exit.logic}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
                              <span className="text-[9px] text-zinc-500 uppercase font-bold">Exit PnL</span>
                              <span className={cn(
                                "text-xs font-mono font-bold",
                                calculateExitPnL(viewingTrade.asset, viewingTrade.direction, viewingTrade.entryPrice, exit.price, exit.contracts) >= 0 ? "text-blue-400" : "text-red-400"
                              )}>
                                {formatCurrency(calculateExitPnL(viewingTrade.asset, viewingTrade.direction, viewingTrade.entryPrice, exit.price, exit.contracts))}
                              </span>
                            </div>
                          </div>
                        ))}
                        {viewingTrade.exits.length === 0 && (
                          <p className="text-xs text-zinc-500 italic">No exits recorded for this trade.</p>
                        )}
                      </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border-zinc-800/50 space-y-4">
                  <div className="flex items-center gap-3 text-blue-500">
                    <Activity size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Performance</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Drawdown (MAE):</span>
                      {/* <span className="text-sm font-mono font-bold text-red-400">-{formatCurrency(viewingTrade.mae || 0)}</span> */}
                      <span className="text-sm font-mono font-bold text-red-400">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Runup (MFE):</span>
                      {/* <span className="text-sm font-mono font-bold text-blue-400">{formatCurrency(viewingTrade.mfe || 0)}</span> */}
                      <span className="text-sm font-mono font-bold text-blue-400">-</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Risk:Reward:</span>
                      <span className="text-sm font-mono font-bold text-zinc-100">{viewingTrade.riskReward?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border-zinc-800/50 space-y-4">
                  <div className="flex items-center gap-3 text-purple-500">
                    <Brain size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Psychology</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Status:</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                        viewingTrade.psychologyStatus === 'Flow' || viewingTrade.psychologyStatus === 'Calm' ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {viewingTrade.psychologyStatus || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">Psychology status recorded for this trade.</p>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Before (Entry)</h4>
                  {viewingTrade.beforeImage ? (
                    <img src={viewingTrade.beforeImage} alt="Before" className="w-full rounded-2xl border border-zinc-800 shadow-2xl" />
                  ) : (
                    <div className="w-full aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-600 italic">
                      No entry screenshot recorded
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs text-zinc-500 uppercase font-bold tracking-widest">After (Exit)</h4>
                  {viewingTrade.afterImage ? (
                    <img src={viewingTrade.afterImage} alt="After" className="w-full rounded-2xl border border-zinc-800 shadow-2xl" />
                  ) : (
                    <div className="w-full aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-600 italic">
                      No exit screenshot recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {tradeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete this trade? This will also revert the account balance.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTradeToDelete(null)}
                className="flex-1 py-3 px-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Clear All Trades</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete ALL trades? This action cannot be undone and will not revert account balances.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 px-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={clearAllTrades}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={cn(
          "fixed bottom-8 right-8 z-[110] px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3",
          notification.type === 'success' ? "bg-blue-500 text-white" : "bg-red-500 text-white"
        )}>
          {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  );
};
