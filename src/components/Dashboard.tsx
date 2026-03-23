import React, { useEffect, useState } from 'react';
import { db } from '../supabase';
import { Account, Trade } from '../types';
import { formatCurrency, checkConsistencyRule, calculateTrailingDrawdown } from '../utils';
import { TrendingUp, TrendingDown, Target, Activity, CheckCircle2, XCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ShieldCheck, Sword, Skull, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

import { useAuth } from '../contexts/AuthContext';

import { InfoTooltip } from './InfoTooltip';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

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

    // Subscribe to accounts
    const unsubAccounts = db.accounts.subscribe(user.id, (payload) => {
      if (payload.eventType === 'INSERT') setAccounts(prev => [...prev, payload.new as Account]);
      if (payload.eventType === 'UPDATE') setAccounts(prev => prev.map(a => a.id === payload.new.id ? payload.new as Account : a));
      if (payload.eventType === 'DELETE') setAccounts(prev => prev.filter(a => a.id !== payload.old.id));
    });

    // Subscribe to trades
    const unsubTrades = db.trades.subscribe(user.id, (payload) => {
      if (payload.eventType === 'INSERT') setTrades(prev => [...prev, payload.new as Trade]);
      if (payload.eventType === 'UPDATE') setTrades(prev => prev.map(t => t.id === payload.new.id ? payload.new as Trade : t));
      if (payload.eventType === 'DELETE') setTrades(prev => prev.filter(t => t.id !== payload.old.id));
    });

    return () => {
      unsubAccounts();
      unsubTrades();
    };
  }, [user]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id!);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountTrades = trades.filter(t => t.accountId === selectedAccountId);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'Funded':
        return <ShieldCheck size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
      case 'Challenge':
        return <Sword size={18} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />;
      case 'Failed':
        return <Skull size={18} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />;
      default:
        return null;
    }
  };

  const totalPnL = accountTrades.reduce((sum, t) => sum + t.pnl, 0);
  
  const today = new Date().toDateString();
  const todayPnL = accountTrades
    .filter(t => new Date(t.date).toDateString() === today)
    .reduce((sum, t) => sum + t.pnl, 0);

  const winRate = accountTrades.length > 0 
    ? (accountTrades.filter(t => t.pnl > 0).length / accountTrades.length) * 100 
    : 0;
  const profitFactor = accountTrades.filter(t => t.pnl < 0).length > 0
    ? Math.abs(accountTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / 
      accountTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))
    : 0;

  const isConsistent = selectedAccount ? checkConsistencyRule(accountTrades, selectedAccount) : true;
  const trailingDrawdown = selectedAccount ? calculateTrailingDrawdown(selectedAccount) : 0;

  const chartData = accountTrades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any[], trade) => {
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : (selectedAccount?.initialBalance || 0);
      acc.push({
        date: new Date(trade.date).toLocaleDateString(),
        balance: lastBalance + trade.pnl,
      });
      return acc;
    }, []);

  // Calendar Logic
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const dailyPnL = accountTrades.reduce((acc: Record<string, number>, trade) => {
    const date = new Date(trade.date).toDateString();
    acc[date] = (acc[date] || 0) + trade.pnl;
    return acc;
  }, {});

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${year}-${month}-${i}`} className="aspect-square sm:h-24 bg-zinc-950/20 border border-zinc-800/30 rounded-lg sm:rounded-2xl" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toDateString();
      const pnl = dailyPnL[date];
      days.push(
        <div key={`day-${year}-${month}-${day}`} className={cn(
          "aspect-square sm:h-24 bg-slate-950/50 border border-slate-800 rounded-lg sm:rounded-2xl p-1 sm:p-3 flex flex-col justify-between relative group hover:border-slate-600 transition-all duration-300",
          pnl !== undefined && pnl >= 0 && "bg-bull/5 border-bull/20",
          pnl !== undefined && pnl < 0 && "bg-bear/20 border-bear/40"
        )}>
          <span className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest">{day}</span>
          {pnl !== undefined && (
            <div className={cn(
              "text-[7px] sm:text-[10px] font-black font-display text-center py-0.5 sm:py-1.5 rounded-md sm:rounded-xl shadow-sm leading-none sm:leading-normal",
              pnl >= 0 ? 'text-bull bg-bull/10' : 'text-white bg-bear border border-zinc-800'
            )}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl).replace('.00', '').replace('$', '')}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const metrics = [
    { 
      label: 'Initial Balance', 
      value: formatCurrency(selectedAccount?.initialBalance || 0), 
      icon: Wallet,
      tooltip: { content: 'The starting balance of the account when it was created.', formula: 'Size * 1000' }
    },
    { 
      label: 'Current Account Balance', 
      value: formatCurrency(selectedAccount?.currentBalance || 0), 
      icon: Wallet,
      tooltip: { content: 'Your current account equity including closed trades.', formula: 'Initial Balance + Sum(All Trades PnL)' }
    },
    { 
      label: 'Today PnL', 
      value: formatCurrency(todayPnL), 
      icon: todayPnL >= 0 ? TrendingUp : TrendingDown, 
      color: todayPnL >= 0 ? 'text-bull' : 'text-white bg-bear px-2 py-1 rounded-lg border border-zinc-800',
      tooltip: { content: 'Total profit or loss for today\'s trades.', formula: 'Sum(PnL of all trades executed today)' }
    },
    { 
      label: 'Total P/L', 
      value: formatCurrency(totalPnL), 
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown, 
      color: totalPnL >= 0 ? 'text-bull' : 'text-white bg-bear px-2 py-1 rounded-lg border border-zinc-800',
      tooltip: { content: 'The total profit or loss logged in this account.', formula: 'Sum(PnL of all trades logged in this account)' }
    },
    { 
      label: 'Win Rate', 
      value: `${winRate.toFixed(1)}%`, 
      icon: Target,
      tooltip: { content: 'Percentage of trades that were profitable.', formula: '(Winning Trades / Total Trades) * 100' }
    },
    { 
      label: 'Profit Factor', 
      value: profitFactor.toFixed(2), 
      icon: Activity,
      tooltip: { content: 'Ratio of gross profit to gross loss.', formula: 'Sum(Gross Profits) / Sum(Gross Losses)' }
    },
  ];

  return (
    <div className={cn("space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-700", selectedAccount?.type === 'Failed' ? "grayscale opacity-60" : "")}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-display">DASHBOARD</h1>
          <p className="text-slate-400 font-medium">Real-time overview of your trading performance.</p>
        </div>
        <div className="relative group flex items-center">
          <div className="absolute left-6 z-10 pointer-events-none">
            {selectedAccount && getStatusIcon(selectedAccount.type)}
          </div>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-slate-900/50 border border-slate-800 text-white rounded-2xl pl-14 pr-12 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer min-w-[280px] shadow-xl"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                {acc.name} ({acc.propFirm})
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-blue-400 transition-colors">
            <ChevronRight size={18} className="rotate-90" />
          </div>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="glass-card p-4 sm:p-8 rounded-3xl space-y-6 hover-glow transition-all duration-500 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] group-hover:text-blue-500/70 transition-colors">{m.label}</span>
                <InfoTooltip content={m.tooltip.content} formula={m.tooltip.formula} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-950/50 flex items-center justify-center border border-slate-800 group-hover:border-blue-500/30 transition-all duration-500 group-hover:scale-110">
                <m.icon size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
            <p className={`text-3xl md:text-4xl font-bold font-display tracking-tight ${m.color || 'text-white'}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Equity Curve */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-8 rounded-3xl space-y-8 hover:border-blue-500/20 transition-colors duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Equity Curve</h2>
            <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-bull animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance ($)</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tick={{ fontWeight: 800, letterSpacing: '0.05em' }}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${v/1000}k`} 
                  tick={{ fontWeight: 800, letterSpacing: '0.05em' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(30, 41, 59, 0.5)', 
                    borderRadius: '20px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 800, fontSize: '14px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '6px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  strokeWidth={4} 
                  animationDuration={2000}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rules & Status */}
        <div className="glass-card p-8 rounded-3xl space-y-8 hover:border-blue-500/20 transition-colors duration-500">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Prop Firm Status</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-2xl border border-slate-800 group hover:border-blue-500/30 transition-all duration-300">
              <div className="space-y-1">
                <div className="flex items-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Consistency Rule</p>
                  <InfoTooltip 
                    content={selectedAccount?.type === 'Challenge' || selectedAccount?.type === 'Failed' 
                      ? 'For challenges, your maximum daily profit must not exceed a certain percentage of your profit target.' 
                      : 'For funded accounts, your maximum daily profit must not exceed a certain percentage of your total profit.'}
                    formula={selectedAccount?.type === 'Challenge' || selectedAccount?.type === 'Failed'
                      ? 'Max Daily Profit <= Profit Target * Consistency %'
                      : 'Max Daily Profit / Total Profit <= Consistency %'}
                  />
                </div>
                <p className="text-base font-bold text-white font-display">{isConsistent ? 'Obeying' : 'Violated'}</p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                isConsistent ? "bg-bull/10 text-bull" : "bg-red-500/10 text-red-400"
              )}>
                {isConsistent ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <span>Profit Target</span>
                <span className="text-white font-mono">{formatCurrency(totalPnL)} / {formatCurrency(selectedAccount?.profitTarget || 0)}</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-bull transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                  style={{ width: `${Math.min(100, (totalPnL / (selectedAccount?.profitTarget || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                <span>Trailing Drawdown</span>
                <span className="text-white font-mono">{formatCurrency(selectedAccount?.currentBalance || 0)} / {formatCurrency(trailingDrawdown)}</span>
              </div>
              <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
                  style={{ width: `${Math.min(100, ((selectedAccount?.currentBalance || 0) - trailingDrawdown) / (selectedAccount?.maxDrawdown || 1) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily P/L Calendar */}
      <div className="glass-card p-8 rounded-3xl space-y-8 hover:border-blue-500/20 transition-colors duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-950/50 flex items-center justify-center border border-slate-800">
              <CalendarIcon size={18} className="text-slate-400" />
            </div>
            Daily P/L Calendar
          </h2>
          <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto sm:gap-6">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[10px] sm:text-xs font-black font-display uppercase tracking-widest text-white flex-1 text-center px-2 sm:min-w-[160px]">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[9px] sm:text-[10px] text-slate-600 font-black uppercase tracking-[0.25em] pb-2">
              {d}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </div>
    </div>
  );
};

const Wallet = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
