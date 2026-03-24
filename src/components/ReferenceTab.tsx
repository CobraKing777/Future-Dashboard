import React, { useState } from 'react';
import { Calculator, Shield, Target, Info, ArrowRight, TrendingUp, Activity, ChevronRight, Clock, Layers } from 'lucide-react';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Time Based Liquidity - BLUE ACCENT */}
        <section className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-blue-500/10 transition-colors duration-700" />
          
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Time Based Liquidity</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Algorithmic Delivery Windows</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-500/5 border border-blue-500/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Reference</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
            <div className="space-y-8">
              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">NY Time Zone</h3>
                    <p className="text-[10px] text-zinc-500">Standard vs Daylight Savings</p>
                  </div>
                  <div className="group/tooltip relative">
                    <Info size={16} className="text-zinc-600 cursor-help hover:text-blue-400 transition-colors" />
                    <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[11px] text-zinc-400 leading-relaxed hidden group-hover/tooltip:block z-50 shadow-2xl backdrop-blur-xl">
                      <p className="font-black text-zinc-200 mb-2 uppercase tracking-widest text-[9px]">Seasonal Adjustments</p>
                      Standard Time (ST) is usually from Nov to March (UTC-5). Daylight Saving Time (DST) is from March to Nov (UTC-4). Algorithms readjust their delivery based on these shifts.
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 group/time">
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover/time:text-blue-400 transition-colors">Standard (ST)</p>
                    <p className="text-lg font-mono font-black text-white">UTC-5</p>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 group/time">
                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover/time:text-blue-400 transition-colors">Daylight (DST)</p>
                    <p className="text-lg font-mono font-black text-white">UTC-4</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <TrendingUp size={14} className="text-blue-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Asia & London Sessions</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 bg-zinc-950/30 border border-zinc-800/50 rounded-2xl space-y-3 hover:border-blue-500/20 transition-colors">
                    <p className="text-xs font-black text-zinc-200 uppercase tracking-widest">Asia Reference</p>
                    <ul className="text-[11px] text-zinc-500 space-y-2 list-none">
                      <li className="flex items-center gap-2"><ChevronRight size={10} className="text-blue-500" /> Yesterday Settlement (4:14 PM)</li>
                      <li className="flex items-center gap-2"><ChevronRight size={10} className="text-blue-500" /> NDOG: 4:59 PM - 6:00 PM</li>
                      <li className="flex items-center gap-2"><ChevronRight size={10} className="text-blue-500" /> NWOG: Weekend Gap</li>
                      <li className="flex items-center gap-2"><ChevronRight size={10} className="text-blue-500" /> Yesterday AM 1st FVG</li>
                    </ul>
                  </div>
                  <div className="p-5 bg-zinc-950/30 border border-zinc-800/50 rounded-2xl space-y-3 hover:border-blue-500/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-zinc-200 uppercase tracking-widest">London Session</p>
                      <span className="text-[9px] font-mono text-zinc-600">2:00 AM - 5:00 AM</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] text-zinc-500">Reference liquidity for AM session delivery baseline.</p>
                      <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                        <p className="text-[10px] text-blue-400 font-bold">3:30 AM: Algorithmic baseline time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Activity size={14} className="text-blue-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NY AM & PM Sessions</h4>
                </div>
                <div className="space-y-4">
                  <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-zinc-200 uppercase tracking-widest">NY AM Session</p>
                      <span className="text-[10px] font-mono text-zinc-600">9:30 AM - 12:00 PM</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 group/item">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover/item:text-blue-400 transition-colors">7:00 AM</p>
                        <p className="text-[10px] text-zinc-300 font-medium">Pre-market</p>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 group/item">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 group-hover/item:text-blue-400 transition-colors">8:30 AM</p>
                        <p className="text-[10px] text-zinc-300 font-medium">Algo Readjust</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5" />
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          <span className="text-zinc-200 font-bold">Opening Range Gap:</span> Yesterday 4:14 PM vs Today 9:30 AM.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5" />
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          <span className="text-zinc-200 font-bold">1st FVG:</span> Formed between 9:30 AM - 10:00 AM.
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-zinc-800/50">
                      <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2">Macro Windows</p>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-500/5 border border-blue-500/10 rounded text-[10px] text-zinc-400 font-mono">9:50-10:10 AM</span>
                        <span className="px-2 py-1 bg-blue-500/5 border border-blue-500/10 rounded text-[10px] text-zinc-400 font-mono">10:50-11:10 AM</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl group/lunch">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <Info size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Lunch Time (No Trade)</p>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      <span className="text-red-400/80 font-mono">11:30 AM - 1:30 PM</span>. Algorithms typically consolidate or seek liquidity for PM session. Avoid execution.
                    </p>
                  </div>

                  <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-zinc-200 uppercase tracking-widest">NY PM Session</p>
                      <span className="text-[10px] font-mono text-zinc-600">1:30 PM - 4:00 PM</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Watch <span className="text-blue-400 font-black">1:30 PM - 2:00 PM</span> for the first presented FVG as the baseline for the afternoon delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contract Size Cheat Sheet & Opening Range */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contract Size Cheat Sheet */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Calculator size={20} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-wider">{selectedAsset} Cheat Sheet</h2>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1.5 flex-1 min-w-[120px]">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Asset</label>
                  <div className="relative group">
                    <select
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-4 pr-10 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                    >
                      {contractSpecs.map(spec => (
                        <option key={spec.asset} value={spec.asset}>{spec.asset}</option>
                      ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 min-w-[120px]">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Risk ($)</label>
                  <div className="relative group">
                    <select
                      value={riskAmount}
                      onChange={(e) => setRiskAmount(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-4 pr-10 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                    >
                      {[100, 200, 300, 400, 500, 1000].map(amount => (
                        <option key={amount} value={amount}>${amount}</option>
                      ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-blue-500 px-4 py-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Risk Amount</span>
                  <span className="text-sm font-bold text-yellow-400">${riskAmount}</span>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">SL Points</th>
                        <th className="px-4 py-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right">Contracts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {slPoints.map((sl) => (
                        <tr key={sl} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-2 text-xs font-bold text-zinc-300">{sl}</td>
                          <td className="px-4 py-2 text-xs font-mono text-blue-400 text-right font-bold">
                            {calculateSize(riskAmount, sl, currentSpec.pointValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Opening Range Card - ORANGE ACCENT */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-orange-500/10 transition-colors duration-700" />
            
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Opening Range (OR)</h2>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Initial 30 Min Balance</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 relative">
              <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400">Definition</h3>
                  <span className="px-2 py-1 bg-orange-500/5 border border-orange-500/10 rounded text-[10px] font-mono text-orange-300">9:30 AM - 10:00 AM</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The <span className="text-white font-black">Opening Range</span> is established during the first 30 minutes of the NY market session. It represents the initial institutional positioning.
                </p>
              </div>

              <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">How to Mark</h3>
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Identify the <span className="text-white font-black">Absolute High</span> and <span className="text-white font-black">Absolute Low</span> printed between 9:30 AM and 10:00 AM NY Time.
                  </p>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <p className="text-[10px] text-blue-400 font-medium italic">Requirement: You MUST include the wicks of the candles to define the true range.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <Info size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Crucial Distinction</p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  The <span className="text-zinc-200 font-bold">Opening Range</span> is the price action of the first 30 mins. This is <span className="italic text-red-400/80">completely different</span> from the <span className="text-zinc-200 font-bold">Opening Range Gap</span>.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Opening Range Gap Theory - PURPLE ACCENT */}
        <section className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-purple-500/10 transition-colors duration-700" />
          
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-lg shadow-purple-500/5">
                <Target size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Opening Range Gap Theory</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Overnight Imbalance Analysis</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="md:col-span-3 p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Info size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">What is Opening Range Gap?</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The gap between <span className="text-zinc-200 font-black">Yesterday's Settlement Close (4:14 PM RTH)</span> and <span className="text-zinc-200 font-black">Today's Opening (9:30 AM)</span>. This provides the initial bias for the day.
              </p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 shadow-xl hover:border-red-500/30 transition-colors group/card">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400">Scenario 1</h3>
                <span className="text-[10px] font-mono text-zinc-600">&lt; 75 Points</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If the gap is smaller than <span className="text-white font-bold">75 handles</span>, it is generally considered <span className="text-red-500/80 font-black italic">No Tradable</span>.
                </p>
                <p className="text-[10px] text-zinc-600">Lacks sufficient imbalance.</p>
              </div>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 shadow-xl hover:border-blue-500/30 transition-colors group/card">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Scenario 2</h3>
                <span className="text-[10px] font-mono text-zinc-600">75 - 170 Points</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The <span className="text-white font-bold">C.E (Consequent Encroachment)</span> level is likely to be filled within the <span className="text-blue-400 font-black">Opening Hour</span>.
                </p>
                <p className="text-[10px] text-zinc-600">9:30 AM - 10:00 AM target.</p>
              </div>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4 shadow-xl hover:border-purple-500/30 transition-colors group/card">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Scenario 3</h3>
                <span className="text-[10px] font-mono text-zinc-600">&gt; 170 Points</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Large gaps often lead to <span className="text-white font-bold">Trend Following</span>. Price targets the nearest <span className="text-purple-400 font-black">First Quadrant Level</span>.
                </p>
                <p className="text-[10px] text-zinc-600">High volatility expansion.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Fair Value Gaps (FVG) - EMERALD ACCENT */}
        <section className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700" />
          
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Fair Value Gaps (FVG)</h2>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Inefficiency & Imbalance Types</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-red-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400">SIBI</h3>
                <TrendingUp size={12} className="text-red-400 rotate-180" />
              </div>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Sell Side Imbalance</p>
              <p className="text-xs text-zinc-400 leading-relaxed">A bearish FVG where the market moves down rapidly, leaving a gap that only sell-side orders have filled.</p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">BISI</h3>
                <TrendingUp size={12} className="text-emerald-400" />
              </div>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Buy Side Imbalance</p>
              <p className="text-xs text-zinc-400 leading-relaxed">A bullish FVG where the market moves up rapidly, leaving a gap that only buy-side orders have filled.</p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-purple-500/20 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Inversion FVG</h3>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Support/Resistance Flip</p>
              <p className="text-xs text-zinc-400 leading-relaxed">When a bearish FVG is closed above and becomes a support level for future price action (or vice versa).</p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-blue-500/20 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400">iFVG (Inverse FVG)</h3>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Function Reversal</p>
              <p className="text-xs text-zinc-400 leading-relaxed">The inverse of the original function. Often used to describe an FVG that fails to hold and price trades through it.</p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-zinc-500/20 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Common FVG</h3>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Standard Formation</p>
              <p className="text-xs text-zinc-400 leading-relaxed">The standard 3-candle formation where the 1st candle's wick and 3rd candle's wick do not overlap.</p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-yellow-500/20 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Breakaway FVG</h3>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Strong Trend Signal</p>
              <p className="text-xs text-zinc-400 leading-relaxed">A gap that price does not return to fill immediately, signaling a very strong trend and high institutional interest.</p>
            </div>

            <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-3 shadow-xl hover:border-cyan-500/20 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Measuring FVG</h3>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Midpoint Projection</p>
              <p className="text-xs text-zinc-400 leading-relaxed">A gap that occurs near the midpoint of a price move, used to project potential targets for the expansion.</p>
            </div>
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
