import { useEffect, useState, useCallback } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
  Paper,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { selectGrants } from "../utils/supabase-client-queries/grants";
import { GrantDetailsModal } from "./GrantDetailsModal";
import { CreateGrantForm } from "./GrantCreator"; // assuming you have this

export function GrantViewer() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<any | null>(null);

  // 1️⃣ Wrap fetchGrants in useCallback so it can be passed around
  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await selectGrants(supabase);
      setGrants(data || []);
    } catch (err: any) {
      console.error("Error fetching grants:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2️⃣ Fetch grants on mount
  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Typography color="error" variant="body1">
        Error loading grants: {error}
      </Typography>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: 16 }}>
      <Typography variant="h6" gutterBottom>
        Your Grants
      </Typography>

      {/* 3️⃣ Include the create form and pass fetchGrants as onSuccess */}
      <CreateGrantForm
        supabase={supabase}
        createGrant={async (client, grantData) => {
          await client.from("grants").insert(grantData).select();
        }}
        onSuccess={fetchGrants} // refresh the list after creation
      />

      <List>
        {grants.map((grant) => (
          <ListItem key={grant.grant_id} disablePadding>
            <ListItemButton onClick={() => setSelectedGrant(grant)}>
              <ListItemText
                primary={grant.name}
                secondary={`Grant #${
                  grant.grant_number || "N/A"
                } — Created ${new Date(grant.created_at).toLocaleDateString()}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <GrantDetailsModal
        open={!!selectedGrant}
        onClose={() => setSelectedGrant(null)}
        grant={selectedGrant}
        supabase={supabase}
      />
    </Paper>
  );
}
