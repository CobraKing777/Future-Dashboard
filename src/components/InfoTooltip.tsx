import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  formula?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, formula }) => {
  return (
    <div className="group/tooltip relative inline-block ml-1.5 align-middle">
      <Info size={12} className="text-zinc-500 cursor-help hover:text-blue-400 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
        <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
          {content}
        </p>
        {formula && (
          <div className="mt-2 pt-2 border-t border-zinc-800">
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Formula</p>
            <code className="text-[10px] text-blue-400 font-mono break-all">{formula}</code>
          </div>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
      </div>
    </div>
  );
};
