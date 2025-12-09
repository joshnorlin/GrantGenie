import { Alert, Box, Button, Modal, Typography, Paper, Divider, CircularProgress, Snackbar } from "@mui/material";
import { budgetCategories } from "../constants/categories";
import React from "react";
import NumberInputField from "./NumberInputField";
import type { GrantBudgetItem, GrantBudgetItemValue } from "../types/types";
import { useSession, useSupabase } from "../contexts/SessionProvider";
import { upsertGrantBudgetItems } from "../utils/supabase-client-queries/grantBudgets";

interface BudgetEntryModalProps {
  open: boolean;
  onClose: () => void;
  grantID: number;
  existingBudgetItems?: any[];
  onSuccess?: () => void;
}

// Group categories by super category
const categoryGroups = {
  "Personnel": [1, 2, 11], // Salaries, Fringe, Tuition
  "Travel": [4, 5], // Domestic, International
  "Materials & Equipment": [3, 6], // Equipment, Materials & Supplies
  "Services & Collaboration": [8, 9], // Consultants, Subawards
  "Participant Support": [7], // Participant Support
  "Other Costs": [10, 12, 13], // Publication, Computer, Other
  "Indirect Costs": [14, 15] // F&A, Unallowable
};

export default function BudgetEntryModal({ open, onClose, grantID, existingBudgetItems = [], onSuccess }: BudgetEntryModalProps) {
  const session = useSession();
  const supabase = useSupabase();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  
  const initialAmounts: Record<string, GrantBudgetItemValue> = React.useMemo(() => {
    const base: Record<string, GrantBudgetItemValue> = Object.fromEntries(
      budgetCategories.map((category) => [`category${category.category_id}`, ""])
    );
    
    // Populate with existing values if available
    existingBudgetItems.forEach((item) => {
      if (item.category_id) {
        const amount = Number(item.amount);
        base[`category${item.category_id}`] = amount || "";
      }
    });
    
    return base;
  }, [existingBudgetItems]);

  const [amounts, setAmounts] = React.useState<Record<string, GrantBudgetItemValue>>(initialAmounts);
  
  // Update form when modal opens with new data
  React.useEffect(() => {
    if (open) {
      setAmounts(initialAmounts);
      setError(null);
    }
  }, [open, initialAmounts]);

  const handleChange = (name: string, value: number | null) => {
    setAmounts((prev) => ({
      ...prev,
      [name]: value === null ? "" : value
    }));
  } 

  const formatBudgetItems = (
    amounts: Record<string, GrantBudgetItemValue>,
    grantID: number
  ): GrantBudgetItem[] => {
    return budgetCategories.map((category) => {
      const key = `category${category.category_id}`;
      return {
        grant_id: grantID,
        category_id: category.category_id,
        value: amounts[key] === "" ? "" : amounts[key]
      };
    });
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const budgetItems = formatBudgetItems(amounts, grantID);

      await upsertGrantBudgetItems(supabase, session, grantID, budgetItems);
  
      // Close modal immediately
      onClose();
      
      // Call success callback to refresh parent data
      if (onSuccess) {
        onSuccess();
      }
      
      // Show success toast
      setShowSuccessToast(true);
    } catch (err: any) {
      console.error("Error saving grant budget:", err);
      setError(err.message || "Failed to save grant budget");
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = React.useMemo(() => {
    return Object.values(amounts).reduce((sum, val) => {
      const num = val === "" ? 0 : Number(val);
      return Number(sum) + num;
    }, 0);
  }, [amounts]);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
      >
        <Box
          sx={{
            position: "absolute" as const,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "98%",
            maxWidth: 1400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2.5, pb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Grant Budget Entry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter budget amounts for each category. All fields are optional.
            </Typography>
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>

          {/* Budget Form - Scrollable */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
              gap: 2,
            }}>
              {Object.entries(categoryGroups).map(([groupName, categoryIds]) => (
                <Paper key={groupName} elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    {groupName}
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                    
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {categoryIds.map((categoryId) => {
                      const category = budgetCategories.find(c => c.category_id === categoryId);
                      if (!category) return null;
                      const name = `category${category.category_id}`;
                      return (
                        <Box key={category.category_id}>
                          <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                            {category.category}
                          </Typography>
                          <NumberInputField
                            name={name}
                            value={amounts[name] === "" ? null : amounts[name]}
                            onChange={handleChange}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* Footer */}
          <Box 
            sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: "divider", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Total: ${totalBudget.toLocaleString()}
            </Typography>
            
            <Box display="flex" gap={2}>
              <Button onClick={onClose} variant="outlined">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? "Saving..." : "Save Budget"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
      
      {/* Success Toast */}
      <Snackbar
        open={showSuccessToast}
        autoHideDuration={4000}
        onClose={() => setShowSuccessToast(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setShowSuccessToast(false)} sx={{ width: "100%" }}>
          Budget saved successfully!
        </Alert>
      </Snackbar>
    </>
  );
}