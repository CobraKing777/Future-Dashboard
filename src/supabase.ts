import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tsdiykjpdjmkaqrgykqb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_D6b8Y-HfKV0Fce2i8DjU7A_FMLmBWfQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Helper for database operations to maintain similar interface to what was used with Firebase
const mapToSnakeCase = (obj: any) => {
  const snake: any = {};
  for (const key in obj) {
    // Skip undefined and empty strings for ID-like fields
    if (obj[key] === undefined) continue;
    if (['id', 'accountId', 'strategyId', 'userId', 'tradeId'].includes(key) && obj[key] === '') continue;
    
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snake[snakeKey] = obj[key];
  }
  return snake;
};

const mapToCamelCase = (obj: any) => {
  if (!obj) return obj;
  const camel: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camel[camelKey] = obj[key];
  }
  return camel;
};

// Mock database using LocalStorage for development
const getLocalData = (key: string) => {
  const data = localStorage.getItem(key);
  if (!data) {
    // Initial mock data
    if (key === 'accounts') {
      return [{
        id: 'mock-account-1',
        userId: 'dev-user-123',
        name: 'Main Trading Account',
        type: 'Live',
        currentBalance: 50000,
        maxBalance: 50000,
        commissions: { MNQ: 0.5, NQ: 2.0, MES: 0.5, ES: 2.0 },
        createdAt: new Date().toISOString()
      }];
    }
    if (key === 'strategies') {
      return [{
        id: 'mock-strategy-1',
        userId: 'dev-user-123',
        name: 'Trend Following',
        entry: { context: 'Trend alignment', marketRegime: 'Trending' },
        exit: { partialCloseLogic: '1:1 RR', moveSLBEStructure: 'After 1:1' },
        psychology: { fearFactors: 'Missing out', greedFactors: 'Over-leveraging' },
        createdAt: new Date().toISOString()
      }];
    }
    return [];
  }
  return JSON.parse(data);
};

const setLocalData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  accounts: {
    async list(userId: string) {
      return getLocalData('accounts').filter((a: any) => a.userId === userId);
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      // Mock subscription - just a no-op for now
      return () => {};
    },
    async add(account: any) {
      const accounts = getLocalData('accounts');
      const newAccount = { ...account, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      accounts.push(newAccount);
      setLocalData('accounts', accounts);
      return newAccount;
    },
    async update(id: string, updates: any) {
      const accounts = getLocalData('accounts');
      const index = accounts.findIndex((a: any) => a.id === id);
      if (index !== -1) {
        accounts[index] = { ...accounts[index], ...updates };
        setLocalData('accounts', accounts);
      }
    },
    async delete(id: string) {
      const accounts = getLocalData('accounts');
      setLocalData('accounts', accounts.filter((a: any) => a.id !== id));
    },
    async get(id: string) {
      return getLocalData('accounts').find((a: any) => a.id === id);
    }
  },
  trades: {
    async list(userId: string) {
      return getLocalData('trades').filter((t: any) => t.userId === userId);
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      return () => {};
    },
    async add(trade: any) {
      const trades = getLocalData('trades');
      const newTrade = { ...trade, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      trades.push(newTrade);
      setLocalData('trades', trades);
      return newTrade;
    },
    async update(id: string, updates: any) {
      const trades = getLocalData('trades');
      const index = trades.findIndex((t: any) => t.id === id);
      if (index !== -1) {
        trades[index] = { ...trades[index], ...updates };
        setLocalData('trades', trades);
      }
    },
    async delete(id: string) {
      const trades = getLocalData('trades');
      setLocalData('trades', trades.filter((t: any) => t.id !== id));
    },
    async clear(userId: string) {
      const trades = getLocalData('trades');
      setLocalData('trades', trades.filter((t: any) => t.userId !== userId));
    }
  },
  strategies: {
    async list(userId: string) {
      return getLocalData('strategies').filter((s: any) => s.userId === userId);
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      return () => {};
    },
    async add(strategy: any) {
      const strategies = getLocalData('strategies');
      const newStrategy = { ...strategy, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      strategies.push(newStrategy);
      setLocalData('strategies', strategies);
      return newStrategy;
    },
    async update(id: string, updates: any) {
      const strategies = getLocalData('strategies');
      const index = strategies.findIndex((s: any) => s.id === id);
      if (index !== -1) {
        strategies[index] = { ...strategies[index], ...updates };
        setLocalData('strategies', strategies);
      }
    },
    async delete(id: string) {
      const strategies = getLocalData('strategies');
      setLocalData('strategies', strategies.filter((s: any) => s.id !== id));
    }
  }
};
