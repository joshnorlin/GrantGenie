import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { selectGrants } from "../utils/supabase-client-queries/grants";
import { selectAllTransactions } from "../utils/supabase-client-queries/transactions";

interface DataCacheContextType {
  grants: any[];
  transactions: any[];
  loading: boolean;
  error: string | null;
  fetchGrants: (supabase: SupabaseClient, forceRefresh?: boolean) => Promise<any[]>;
  fetchTransactions: (supabase: SupabaseClient, forceRefresh?: boolean) => Promise<any[]>;
  invalidateCache: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [grants, setGrants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantsCached, setGrantsCached] = useState(false);
  const [transactionsCached, setTransactionsCached] = useState(false);

  const fetchGrants = useCallback(async (supabase: SupabaseClient, forceRefresh = false) => {
    // Return cached data if available and not forcing refresh
    if (grantsCached && !forceRefresh) {
      return grants;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await selectGrants(supabase);
      setGrants(data || []);
      setGrantsCached(true);
      return data || [];
    } catch (err: any) {
      console.error("Error fetching grants:", err);
      setError(err.message || "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [grants, grantsCached]);

  const fetchTransactions = useCallback(async (supabase: SupabaseClient, forceRefresh = false) => {
    // Return cached data if available and not forcing refresh
    if (transactionsCached && !forceRefresh) {
      return transactions;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await selectAllTransactions(supabase);
      setTransactions(data || []);
      setTransactionsCached(true);
      return data || [];
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [transactions, transactionsCached]);

  const invalidateCache = useCallback(() => {
    setGrantsCached(false);
    setTransactionsCached(false);
  }, []);

  return (
    <DataCacheContext.Provider
      value={{
        grants,
        transactions,
        loading,
        error,
        fetchGrants,
        fetchTransactions,
        invalidateCache,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within DataCacheProvider");
  }
  return context;
}
