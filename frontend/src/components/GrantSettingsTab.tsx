import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { SupabaseClient } from "@supabase/supabase-js";
import { selectInvitationsByGrant, createInvitation } from "../utils/supabase-client-queries/invitations";

interface GrantSettingsTabProps {
  grantId: number;
  grantName: string;
  onDeleteGrant: () => Promise<void>;
  supabase: SupabaseClient;
}

export function GrantSettingsTab({ grantId, grantName, onDeleteGrant, supabase }: GrantSettingsTabProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchInvitations = async () => {
    setLoadingInvites(true);
    try {
      const data = await selectInvitationsByGrant(supabase, grantId);
      setInvitations(data);
    } catch (err) {
      console.error("Error fetching invitations:", err);
      setErrorMessage("Failed to load invitations");
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantId, supabase]);

  const handleInviteClick = () => {
    setInviteDialogOpen(true);
    setInviteEmail("");
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await createInvitation(supabase, grantId, inviteEmail.trim());
      setSuccessMessage(`Invitation sent to ${inviteEmail}`);
      setInviteDialogOpen(false);
      setInviteEmail("");
      fetchInvitations();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

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

        {/* Member Invitations Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Member Invitations</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={handleInviteClick}
            >
              Invite Member
            </Button>
          </Box>

          {loadingInvites ? (
            <Typography variant="body2" color="text.secondary">Loading invitations...</Typography>
          ) : invitations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No pending invitations</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Expires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invited_email}</TableCell>
                    <TableCell>
                      <Chip
                        label={inv.status}
                        color={
                          inv.status === "accepted"
                            ? "success"
                            : inv.status === "pending"
                            ? "warning"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {inv.expires_at
                        ? new Date(inv.expires_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

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

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Member to Grant</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the email address of the person you'd like to invite to <strong>{grantName}</strong>.
            They'll receive an invitation link valid for 7 days.
          </DialogContentText>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            autoFocus
            disabled={inviting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)} disabled={inviting}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            color="primary"
            variant="contained"
            disabled={inviting || !inviteEmail.trim()}
          >
            {inviting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccessMessage("")} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setErrorMessage("")} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
