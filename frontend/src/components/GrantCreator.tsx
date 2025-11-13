import React, { useContext, useState } from "react";
import { TextField, Button, Box, Typography, CircularProgress, Alert } from "@mui/material";
import { SupabaseClient } from "@supabase/supabase-js";
import { SessionContext } from "../contexts/SessionProvider";

interface CreateGrantFormProps {
  supabase: SupabaseClient;
  onSuccess?: () => void; // optional callback for when grant is created
  createGrant: (client: SupabaseClient, grantData: { name: string; grant_number: string; session: any }) => Promise<void>;
}

export const CreateGrantForm: React.FC<CreateGrantFormProps> = ({ supabase, createGrant, onSuccess }) => {
  const session = useContext(SessionContext);
  const [name, setName] = useState("");
  const [GrantNumber, setGrantNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createGrant(supabase, {
        name,
        grant_number: GrantNumber,
        session
      });
      setSuccess(true);
      setName("");
      setGrantNumber("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error creating grant:", err);
      setError(err.message || "Failed to create grant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 400,
        mx: "auto",
        mt: 4,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h5" textAlign="center">
        Create a New Grant
      </Typography>

      <TextField
        label="Grant Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
      />

      <TextField
        label="Grant / Award Number"
        value={GrantNumber}
        onChange={(e) => setGrantNumber(e.target.value)}
        fullWidth
      />

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Grant created successfully!</Alert>}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        sx={{ mt: 1 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Submit"}
      </Button>
    </Box>
  );
};
