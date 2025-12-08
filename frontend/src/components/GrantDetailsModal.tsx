import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { SupabaseClient } from "@supabase/supabase-js";
import BudgetEntryModal from "./BudgetEntryModal";
import { BudgetTab } from "./BudgetTab";
import { InstitutionalRulesTab } from "./InstitutionalRulesTab";
import { SpendingOverviewTab } from "./SpendingOverviewTab";
import { selectGrantBudgetItems } from "../utils/supabase-client-queries/grantBudgets";
import { selectInstitutionalRules } from "../utils/supabase-client-queries/institutionalRules";
import { selectTransactionsByGrant } from "../utils/supabase-client-queries/transactions";

interface GrantDetailsModalProps {
  open: boolean;
  onClose: () => void;
  grant: any;
  supabase: SupabaseClient;
}

export function GrantDetailsModal({ open, onClose, grant, supabase }: GrantDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [rules, setRules] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!grant) return;
    
    const fetchDetails = async () => {
      setLoading(true);

      try {
        const [budgetData, ruleData, transactionData] = await Promise.all([
          selectGrantBudgetItems(supabase, grant.grant_id),
          selectInstitutionalRules(supabase, grant.grant_id),
          selectTransactionsByGrant(supabase, grant.grant_id),
        ]);

        setBudgetItems(budgetData);
        setRules(ruleData);
        setTransactions(transactionData);
      } catch (err) {
        console.error("Error fetching grant details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [grant, supabase]);

  if (!grant) return null;

  const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <>
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
                <BudgetTab
                  budgetItems={budgetItems}
                  onAddBudget={() => setBudgetModalOpen(true)}
                  onEditBudget={() => setBudgetModalOpen(true)}
                />
              )}

              {tab === 1 && <InstitutionalRulesTab rules={rules} />}

              {tab === 2 && (
                <SpendingOverviewTab
                  totalBudget={totalBudget}
                  totalSpent={totalSpent}
                  transactions={transactions}
                />
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
      
      <BudgetEntryModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        grantID={grant.grant_id}
      />
    </>
  );
}