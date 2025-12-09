import { useState } from "react";
import { Box, Typography, Divider, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";

interface GrantSettingsTabProps {
  grantId: number;
  grantName: string;
  onDeleteGrant: () => Promise<void>;
}

export function GrantSettingsTab({ grantId, grantName, onDeleteGrant }: GrantSettingsTabProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteGrant();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting grant:", err);
      alert("Failed to delete grant. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Grant Settings
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" color="error" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningIcon /> Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Deleting this grant is permanent and cannot be undone. All associated budget items, transactions, and rules will be removed.
          </Typography>
          
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            Delete Grant
          </Button>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>
          Delete Grant?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{grantName}</strong>? This action cannot be undone.
            All budget items, transactions, and institutional rules associated with this grant will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting} autoFocus>
            {deleting ? "Deleting..." : "Delete Grant"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
