import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import { selectGrants } from "../utils/supabase-client-queries/grants";
import { selectCategoriesByGrant } from "../utils/supabase-client-queries/categories";
import { useSupabase } from "../contexts/SessionProvider";
import TransactionVerdictDisplay from "./TransactionVerdictDisplay";
import type { VerifyTransactionResponse } from "../types/types";

interface Grant {
  grant_id: any;
  name: any;
  grant_number: any;
  created_at: any;
  created_by: any;
}

interface Category {
  category_id: string;
  category: string;
  current_amount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onTransactionSubmitted?: () => void | Promise<void>; // callback to refresh transactions
}

export default function TransactionModal({ open, onClose, onTransactionSubmitted }: Props) {
  const supabase = useSupabase();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<string>("");

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // -----------------------
  // Fetch user grants
  // -----------------------
  const fetchUserGrants = useCallback(async () => {
    try {
      const data = await selectGrants(supabase);
      setGrants(data);
    } catch (err: any) {
      console.error("Error fetching grants:", err.message);
    }
  }, []);

  // -----------------------
  // Fetch categories for selected grant
  // -----------------------
  const fetchCategories = useCallback(async (grantId: string) => {
    try {
      const data = await selectCategoriesByGrant(supabase, grantId);
      //const data = await selectAllCategories(supabase);
      setCategories(data);
      setSelectedCategory(""); // reset selection
    } catch (err: any) {
      console.error("Error fetching categories:", err.message);
      setCategories([]);
    }
  }, []);

  // Fetch grants when modal opens
  useEffect(() => {
    if (open) fetchUserGrants();
  }, [open, fetchUserGrants]);

  // Fetch categories when a grant is selected
  
  useEffect(() => {
    if (selectedGrant) {
      fetchCategories(selectedGrant);
    } else {
      setCategories([]);
    }
  }, [selectedGrant, fetchCategories]);
  
  const handleSubmit = async () => {
    if (!selectedGrant || !selectedCategory || !amount || !description) return;
  
    setLoading(true);
    setResponse(null);
  
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
  
      const token = session?.access_token;
      if (!token) throw new Error("No session token found");
  
      const res = await fetch(
        "https://ihoqewwgkpjmkgwoenck.supabase.co/functions/v1/verify-transaction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            grant_id: selectedGrant,
            category_id: selectedCategory,
            amount: Number(amount),
            description,
          }),
        }
      );
  
      let data: VerifyTransactionResponse | { error: string };
      try {
        data = await res.json();
      } catch {
        throw new Error("Response was not valid JSON");
      }
  
      if (!res.ok) {
        // Data should be { error: string }
        throw new Error((data as any)?.error || "Unknown error");
      }
  
      setResponse(data);  // ← stores the real verdict
  
    } catch (err: any) {
      console.error(err);
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Enter Transaction</DialogTitle>
      <DialogContent dividers>
        {/* Grant Dropdown */}
        <TextField
          select
          fullWidth
          label="Select Grant"
          value={selectedGrant}
          onChange={(e) => setSelectedGrant(e.target.value)}
          margin="normal"
        >
          {grants.map((grant) => (
            <MenuItem key={grant.grant_id} value={grant.grant_id}>
              {grant.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Category Dropdown */}
        <TextField
        
          select
          fullWidth
          label="Select Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          margin="normal"
          //disabled={!categories.length}
          disabled={!selectedGrant}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.category_id} value={cat.category_id}>
              {cat.category} (Current: ${cat.current_amount ?? 0})
            </MenuItem>
          ))}
        </TextField>

        {/* Amount */}
        <TextField
          fullWidth
          type="number"
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          margin="normal"
        />

        {/* Description */}
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          margin="normal"
        />

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {response && (
          <>
            {response.error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {response.error}
                </Typography>
              </Alert>
            ) : (
              <Box>
                <TransactionVerdictDisplay verdict={response.llm_verdict} />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        {response ? (
          <Button 
            onClick={async () => {
              if (onTransactionSubmitted) {
                await onTransactionSubmitted();
              }
              onClose();
            }} 
            variant="contained" 
            color="primary"
          >
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={
                loading || !selectedGrant || !selectedCategory || !amount || !description
              }
              variant="contained"
              color="primary"
            >
              Submit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
