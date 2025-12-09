import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from "@mui/material";
import { SupabaseClient } from "@supabase/supabase-js";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import BudgetEntryModal from "./BudgetEntryModal";
import { BudgetTab } from "./BudgetTab";
import { InstitutionalRulesTab } from "./InstitutionalRulesTab";
import { SpendingOverviewTab } from "./SpendingOverviewTab";
import { GrantSettingsTab } from "./GrantSettingsTab";
import { selectGrantBudgetItems } from "../utils/supabase-client-queries/grantBudgets";
import { selectInstitutionalRules } from "../utils/supabase-client-queries/institutionalRules";
import { selectTransactionsByGrant } from "../utils/supabase-client-queries/transactions";
import { deleteGrant } from "../utils/supabase-client-queries/grants";
import { useGrantExport } from "../hooks/useGrantExport";

interface GrantDetailsModalProps {
  open: boolean;
  onClose: () => void;
  grant: any;
  supabase: SupabaseClient;
  onGrantDeleted?: () => void;
}

export function GrantDetailsModal({ open, onClose, grant, supabase, onGrantDeleted }: GrantDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [rules, setRules] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { exportGrant, isLoading: exportLoading, error: exportError } = useGrantExport(supabase, {
    onSuccess: () => setExportSuccess(true),
  });

  const handleDeleteGrant = async () => {
    await deleteGrant(supabase, grant.grant_id);
    onClose();
    if (onGrantDeleted) {
      onGrantDeleted();
    }
  };

  const handleExportGrant = async () => {
    try {
      await exportGrant(grant.grant_id);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

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
            width: "98%",
            maxWidth: 1600,
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Fixed Header */}
          <Box sx={{ p: 3, pb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {grant.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Grant #{grant.grant_number || "N/A"} • Created{" "}
              {new Date(grant.created_at).toLocaleDateString()}
            </Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }}>
              <Tab label="Budget" />
              <Tab label="Institutional Rules" />
              <Tab label="Spending Overview" />
              <Tab label="Settings" />
            </Tabs>
          </Box>

          {/* Scrollable Content */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress size={60} />
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

                {tab === 3 && (
                  <GrantSettingsTab
                    grantId={grant.grant_id}
                    grantName={grant.name}
                    onDeleteGrant={handleDeleteGrant}
                    supabase={supabase}
                  />
                )}
              </>
            )}
          </Box>

          {/* Fixed Footer */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Button 
                variant="contained" 
                color="success"
                onClick={handleExportGrant}
                disabled={exportLoading}
                startIcon={<FileDownloadIcon />}
                size="large"
              >
                {exportLoading ? "Exporting..." : "Export to Excel"}
              </Button>
            </Box>
            <Button variant="outlined" onClick={onClose} size="large">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
      
      <BudgetEntryModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        grantID={grant.grant_id}
        existingBudgetItems={budgetItems}
        onSuccess={() => {
          // Refetch grant details after successful save
          const fetchDetails = async () => {
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
              console.error("Error refreshing grant details:", err);
            }
          };
          fetchDetails();
        }}
      />

      <Snackbar 
        open={exportSuccess} 
        autoHideDuration={4000} 
        onClose={() => setExportSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setExportSuccess(false)} severity="success" sx={{ width: "100%" }}>
          Grant data exported successfully!
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!exportError} 
        autoHideDuration={6000} 
        onClose={() => {}}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          Export failed: {exportError?.message}
        </Alert>
      </Snackbar>
    </>
  );
}