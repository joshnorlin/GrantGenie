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
import { GrantDetailsModal } from "./GrantDetailsModal";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSupabase } from "../contexts/SessionProvider";

interface GrantViewerProps {
  selectGrants: (client: SupabaseClient) => Promise<any[]>;
  refreshTrigger?: number;
}

export function GrantViewer({ selectGrants, refreshTrigger = 0 }: GrantViewerProps) {
  const supabase = useSupabase();
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrant, setSelectedGrant] = useState<any | null>(null);

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
  }, [selectGrants]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants, refreshTrigger]);

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
