import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, db, setDoc, doc, serverTimestamp, addDoc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';
import { Strategy } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Target, LogOut as ExitIcon, Brain, Save, CheckCircle2, AlertCircle, Info, TrendingUp, Shield, Activity, Plus, Trash2, Edit2, ChevronLeft, X, Check } from 'lucide-react';

export const StrategyCenter: React.FC = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);

  const initialFormData: Strategy = {
    name: '',
    userId: user?.uid || '',
    entry: {
      context: '',
      marketRegime: '',
      fundamentalSituation: '',
    },
    exit: {
      partialCloseLogic: '',
      cutLossLogic: '',
      tpLogic: '',
      slLogic: '',
      moveSLBEStructure: '',
    },
    psychology: {
      calmFactors: '',
      exhaustFactors: '',
      fearFactors: '',
      greedFactors: '',
    },
    updatedAt: null,
  };

  const [formData, setFormData] = useState<Strategy>(initialFormData);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'strategies'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStrategies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Strategy));
      setStrategies(fetchedStrategies);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !formData.name?.trim()) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      if (formData.id) {
        // Update existing
        await setDoc(doc(db, 'strategies', formData.id), {
          ...formData,
          userId: user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // Create new
        await addDoc(collection(db, 'strategies'), {
          ...formData,
          userId: user.uid,
          updatedAt: serverTimestamp(),
        });
      }
      
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
        setFormData(initialFormData);
      }, 1500);
    } catch (error) {
      console.error('Error saving strategy:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStrategyToDelete(id);
  };

  const confirmDelete = async () => {
    if (!strategyToDelete) return;
    try {
      await deleteDoc(doc(db, 'strategies', strategyToDelete));
      setStrategyToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `strategies/${strategyToDelete}`);
    }
  };

  const startEditing = (strat: Strategy) => {
    setFormData({
      ...strat,
      name: strat.name || '',
    });
    setIsEditing(true);
  };

  const SectionHeader = ({ icon: Icon, title, description, color }: any) => (
    <div className="flex items-start gap-4 mb-8">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white font-display tracking-tight">{title}</h2>
        <p className="text-slate-500 text-sm font-medium">{description}</p>
      </div>
    </div>
  );

  if (!isEditing) {
    return (
      <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-display uppercase">Strategies</h1>
            <p className="text-slate-400 font-medium">Manage your trading edges and execution plans.</p>
          </div>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setIsEditing(true);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-2xl font-bold transition-all shadow-xl active:scale-95 bg-white text-slate-950 hover:bg-slate-200"
            title="New Strategy"
          >
            <Plus size={24} />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strat) => (
            <div 
              key={strat.id}
              onClick={() => startEditing(strat)}
              className="glass-card p-6 rounded-3xl border border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{strat.name}</h3>
                <button 
                  onClick={(e) => handleDelete(strat.id!, e)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Target size={14} className="text-blue-500" />
                  <span className="truncate">{strat.entry.context || 'No entry context'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ExitIcon size={14} className="text-blue-500" />
                  <span className="truncate">{strat.exit.tpLogic || 'No exit logic'}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">
                  Updated {strat.updatedAt?.toDate().toLocaleDateString()}
                </span>
                <Edit2 size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))}
          {strategies.length === 0 && (
            <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed border-2 border-slate-800">
              <p className="text-slate-500 font-medium">No strategies defined yet. Create your first edge.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsEditing(false)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Cancel"
          >
            <X size={24} />
          </button>
          <div className="space-y-1">
            <input 
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Strategy Name (e.g. Trend Following)"
              className="text-3xl md:text-4xl font-black tracking-tight text-white font-display uppercase bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-800"
            />
            <p className="text-slate-400 font-medium">Define your edge, manage your exits, and master your mind.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !formData.name?.trim()}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all shadow-xl active:scale-95",
            saveStatus === 'success' ? 'bg-blue-500 text-white' : 
            saveStatus === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title={isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved' : saveStatus === 'error' ? 'Retry' : 'Save Strategy'}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle2 size={24} />
          ) : saveStatus === 'error' ? (
            <AlertCircle size={24} />
          ) : (
            <Check size={24} />
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Confirmation */}
        <div className="glass-card p-8 rounded-3xl space-y-8 hover:border-blue-500/20 transition-all duration-500 group">
          <SectionHeader 
            icon={Target} 
            title="Entry Confirmation" 
            description="The context and triggers for your trades."
            color="bg-blue-500 shadow-blue-500/20"
          />
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Context / Setup</label>
              <textarea
                value={formData.entry.context}
                onChange={e => setFormData({ ...formData, entry: { ...formData.entry, context: e.target.value } })}
                placeholder="What is the higher timeframe narrative?"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm leading-relaxed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Market Regime</label>
              <select
                value={formData.entry.marketRegime}
                onChange={e => setFormData({ ...formData, entry: { ...formData.entry, marketRegime: e.target.value } })}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm"
              >
                <option value="">Select Regime</option>
                <option value="HRLR">HRLR</option>
                <option value="LRLR">LRLR</option>
                <option value="Trending">Trending</option>
                <option value="Volatile">Volatile</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Fundamental Situation</label>
              <textarea
                value={formData.entry.fundamentalSituation}
                onChange={e => setFormData({ ...formData, entry: { ...formData.entry, fundamentalSituation: e.target.value } })}
                placeholder="Economic overheat, geopolitical chaos, news events..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Exit Strategy */}
        <div className="glass-card p-8 rounded-3xl space-y-8 hover:border-blue-500/20 transition-all duration-500 group">
          <SectionHeader 
            icon={ExitIcon} 
            title="Exit Strategy" 
            description="How you protect capital and take profits."
            color="bg-blue-500 shadow-blue-500/20"
          />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Partial Close Logic</label>
                <input
                  type="text"
                  value={formData.exit.partialCloseLogic}
                  onChange={e => setFormData({ ...formData, exit: { ...formData.exit, partialCloseLogic: e.target.value } })}
                  placeholder="e.g. 50% at 1:1 RR"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Cut Loss / SL Logic</label>
                <input
                  type="text"
                  value={formData.exit.slLogic}
                  onChange={e => setFormData({ ...formData, exit: { ...formData.exit, slLogic: e.target.value } })}
                  placeholder="Structural SL or fixed points?"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Move SL / BE Structure</label>
              <textarea
                value={formData.exit.moveSLBEStructure}
                onChange={e => setFormData({ ...formData, exit: { ...formData.exit, moveSLBEStructure: e.target.value } })}
                placeholder="When is structure valid to move SL to BE or trail?"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm leading-relaxed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Take Profit Targets</label>
              <textarea
                value={formData.exit.tpLogic}
                onChange={e => setFormData({ ...formData, exit: { ...formData.exit, tpLogic: e.target.value } })}
                placeholder="Key levels, liquidity pools, or fixed RR?"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-white text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Psychology Situation */}
        <div className="glass-card p-8 rounded-3xl space-y-8 hover:border-purple-500/20 transition-all duration-500 group">
          <SectionHeader 
            icon={Brain} 
            title="Psychology Status" 
            description="Tracking your mental state during execution."
            color="bg-purple-500 shadow-purple-500/20"
          />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Calm / Flow State</label>
                  <TrendingUp size={14} className="text-blue-500" />
                </div>
                <input
                  type="text"
                  value={formData.psychology.calmFactors}
                  onChange={e => setFormData({ ...formData, psychology: { ...formData.psychology, calmFactors: e.target.value } })}
                  placeholder="What does a focused trade feel like?"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Fear / Anxiety</label>
                  <Shield size={14} className="text-blue-500" />
                </div>
                <input
                  type="text"
                  value={formData.psychology.fearFactors}
                  onChange={e => setFormData({ ...formData, psychology: { ...formData.psychology, fearFactors: e.target.value } })}
                  placeholder="Triggers for hesitation or early exits?"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Greed / FOMO</label>
                  <Activity size={14} className="text-red-500" />
                </div>
                <input
                  type="text"
                  value={formData.psychology.greedFactors}
                  onChange={e => setFormData({ ...formData, psychology: { ...formData.psychology, greedFactors: e.target.value } })}
                  placeholder="Triggers for over-leveraging or chasing?"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Exhaustion / Tilt</label>
                  <Info size={14} className="text-slate-500" />
                </div>
                <textarea
                  value={formData.psychology.exhaustFactors}
                  onChange={e => setFormData({ ...formData, psychology: { ...formData.psychology, exhaustFactors: e.target.value } })}
                  placeholder="Signs that you should stop trading for the day."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border-slate-800/50 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
          <Info size={18} className="text-slate-500" />
        </div>
        <p className="text-xs text-slate-500 font-medium italic">
          "Your strategy is a living document. Review and refine it after every 20 trades to ensure your edge remains sharp."
        </p>
      </div>
      {/* Delete Confirmation Modal */}
      {strategyToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to delete this strategy?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStrategyToDelete(null)}
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
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
