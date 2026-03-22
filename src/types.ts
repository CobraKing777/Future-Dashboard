export interface Account {
  id?: string;
  name: string;
  size: number;
  type: 'Challenge' | 'Funded' | 'Failed';
  propFirm: string;
  profitTarget: number;
  maxDrawdown: number;
  consistencyRule: number;
  initialBalance: number;
  currentBalance: number;
  maxBalance: number;
  userId: string;
  createdAt: any;
  commissions?: { [key: string]: number };
}

export interface TradeExit {
  contracts: number;
  price: number;
  reason: 'TP' | 'SL' | 'Partial Closed' | 'Cut Loss' | 'Breakeven';
  logic?: 'Structural' | 'Mental';
}

export interface Trade {
  id?: string;
  accountId: string;
  asset: 'MNQ' | 'NQ' | 'ES' | 'MES' | 'MGC' | 'GC';
  direction: 'Long' | 'Short';
  contractSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exits: TradeExit[];
  pnl: number;
  commission: number;
  riskReward: number;
  date: any;
  
  // Strategy Checkpoints
  entryContext?: string;
  marketRegime?: string;
  fundamentalContext?: string;
  exitLogicFollowed?: boolean;
  psychologyStatus?: 'Calm' | 'Exhausted' | 'Fear' | 'Greed' | 'Flow';
  
  beforeImage?: string;
  afterImage?: string;
  strategyId?: string;
  mae?: number; // Maximum Adverse Excursion (Drawdown)
  mfe?: number; // Maximum Favorable Excursion (Runup)
  userId: string;
  createdAt: any;
}

export interface Strategy {
  id?: string;
  name: string;
  userId: string;
  entry: {
    context: string;
    marketRegime: string;
    fundamentalSituation: string;
  };
  exit: {
    partialCloseLogic: string;
    cutLossLogic: string;
    tpLogic: string;
    slLogic: string;
    moveSLBEStructure: string;
  };
  psychology: {
    calmFactors: string;
    exhaustFactors: string;
    fearFactors: string;
    greedFactors: string;
  };
  updatedAt: any;
}
