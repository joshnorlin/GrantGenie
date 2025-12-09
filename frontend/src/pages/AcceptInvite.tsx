import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useSupabase } from "../contexts/SessionProvider";
import { validateInvitation, acceptInvitation } from "../utils/supabase-client-queries/invitations";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [valid, setValid] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const data = await validateInvitation(token);
        setInvite(data.invite);
        setValid(data.valid);
        setExpired(data.expired);
      } catch (err: any) {
        setError(err.message || "Failed to validate invitation");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError("");

    try {
      await acceptInvitation(supabase, token);
      setAccepted(true);
      setTimeout(() => {
        navigate("/grants");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          {accepted ? (
            <Box sx={{ textAlign: "center" }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Invitation Accepted!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You've been added to the grant. Redirecting to your grants...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center" }}>
              <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Invitation Error
              </Typography>
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            </Box>
          ) : expired ? (
            <Box sx={{ textAlign: "center" }}>
              <ErrorIcon color="warning" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Invitation Expired
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This invitation link has expired. Please request a new invitation from the grant administrator.
              </Typography>
            </Box>
          ) : valid && invite ? (
            <Box>
              <Typography variant="h5" gutterBottom>
                Grant Invitation
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You've been invited to join a grant:
              </Typography>
              <Box sx={{ bgcolor: "action.hover", p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Email: <strong>{invite.invited_email}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invited: {new Date(invite.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? "Accepting..." : "Accept Invitation"}
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center" }}>
              <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Invalid Invitation
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This invitation link is not valid. It may have already been used or revoked.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
