import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  Typography,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { SupabaseClient } from "@supabase/supabase-js";
import { insertGrant } from "../utils/supabase-client-queries/grants";
import { createInvitation } from "../utils/supabase-client-queries/invitations";
import { selectAllCategories } from "../utils/supabase-client-queries/categories";

interface MultiStepGrantCreatorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supabase: SupabaseClient;
}

interface BudgetItem {
  category_id: number;
  budgeted_amount: number;
  categoryName: string;
}

interface Invitation {
  email: string;
  tempId: string;
}

const steps = ["Grant Details", "Budget (Optional)", "Institutional Rules", "Invite Members (Optional)", "Review & Finalize"];

export default function MultiStepGrantCreator({ open, onClose, onSuccess, supabase }: MultiStepGrantCreatorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Step 1: Grant Details
  const [grantName, setGrantName] = useState("");
  const [grantNumber, setGrantNumber] = useState("");

  // Step 2: Budget
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [newAmount, setNewAmount] = useState<number | "">("");
  const [categories, setCategories] = useState<any[]>([]);

  // Step 4: Invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");

  // Load categories when modal opens
  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const allCategories = await selectAllCategories(supabase);
      setCategories(allCategories);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleNext = async () => {
    setError("");

    // Validate current step
    if (activeStep === 0) {
      if (!grantName.trim()) {
        setError("Grant name is required");
        return;
      }
      if (!grantNumber.trim()) {
        setError("Grant number is required");
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep((prev) => prev - 1);
  };

  const handleAddBudgetItem = () => {
    if (!selectedCategoryId || !newAmount) {
      setError("Please select a category and enter an amount");
      return;
    }

    const category = categories.find((c) => c.category_id === selectedCategoryId);
    if (!category) {
      setError("Invalid category selected");
      return;
    }

    // Check if this category is already added
    if (budgetItems.some((item) => item.category_id === selectedCategoryId)) {
      setError("This category has already been added");
      return;
    }

    setBudgetItems([
      ...budgetItems,
      {
        category_id: Number(selectedCategoryId),
        budgeted_amount: Number(newAmount),
        categoryName: category.category,
      },
    ]);
    setSelectedCategoryId("");
    setNewAmount("");
    setError("");
  };

  const handleRemoveBudgetItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
  };

  const handleAddInvitation = () => {
    if (!newInviteEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInviteEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (invitations.some((inv) => inv.email === newInviteEmail)) {
      setError("This email has already been added");
      return;
    }

    setInvitations([
      ...invitations,
      {
        email: newInviteEmail.trim(),
        tempId: `temp_${Date.now()}`,
      },
    ]);
    setNewInviteEmail("");
    setError("");
  };

  const handleRemoveInvitation = (tempId: string) => {
    setInvitations(invitations.filter((inv) => inv.tempId !== tempId));
  };

  const handleFinalize = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const user = session.user;

      // Step 2: Create the grant
      const grantData = await insertGrant(supabase, {
        name: grantName.trim(),
        grant_number: grantNumber.trim(),
        session: session,
      });

      // insertGrant returns an array, get the first item
      const newGrant = Array.isArray(grantData) ? grantData[0] : grantData;
      const grantId = newGrant.grant_id;

      console.log("Grant created with ID:", grantId);

      // Step 3: Wait for trigger to complete and verify membership
      // Poll for membership to ensure trigger has completed
      let membershipExists = false;
      for (let i = 0; i < 10; i++) {
        const { data: membership } = await supabase
          .from("grant_memberships")
          .select("grant_id")
          .eq("grant_id", grantId)
          .eq("user_id", user.id)
          .single();
        
        if (membership) {
          membershipExists = true;
          console.log("Membership confirmed");
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!membershipExists) {
        console.warn("Membership not found after polling, but continuing...");
      }

      // Step 4: Add budget items if any
      if (budgetItems.length > 0) {
        const budgetInserts = budgetItems.map((item) => ({
          grant_id: grantId,
          category_id: item.category_id,
          amount: item.budgeted_amount,
          entered_by: user.id,
        }));

        console.log("Inserting budget items:", budgetInserts);

        const { error: budgetError } = await supabase
          .from("grant_budget_items")
          .insert(budgetInserts);

        if (budgetError) {
          console.error("Error adding budget items:", budgetError);
          setError(`Grant created but failed to add budget items: ${budgetError.message}`);
          // Don't return - continue with invitations
        } else {
          console.log("Budget items added successfully");
        }
      }

      // Step 5: Send invitations if any
      if (invitations.length > 0) {
        console.log("Sending invitations:", invitations);
        for (const invitation of invitations) {
          try {
            await createInvitation(supabase, grantId, invitation.email);
            console.log(`Invitation sent to ${invitation.email}`);
          } catch (err: any) {
            console.error(`Error sending invitation to ${invitation.email}:`, err);
            // Continue with other invitations even if one fails
          }
        }
      }

      // Success!
      console.log("Grant creation complete!");
      onSuccess();
      handleReset();
      onClose();
    } catch (err: any) {
      console.error("Error creating grant:", err);
      setError(err.message || "Failed to create grant");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setGrantName("");
    setGrantNumber("");
    setBudgetItems([]);
    setSelectedCategoryId("");
    setNewAmount("");
    setInvitations([]);
    setNewInviteEmail("");
    setError("");
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Grant Details
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Grant Name"
              value={grantName}
              onChange={(e) => setGrantName(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Grant Number"
              value={grantNumber}
              onChange={(e) => setGrantNumber(e.target.value)}
              margin="normal"
              required
              helperText="A unique identifier for this grant"
            />
          </Box>
        );

      case 1:
        // Budget
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Add budget categories and amounts for this grant. You can skip this step and add them later.
            </Typography>

            {loadingCategories ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 3 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value as number)}
                      label="Category"
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat.category_id} value={cat.category_id}>
                          {cat.category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Amount"
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value ? Number(e.target.value) : "")}
                    sx={{ width: 200 }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddBudgetItem}
                    disabled={!selectedCategoryId || !newAmount}
                  >
                    Add
                  </Button>
                </Box>

                {budgetItems.length > 0 && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Budgeted Amount</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgetItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.categoryName}</TableCell>
                          <TableCell align="right">${item.budgeted_amount.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveBudgetItem(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {budgetItems.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No budget items added yet. You can skip this step or add items above.
                  </Alert>
                )}
              </>
            )}
          </Box>
        );

      case 2:
        // Institutional Rules
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" icon={false}>
              <Typography variant="h6" gutterBottom>
                Institutional Rules
              </Typography>
              <Typography variant="body1">
                Institutional rules are currently fixed due to research project limitations.
                You will be able to upload and customize institutional rules in a later version of GrantGenie.
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                For now, default institutional rules will be applied to your grant.
              </Typography>
            </Alert>
          </Box>
        );

      case 3:
        // Invite Members
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Invite team members to collaborate on this grant. You can skip this step and invite them later.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="colleague@university.edu"
              />
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleAddInvitation}
              >
                Add
              </Button>
            </Box>

            {invitations.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.tempId}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveInvitation(inv.tempId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {invitations.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No invitations added yet. You can skip this step or add email addresses above.
              </Alert>
            )}
          </Box>
        );

      case 4:
        // Review & Finalize
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Grant
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Grant Name
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {grantName}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Grant Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {grantNumber}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Budget Items
              </Typography>
              {budgetItems.length > 0 ? (
                <Box>
                  {budgetItems.map((item, index) => (
                    <Chip
                      key={index}
                      label={`${item.categoryName}: $${item.budgeted_amount.toFixed(2)}`}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No budget items added
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Invitations
              </Typography>
              {invitations.length > 0 ? (
                <Box>
                  {invitations.map((inv) => (
                    <Chip
                      key={inv.tempId}
                      label={inv.email}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No invitations added
                </Typography>
              )}
            </Box>

            <Alert severity="success">
              Click "Finalize Grant" to create your grant with all the details above.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Grant</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={loading}>
            {activeStep === 1 || activeStep === 3 ? "Skip / Continue" : "Continue"}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleFinalize}
            disabled={loading}
          >
            {loading ? "Creating..." : "Finalize Grant"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
