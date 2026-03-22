import { Account, Trade, TradeExit } from './types';

export const ASSET_TICK_VALUES: Record<string, number> = {
  'NQ': 20, // $20 per point, $5 per tick (0.25)
  'MNQ': 2, // $2 per point, $0.50 per tick (0.25)
  'ES': 50, // $50 per point, $12.50 per tick (0.25)
  'MES': 5, // $5 per point, $1.25 per tick (0.25)
  'GC': 100, // $100 per point, $10 per tick (0.1)
  'MGC': 10, // $10 per point, $1 per tick (0.1)
};

export const calculatePnL = (
  asset: string,
  direction: 'Long' | 'Short',
  contractSize: number,
  entryPrice: number,
  exits: TradeExit[],
  commissionPerContract: number = 0
): number => {
  const multiplier = ASSET_TICK_VALUES[asset] || 0;
  
  let totalPnL = 0;
  let totalClosedContracts = 0;

  for (const exit of exits) {
    const diff = direction === 'Long' ? (exit.price - entryPrice) : (entryPrice - exit.price);
    const exitPnL = diff * multiplier * exit.contracts;
    totalPnL += exitPnL;
    totalClosedContracts += exit.contracts;
  }

  const totalCommission = commissionPerContract * totalClosedContracts;

  return totalPnL - totalCommission;
};

export const calculateExitPnL = (
  asset: string,
  direction: 'Long' | 'Short',
  entryPrice: number,
  exitPrice: number,
  contracts: number
): number => {
  const multiplier = ASSET_TICK_VALUES[asset] || 0;
  const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
  return diff * multiplier * contracts;
};

export const calculateRiskReward = (
  direction: 'Long' | 'Short',
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number => {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  if (risk === 0) return 0;
  return Number((reward / risk).toFixed(2));
};

export const checkConsistencyRule = (trades: Trade[], account: Account): boolean => {
  if (trades.length === 0) return true;
  
  const dailyProfits: Record<string, number> = {};
  trades.forEach(t => {
    if (t.pnl > 0) {
      const date = new Date(t.date).toDateString();
      dailyProfits[date] = (dailyProfits[date] || 0) + t.pnl;
    }
  });

  if (Object.keys(dailyProfits).length === 0) return true;

  const maxDailyProfit = Math.max(...Object.values(dailyProfits));
  // Handle both decimal (0.4) and percentage (40) inputs
  let threshold = account.consistencyRule || 0.4;
  if (threshold > 1) threshold = threshold / 100;
  
  if (account.type === 'Challenge' || account.type === 'Failed') {
    // For Challenge-related accounts, consistency is based on the profit target
    return maxDailyProfit <= (account.profitTarget * threshold);
  } else {
    // For other accounts, consistency is based on total profit earned so far
    const totalProfit = trades.reduce((sum, t) => sum + (t.pnl > 0 ? t.pnl : 0), 0);
    if (totalProfit <= 0) return true;
    return (maxDailyProfit / totalProfit) <= threshold;
  }
};

export const calculateTrailingDrawdown = (account: Account): number => {
  // Trailing drawdown usually follows the peak balance
  // This is a simplified version: Max Balance - Max Drawdown
  const peak = account.maxBalance || account.initialBalance;
  return peak - (account.maxDrawdown || 0);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
