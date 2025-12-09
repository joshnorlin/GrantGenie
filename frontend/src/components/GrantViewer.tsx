import { useEffect, useState, useCallback } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import { GrantDetailsModal } from "./GrantDetailsModal";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSupabase } from "../contexts/SessionProvider";
import { useDataCache } from "../contexts/DataCacheProvider";

interface GrantViewerProps {
  refreshTrigger?: number;
  onGrantDeleted?: () => void;
}

export function GrantViewer({ refreshTrigger = 0, onGrantDeleted }: GrantViewerProps) {
  const supabase = useSupabase();
  const { grants, loading, error, fetchGrants } = useDataCache();
  const [selectedGrant, setSelectedGrant] = useState<any | null>(null);

  useEffect(() => {
    // Force refresh when refreshTrigger changes (e.g., after creating/deleting)
    const forceRefresh = refreshTrigger > 0;
    fetchGrants(supabase, forceRefresh);
  }, [supabase, fetchGrants, refreshTrigger]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
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
        onGrantDeleted={onGrantDeleted}
      />
    </Paper>
  );
}
