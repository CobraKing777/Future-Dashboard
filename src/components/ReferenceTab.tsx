import React, { useState } from 'react';
import { Calculator, Shield, Target, Info, ArrowRight, TrendingUp, Activity, ChevronRight } from 'lucide-react';

export const ReferenceTab: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('MNQ');
  const [riskAmount, setRiskAmount] = useState(100);

  const contractSpecs = [
    { asset: 'NQ', name: 'Nasdaq 100', pointValue: 20, tickValue: 5, tickSize: 0.25 },
    { asset: 'MNQ', name: 'Micro Nasdaq 100', pointValue: 2, tickValue: 0.5, tickSize: 0.25 },
    { asset: 'ES', name: 'S&P 500', pointValue: 50, tickValue: 12.5, tickSize: 0.25 },
    { asset: 'MES', name: 'Micro S&P 500', pointValue: 5, tickValue: 1.25, tickSize: 0.25 },
    { asset: 'GC', name: 'Gold', pointValue: 100, tickValue: 10, tickSize: 0.1 },
    { asset: 'MGC', name: 'Micro Gold', pointValue: 10, tickValue: 1, tickSize: 0.1 },
  ];

  const currentSpec = contractSpecs.find(s => s.asset === selectedAsset) || contractSpecs[1];

  const slPoints = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  const calculateSize = (risk: number, sl: number, pointValue: number) => {
    const size = risk / (sl * pointValue);
    const floorSize = Math.floor(size);
    if (size === floorSize) return floorSize.toString();
    return `${floorSize} (${size.toFixed(1)})`;
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold font-mono">TRADER REFERENCE</h1>
        <p className="text-zinc-500">Essential knowledge for future traders.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contract Size Cheat Sheet */}
        <section className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <Calculator size={20} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider">{selectedAsset} Contract Size Cheat Sheet</h2>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Asset</label>
                <div className="relative group">
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-4 pr-10 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[120px]"
                  >
                    {contractSpecs.map(spec => (
                      <option key={spec.asset} value={spec.asset}>{spec.asset}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Risk Amount ($)</label>
                <div className="relative group">
                  <select
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-4 pr-10 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[120px]"
                  >
                    {[100, 200, 300, 400, 500, 1000].map(amount => (
                      <option key={amount} value={amount}>${amount}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[riskAmount, riskAmount * 0.75, riskAmount * 0.5, riskAmount * 0.25].map((amount, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="bg-blue-500 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white">Risk Amount</span>
                  <span className="text-sm font-bold text-yellow-400">${amount}</span>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SL Points</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Contracts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {slPoints.map((sl) => (
                        <tr key={sl} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-2 text-xs font-bold text-zinc-300">{sl}</td>
                          <td className="px-4 py-2 text-xs font-mono text-blue-400 text-right font-bold">
                            {calculateSize(amount, sl, currentSpec.pointValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contract Specifications */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Calculator size={20} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider">Contract Specifications</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Asset</th>
                  <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Point Value</th>
                  <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Tick Value</th>
                  <th className="pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Tick Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {contractSpecs.map((spec) => (
                  <tr key={spec.asset} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-white">{spec.asset}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">{spec.name}</div>
                    </td>
                    <td className="py-4 font-mono text-blue-400">${spec.pointValue}</td>
                    <td className="py-4 font-mono text-zinc-300">${spec.tickValue}</td>
                    <td className="py-4 font-mono text-zinc-500">{spec.tickSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Info size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Calculation Formula</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              <span className="text-white font-bold">PnL = (Exit Price - Entry Price) × Point Value × Contracts</span>
              <br />
              Example (MNQ): (18,000.50 - 18,000.00) × $2 × 1 = 0.50 × $2 = $1.00
            </p>
          </div>
        </section>

        {/* Order Usage Guide */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Target size={20} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider">Order Usage Guide</h2>
          </div>

          <div className="space-y-4">
            {/* Long Position */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-blue-500/10 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-blue-400">Long Position (Buy)</span>
                <TrendingUp size={14} className="text-blue-400" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-zinc-800 rounded text-zinc-400">
                    <ArrowRight size={12} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">Stop Loss (SL)</p>
                    <p className="text-xs text-zinc-500">Use <span className="text-red-400 font-mono">SELL STOP</span> order below entry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-zinc-800 rounded text-zinc-400">
                    <ArrowRight size={12} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">Take Profit (TP)</p>
                    <p className="text-xs text-zinc-500">Use <span className="text-blue-400 font-mono">SELL LIMIT</span> order above entry.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Short Position */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-red-500/10 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-red-400">Short Position (Sell)</span>
                <Activity size={14} className="text-red-400" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-zinc-800 rounded text-zinc-400">
                    <ArrowRight size={12} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">Stop Loss (SL)</p>
                    <p className="text-xs text-zinc-500">Use <span className="text-red-400 font-mono">BUY STOP</span> order above entry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-zinc-800 rounded text-zinc-400">
                    <ArrowRight size={12} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">Take Profit (TP)</p>
                    <p className="text-xs text-zinc-500">Use <span className="text-blue-400 font-mono">BUY LIMIT</span> order below entry.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tips & Tricks */}
        <section className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider">Risk Management Tips</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">The 1% Rule</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Never risk more than 1% of your total account balance on a single trade execution.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Scaling Out</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Close partial positions at key structural levels to secure profit while letting the rest run.</p>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Emotional Check</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">If you feel fear or greed, you are likely trading with a position size that is too large.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
