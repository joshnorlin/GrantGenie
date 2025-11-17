import { useEffect, useState, useCallback } from "react";
import { Paper, Typography, CircularProgress, List, ListItem, ListItemText, Divider } from "@mui/material";
import { useSupabase } from "../contexts/SessionProvider";
import type { SupabaseClient } from "@supabase/supabase-js";

// Fetch all grants
async function selectAllGrants(client: SupabaseClient) {
  const { data, error } = await client
    .from("grants")
    .select("*")
    .order("grant_id", { ascending: true });

  if (error) throw error;
  return data;
}

// Fetch all transactions
async function selectAllTransactions(client: SupabaseClient) {
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

interface Grant {
  grant_id: number;
  name: string;
  grant_number: string;
}

interface Transaction {
  transaction_id: number;
  grant_id: number;
  amount: number;
  additional_details: string | null;
  created_at: string;
}

export default function TransactionViewer() {
  const supabase = useSupabase();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const grantsData = await selectAllGrants(supabase);
      const transactionsData = await selectAllTransactions(supabase);

      setGrants(grantsData || []);
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setGrants([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group transactions by grant_id for faster lookup
  const transactionsByGrant: Record<number, Transaction[]> = transactions.reduce(
    (acc, t) => {
      if (!acc[t.grant_id]) acc[t.grant_id] = [];
      acc[t.grant_id].push(t);
      return acc;
    },
    {} as Record<number, Transaction[]>
  );

  return (
    <Paper elevation={3} sx={{ mt: 4, p: 3, width: "80%" }}>
      <Typography variant="h6" gutterBottom>
        All Transactions
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : grants.length === 0 ? (
        <Typography>No grants found.</Typography>
      ) : (
        grants.map((grant) => {
          const grantTransactions = transactionsByGrant[grant.grant_id] || [];
          return (
            <div key={grant.grant_id} style={{ marginBottom: 20 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {grant.name} (Grant #{grant.grant_number})
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {grantTransactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No transactions yet.
                </Typography>
              ) : (
                <List dense>
                  {grantTransactions.map((t) => (
                    <ListItem key={t.transaction_id}>
                      <ListItemText
                        primary={`$${t.amount}`}
                        secondary={`${t.additional_details || "(No description)"} — ${new Date(
                          t.created_at
                        ).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </div>
          );
        })
      )}
    </Paper>
  );
}
