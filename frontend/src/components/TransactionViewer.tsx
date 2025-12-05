import { useEffect, useState, useCallback } from "react";
import {
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse,
} from "@mui/material";
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

export default function TransactionViewer() {
  const supabase = useSupabase();
  const [grants, setGrants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Which transaction is expanded?
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

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

  // Group transactions by grant
  const transactionsByGrant = transactions.reduce(
    (acc: Record<number, any[]>, t: any) => {
      if (!acc[t.grant_id]) acc[t.grant_id] = [];
      acc[t.grant_id].push(t);
      return acc;
    },
    {}
  );

  return (
    <Paper elevation={3} sx={{ mt: 4, p: 3, width: "80%" }}>
      <Typography variant="h6" gutterBottom>
        All Transactions (Table View)
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
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                {grant.name} (Grant #{grant.grant_number})
              </Typography>

              <Divider sx={{ mb: 1 }} />

              {grantTransactions.length === 0 ? (
                <Typography>No transactions yet.</Typography>
              ) : (
                <List dense>
                  {grantTransactions.map((t) => {
                    const isOpen = expanded === t.transaction_id;

                    return (
                      <div key={t.transaction_id}>
                        {/* CLICKABLE BUTTON */}
                        <ListItem sx={{ p: 0, mb: 1 }}>
                        <ListItem sx={{ p: 0, mb: 1, display: "flex", gap: 1 }}>
                        {/* Main Dropdown Button */}
                        <Button
                          variant="contained"
                          color={isOpen ? "secondary" : "primary"}
                          onClick={() => toggleExpand(t.transaction_id)}
                          sx={{
                            flexGrow: 1,
                            justifyContent: "space-between",
                            textTransform: "none",
                            fontWeight: "bold",
                            borderRadius: 2,
                            py: 1.2,
                          }}
                        >
                          Transaction #{t.transaction_id} — ${t.amount}
                          <span>{isOpen ? "▲" : "▼"}</span>
                        </Button>

                        {/* Status or Review Buttons */}
                        {t.status === "REQUIRES_REVIEW" ? (
                          <>
                            {/* Approve */}
                            <Button
                              variant="contained"
                              color="success"
                              sx={{ minWidth: 50 }}
                              onClick={() => console.log("Approve", t.transaction_id)}
                            >
                              ✔
                            </Button>

                            {/* Reject */}
                            <Button
                              variant="contained"
                              color="error"
                              sx={{ minWidth: 50 }}
                              onClick={() => console.log("Reject", t.transaction_id)}
                            >
                              ✖
                            </Button>
                          </>
                        ) : (
                          // Otherwise show status text
                          <Typography
                            sx={{
                              minWidth: 120,
                              textAlign: "center",
                              fontWeight: "bold",
                              p: 1,
                            }}
                          >
                            {t.status}
                          </Typography>
                        )}
                      </ListItem>
                        </ListItem>

                        {/* EXPAND/COLLAPSE TABLE */}
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Paper
                            elevation={1}
                            sx={{ p: 2, mb: 2, backgroundColor: "#fafafa" }}
                          >
                            <Table size="small">
                              <TableBody>
                                {Object.entries(t).map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell
                                      sx={{
                                        fontWeight: "bold",
                                        width: "30%",
                                      }}
                                    >
                                      {key}
                                    </TableCell>
                                    <TableCell>
                                      {typeof value === "string" &&
                                      value.startsWith("20")
                                        ? new Date(value).toLocaleString()
                                        : String(value)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Paper>
                        </Collapse>
                      </div>
                    );
                  })}
                </List>
              )}
            </div>
          );
        })
      )}
    </Paper>
  );
}
