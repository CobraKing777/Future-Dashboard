import React, { useState, useEffect } from 'react';
import { db } from '../supabase';
import { Account } from '../types';
import { formatCurrency } from '../utils';
import { Plus, Trash2, Edit2, ShieldCheck, Sword, Skull, Check, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

import { InfoTooltip } from './InfoTooltip';

export const AccountCenter: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: 50,
    type: 'Challenge' as 'Challenge' | 'Funded' | 'Failed',
    propFirm: '',
    profitTarget: 3000,
    maxDrawdown: 2500,
    consistencyRule: 0.4,
    commissions: {
      'MNQ': 1.60,
      'NQ': 4.00,
      'ES': 4.00,
      'MES': 1.60,
      'GC': 4.00,
      'MGC': 1.60,
    } as { [key: string]: number },
  });

  useEffect(() => {
    if (!user) return;
    
    // Initial load
    db.accounts.list(user.id).then(setAccounts).catch(err => {
      console.error("Error loading accounts:", err);
      setError("Failed to load accounts.");
    });

    // Subscribe to changes
    const unsubscribe = db.accounts.subscribe(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setAccounts(prev => [...prev, payload.new as Account]);
      } else if (payload.eventType === 'UPDATE') {
        setAccounts(prev => prev.map(a => a.id === payload.new.id ? payload.new as Account : a));
      } else if (payload.eventType === 'DELETE') {
        setAccounts(prev => prev.filter(a => a.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleCommissionChange = (asset: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      commissions: {
        ...prev.commissions,
        [asset]: value
      }
    }));
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id!);
    setFormData({
      name: acc.name,
      size: acc.size,
      type: acc.type,
      propFirm: acc.propFirm,
      profitTarget: acc.profitTarget,
      maxDrawdown: acc.maxDrawdown,
      consistencyRule: acc.consistencyRule,
      commissions: acc.commissions || {
        'MNQ': 1.60,
        'NQ': 4.00,
        'ES': 4.00,
        'MES': 1.60,
        'GC': 4.00,
        'MGC': 1.60,
      },
    });
    setShowForm(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        ...formData,
        userId: user.id,
        initialBalance: formData.size * 1000,
        currentBalance: editingId ? accounts.find(a => a.id === editingId)?.currentBalance : formData.size * 1000,
        maxBalance: editingId ? accounts.find(a => a.id === editingId)?.maxBalance : formData.size * 1000,
      };

      if (editingId) {
        await db.accounts.update(editingId, data);
      } else {
        await db.accounts.add(data);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        size: 50,
        type: 'Challenge',
        propFirm: '',
        profitTarget: 3000,
        maxDrawdown: 2500,
        consistencyRule: 0.4,
        commissions: {
          'MNQ': 1.60,
          'NQ': 4.00,
          'ES': 4.00,
          'MES': 1.60,
          'GC': 4.00,
          'MGC': 1.60,
        },
      });
    } catch (error: any) {
      console.error(`Error ${editingId ? 'updating' : 'adding'} account:`, error);
      setError(error.message || `An error occurred while ${editingId ? 'updating' : 'creating'} the account.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setAccountToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await db.accounts.delete(accountToDelete);
      setAccountToDelete(null);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setError(error.message || "Failed to delete account.");
    }
  };

  const counts = {
    total: accounts.length,
    funded: accounts.filter(a => a.type === 'Funded').length,
    challenge: accounts.filter(a => a.type === 'Challenge').length,
    failed: accounts.filter(a => a.type === 'Failed').length,
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">ACCOUNTS</h1>
          <p className="text-slate-400 mt-1">Manage your Prop Firm and personal trading accounts.</p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <Plus className="rotate-45" size={20} />
            </button>
          </div>
        )}
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white w-12 h-12 rounded-xl font-bold flex items-center justify-center hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          title="Add New Account"
        >
          <Plus size={24} />
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-4 sm:p-8 rounded-3xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Account Name
                <InfoTooltip content="A unique identifier for this trading account." />
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-slate-700"
                placeholder="e.g. Apex 50k #1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Prop Firm
                <InfoTooltip content="The institution where your account is held." />
              </label>
              <input
                required
                type="text"
                value={formData.propFirm}
                onChange={e => setFormData({ ...formData, propFirm: e.target.value })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white placeholder:text-slate-700"
                placeholder="e.g. Apex, Topstep"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Account Size (k)
                <InfoTooltip content="The total funding amount provided by the prop firm." />
              </label>
              <input
                required
                type="number"
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: Number(e.target.value) })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Account Type
                <InfoTooltip content="The current stage of your account." />
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white appearance-none"
              >
                <option value="Challenge">Challenge</option>
                <option value="Funded">Funded</option>
                <option value="Failed">Failed/Breached</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Profit Target ($)
                <InfoTooltip content="The percentage gain required to pass the challenge." />
              </label>
              <input
                required
                type="number"
                value={formData.profitTarget}
                onChange={e => setFormData({ ...formData, profitTarget: Number(e.target.value) })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Max Drawdown ($)
                <InfoTooltip content="The maximum allowed loss before account failure." />
              </label>
              <input
                required
                type="number"
                value={formData.maxDrawdown}
                onChange={e => setFormData({ ...formData, maxDrawdown: Number(e.target.value) })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-widest ml-1">
                Consistency Rule (%)
                <InfoTooltip content="Specific rules regarding trade size or profit distribution." />
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.consistencyRule}
                onChange={e => setFormData({ ...formData, consistencyRule: Number(e.target.value) })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 ml-1">Commissions (per contract round-trip)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(formData.commissions).map(([asset, value]) => (
                <div key={asset} className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 uppercase font-bold tracking-widest ml-1">{asset}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={e => handleCommissionChange(asset, Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="w-14 h-14 bg-zinc-800 text-slate-400 rounded-2xl font-bold hover:text-white transition-all order-2 sm:order-1 flex items-center justify-center shadow-lg"
              title="Cancel"
            >
              <X size={24} />
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "bg-blue-500 text-white w-14 h-14 rounded-2xl font-bold hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/20 order-1 sm:order-2 flex items-center justify-center",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              title={editingId ? 'Update Account' : 'Create Account'}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={24} />
              )}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {accounts.map(acc => (
          <div key={acc.id} className={cn(
            "glass-card p-8 rounded-3xl space-y-8 relative group transition-all duration-500 hover-glow hover:scale-[1.02] hover:border-blue-500/40 hover:z-30",
            acc.type === 'Failed' ? "grayscale opacity-60" : ""
          )}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-2",
                      acc.type === 'Funded' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                      acc.type === 'Challenge' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {acc.type === 'Funded' && <ShieldCheck size={12} />}
                      {acc.type === 'Challenge' && <Sword size={12} />}
                      {acc.type === 'Failed' && <Skull size={12} />}
                      {acc.type === 'Failed' ? 'Breached' : acc.type}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold font-display text-white group-hover:text-blue-400 transition-colors break-all leading-tight" title={acc.name}>
                    {acc.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{acc.propFirm}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">{acc.size}k</span>
                  </div>
                </div>
                <div className="flex items-center bg-slate-950/50 rounded-xl p-1 border border-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 shrink-0">
                  <button
                    onClick={() => handleEdit(acc)}
                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                    title="Edit Account"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id!)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.15em]">Current Balance</p>
                <p className="text-2xl font-bold font-mono text-white tracking-tight group-hover:text-blue-400 transition-colors">{formatCurrency(acc.currentBalance)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.15em]">Profit Target</p>
                <p className="text-2xl font-bold font-mono text-white tracking-tight">{formatCurrency(acc.profitTarget)}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                  acc.type === 'Funded' ? "bg-amber-500/10" : 
                  acc.type === 'Challenge' ? "bg-cyan-500/10" : "bg-red-500/10"
                )}>
                  {acc.type === 'Funded' ? (
                    <ShieldCheck size={18} className="text-amber-400" />
                  ) : acc.type === 'Challenge' ? (
                    <Sword size={18} className="text-cyan-400" />
                  ) : (
                    <Skull size={18} className="text-red-500" />
                  )}
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {acc.type === 'Funded' ? 'Funded Rules' : 
                   acc.type === 'Challenge' ? 'Challenge Rules' :
                   'Breached'}
                </span>
              </div>
              
              <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    acc.type === 'Funded' ? "bg-blue-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(100, (acc.currentBalance / (acc.size * 1000 + acc.profitTarget)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="pt-12 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total Portfolio</p>
          <p className="text-3xl font-bold font-display text-white">{counts.total}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-blue-500/70 uppercase font-black tracking-widest">Funded</p>
          <p className="text-3xl font-bold font-display text-blue-400">{counts.funded}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-blue-500/70 uppercase font-black tracking-widest">Challenge</p>
          <p className="text-3xl font-bold font-display text-blue-400">{counts.challenge}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Failed</p>
          <p className="text-3xl font-bold font-display text-slate-500">{counts.failed}</p>
        </div>
      </footer>
      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete this account? All associated trades will remain but the account link will be broken.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-3 px-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
