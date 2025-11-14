import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { SupabaseClient } from "@supabase/supabase-js";

interface GrantDetailsModalProps {
  open: boolean;
  onClose: () => void;
  grant: any;
  supabase: SupabaseClient;
}

export function GrantDetailsModal({ open, onClose, grant, supabase }: GrantDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!grant) return;
    const fetchDetails = async () => {
      setLoading(true);

      try {
        // 1️⃣ Budget items
        const { data: budgetData, error: budgetError } = await supabase
          .from("grant_budget_items")
          .select("description, amount, category_lookup(category)")
          .eq("grant_id", grant.grant_id);

        if (budgetError) throw budgetError;

        // 2️⃣ Institutional rules
        const { data: ruleData, error: ruleError } = await supabase
          .from("institutional_rules")
          .select("ruleset")
          .eq("grant_id", grant.grant_id)
          .single();

        if (ruleError && ruleError.code !== "PGRST116") throw ruleError;

        // 3️⃣ Transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from("transactions")
          .select("amount, created_at")
          .eq("grant_id", grant.grant_id);

        if (transactionError && transactionError.code !== "PGRST116") throw transactionError;

        setBudgetItems(budgetData || []);
        setRules(ruleData?.ruleset || null);
        setTransactions(transactionData || []);
      } catch (err) {
        console.error("Error fetching grant details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [grant, supabase]);

  if (!grant) return null;

  const totalBudget: number = budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalSpent: number = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const percentUsed: number = totalBudget ? +((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute" as const,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          maxWidth: 800,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        <Typography variant="h5" gutterBottom>
          {grant.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Grant #{grant.grant_number || "N/A"} — Created{" "}
          {new Date(grant.created_at).toLocaleDateString()}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Budget" />
          <Tab label="Institutional Rules" />
          <Tab label="Spending Overview" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <Box>
                <Typography variant="h6">Budget Line Items</Typography>
                <Divider sx={{ mb: 2 }} />
                {budgetItems.length === 0 ? (
                  <Typography>No budget items found.</Typography>
                ) : (
                  <List dense>
                    {budgetItems.map((item, i) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={`${item.description || "(No description)"}`}
                          secondary={`${item.category_lookup?.category || "Uncategorized"} — $${Number(item.amount).toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {tab === 1 && (
              <Box>
                <Typography variant="h6">Institutional Rules</Typography>
                <Divider sx={{ mb: 2 }} />
                {rules ? (
                  <List dense>
                    {Object.entries(rules).map(([key, val]) => (
                      <ListItem key={key}>
                        <ListItemText primary={key} secondary={String(val)} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No institutional rules found.</Typography>
                )}
              </Box>
            )}

            {tab === 2 && (
              <Box>
                <Typography variant="h6">Spending Overview</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography>Total Budget: ${totalBudget.toLocaleString()}</Typography>
                <Typography>Total Spent: ${totalSpent.toLocaleString()}</Typography>
                <Typography color={percentUsed > 90 ? "error" : "success.main"}>
                  {percentUsed}% of budget used
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1">Recent Transactions</Typography>
                {transactions.length === 0 ? (
                  <Typography>No transactions recorded.</Typography>
                ) : (
                  <List dense>
                    {transactions.map((t, i) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={t.description || "(No description)"}
                          secondary={`${new Date(t.created_at).toLocaleDateString()} — $${t.amount}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </>
        )}

        <Box textAlign="right" mt={3}>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
