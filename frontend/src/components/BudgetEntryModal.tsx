import { Alert, Box, Button, Modal, Typography } from "@mui/material";
import { budgetCategories } from "../constants/categories";
import React from "react";
import NumberInputField from "./NumberInputField";
import type { GrantBudgetItem, GrantBudgetItemValue } from "../types/grantBudgets";
import { useSession, useSupabase } from "../contexts/SessionProvider";
import { insertGrantBudgetItems } from "../utils/supabase-client-queries/grantBudgets";

interface BudgetEntryModalProps {
  open: boolean;
  onClose: () => void;
  grantID: number;
}

export default function BudgetEntryModal({ open, onClose, grantID }: BudgetEntryModalProps) {
  const session = useSession();
  const supabase = useSupabase();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const initialAmounts: Record<string, GrantBudgetItemValue> = React.useMemo(() => {
    return Object.fromEntries(
      budgetCategories.map((category) => [`category${category.category_id}`, ""])
    );
  }, []);

  const [amounts, setAmounts] = React.useState<Record<string, GrantBudgetItemValue>>(initialAmounts);

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
    setSuccess(false);
  
    try {
      const budgetItems = formatBudgetItems(amounts, grantID);

      await insertGrantBudgetItems(supabase, session, budgetItems);
  
      setSuccess(true);
    } catch (err: any) {
      console.error("Error creating grant budget:", err);
      setError(err.message || "Failed to create grant budget");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          width: "90%",
          maxWidth: 500,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">Grant budget created successfully!</Alert>}

        <Typography variant="h4">Budget Entry</Typography>
        <Typography variant="body1">Enter your budget details below:</Typography>
        <Box>
          {budgetCategories.map((category) => {
            const name = `category${category.category_id}`;
            return (
              <Box key={category.category}>
                <Typography>{category.category}:</Typography>
                <NumberInputField
                  name={`category${category.category_id}`}
                  value={amounts[name] === "" ? null : amounts[name]}
                  onChange={handleChange}
                />
              </Box>
            );
          })}
        </Box>
        <Button
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
        >
          Submit Budget
        </Button>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}