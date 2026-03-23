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
    if (obj[key] === undefined) continue;
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

export const db = {
  accounts: {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map(mapToCamelCase);
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      const channel = supabase
        .channel(`accounts-${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'accounts', 
          filter: `user_id=eq.${userId}` 
        }, (payload) => {
          const mappedPayload = {
            ...payload,
            new: payload.new ? mapToCamelCase(payload.new) : payload.new,
            old: payload.old ? mapToCamelCase(payload.old) : payload.old
          };
          callback(mappedPayload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    async add(account: any) {
      console.log("Adding account to Supabase:", account);
      const { data, error } = await supabase
        .from('accounts')
        .insert([mapToSnakeCase(account)])
        .select();
      if (error) {
        console.error("Supabase error adding account:", error);
        throw error;
      }
      console.log("Successfully added account:", data[0]);
      return mapToCamelCase(data[0]);
    },
    async update(id: string, updates: any) {
      console.log(`Updating account ${id} in Supabase:`, updates);
      const { id: _id, ...rest } = updates;
      const { error } = await supabase
        .from('accounts')
        .update(mapToSnakeCase(rest))
        .eq('id', id);
      if (error) {
        console.error("Supabase error updating account:", error);
        throw error;
      }
      console.log("Successfully updated account:", id);
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async get(id: string) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return mapToCamelCase(data);
    }
  },
  trades: {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map(mapToCamelCase);
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      const channel = supabase
        .channel(`trades-${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trades', 
          filter: `user_id=eq.${userId}` 
        }, (payload) => {
          const mappedPayload = {
            ...payload,
            new: payload.new ? mapToCamelCase(payload.new) : payload.new,
            old: payload.old ? mapToCamelCase(payload.old) : payload.old
          };
          callback(mappedPayload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    async add(trade: any) {
      console.log("Adding trade to Supabase:", trade);
      const { data, error } = await supabase
        .from('trades')
        .insert([mapToSnakeCase(trade)])
        .select();
      if (error) {
        console.error("Supabase error adding trade:", error);
        throw error;
      }
      console.log("Successfully added trade:", data[0]);
      return mapToCamelCase(data[0]);
    },
    async update(id: string, updates: any) {
      console.log(`Updating trade ${id} in Supabase:`, updates);
      const { id: _id, ...rest } = updates;
      const { error } = await supabase
        .from('trades')
        .update(mapToSnakeCase(rest))
        .eq('id', id);
      if (error) {
        console.error("Supabase error updating trade:", error);
        throw error;
      }
      console.log("Successfully updated trade:", id);
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async clear(userId: string) {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    }
  },
  strategies: {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map(mapToCamelCase);
    },
    subscribe(userId: string, callback: (payload: any) => void) {
      const channel = supabase
        .channel(`strategies-${userId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'strategies', 
          filter: `user_id=eq.${userId}` 
        }, (payload) => {
          const mappedPayload = {
            ...payload,
            new: payload.new ? mapToCamelCase(payload.new) : payload.new,
            old: payload.old ? mapToCamelCase(payload.old) : payload.old
          };
          callback(mappedPayload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    async add(strategy: any) {
      console.log("Adding strategy to Supabase:", strategy);
      const { data, error } = await supabase
        .from('strategies')
        .insert([mapToSnakeCase(strategy)])
        .select();
      if (error) {
        console.error("Supabase error adding strategy:", error);
        throw error;
      }
      console.log("Successfully added strategy:", data[0]);
      return mapToCamelCase(data[0]);
    },
    async update(id: string, updates: any) {
      console.log(`Updating strategy ${id} in Supabase:`, updates);
      const { id: _id, ...rest } = updates;
      const { error } = await supabase
        .from('strategies')
        .update(mapToSnakeCase(rest))
        .eq('id', id);
      if (error) {
        console.error("Supabase error updating strategy:", error);
        throw error;
      }
      console.log("Successfully updated strategy:", id);
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  }
};
