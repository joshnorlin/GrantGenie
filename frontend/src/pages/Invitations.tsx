import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClearIcon from "@mui/icons-material/Clear";
import { useSupabase } from "../contexts/SessionProvider";
import { useDataCache } from "../contexts/DataCacheProvider";
import { acceptInvitation, rejectInvitation } from "../utils/supabase-client-queries/invitations";

export default function Invitations() {
  const supabase = useSupabase();
  const { invitations, fetchInvitations } = useDataCache();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [selectedRejectId, setSelectedRejectId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchInvitations(supabase, true);
  }, []);

  const handleAccept = async (token: string, inviteId: string) => {
    setAccepting(inviteId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await acceptInvitation(supabase, token);
      setSuccessMessage("Invitation accepted! You can now access the grant.");
      fetchInvitations(supabase, true); // Refresh the list
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept invitation");
    } finally {
      setAccepting(null);
    }
  };

  const handleRejectClick = (inviteId: string) => {
    setSelectedRejectId(inviteId);
    setRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRejectId) return;
    setRejectingId(selectedRejectId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await rejectInvitation(supabase, selectedRejectId);
      setSuccessMessage("Invitation rejected.");
      setRejectConfirmOpen(false);
      setSelectedRejectId(null);
      fetchInvitations(supabase, true); // Refresh the list
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reject invitation");
    } finally {
      setRejectingId(null);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <MailIcon fontSize="large" color="primary" />
        <Typography variant="h4" fontWeight="bold">
          My Invitations
        </Typography>
      </Box>

      {invitations.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              You have no pending grant invitations.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Grant</TableCell>
                  <TableCell>Invited</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invite) => {
                  const expired = isExpired(invite.expires_at);
                  return (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {invite.grant?.name || "Unknown Grant"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invite.grant?.grant_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(invite.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invite.expires_at
                          ? new Date(invite.expires_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expired ? "Expired" : "Pending"}
                          color={expired ? "error" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {expired ? (
                          <Typography variant="body2" color="text.secondary">
                            Expired
                          </Typography>
                        ) : (
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleAccept(invite.token, invite.id)}
                              disabled={accepting === invite.id || rejectingId === invite.id}
                            >
                              {accepting === invite.id ? "Accepting..." : "Accept"}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<ClearIcon />}
                              onClick={() => handleRejectClick(invite.id)}
                              disabled={accepting === invite.id || rejectingId === invite.id}
                            >
                              {rejectingId === invite.id ? "Rejecting..." : "Reject"}
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
      >
        <DialogTitle>Reject Invitation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject this invitation? You can always ask the grant administrator to send you another one.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmReject} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
