import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
} from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useSupabase } from "../contexts/SessionProvider";
import { acceptInvitation } from "../utils/supabase-client-queries/invitations";

export default function Invitations() {
  const supabase = useSupabase();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchMyInvitations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user email found");

      const { data, error } = await supabase
        .from("grant_invitations")
        .select(`
          *,
          grants:grant_id (
            grant_id,
            name,
            grant_number
          )
        `)
        .eq("invited_email", user.email.toLowerCase())
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err: any) {
      console.error("Error fetching invitations:", err);
      setErrorMessage(err.message || "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInvitations();
  }, []);

  const handleAccept = async (token: string, inviteId: string) => {
    setAccepting(inviteId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await acceptInvitation(supabase, token);
      setSuccessMessage("Invitation accepted! You can now access the grant.");
      fetchMyInvitations(); // Refresh the list
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept invitation");
    } finally {
      setAccepting(null);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

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
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invite) => {
                  const expired = isExpired(invite.expires_at);
                  return (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {invite.grants?.name || "Unknown Grant"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invite.grants?.grant_number}
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
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleAccept(invite.token, invite.id)}
                            disabled={accepting === invite.id}
                          >
                            {accepting === invite.id ? "Accepting..." : "Accept"}
                          </Button>
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
