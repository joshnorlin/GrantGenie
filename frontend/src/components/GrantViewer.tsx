import { useEffect, useState, useRef } from "react";
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
  const prevTriggerRef = useRef(refreshTrigger);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch on mount or when refreshTrigger actually changes
    if (!hasFetchedRef.current) {
      // First mount - use cache if available
      fetchGrants(supabase, false);
      hasFetchedRef.current = true;
      prevTriggerRef.current = refreshTrigger;
    } else if (refreshTrigger !== prevTriggerRef.current) {
      // Trigger changed - force refresh
      fetchGrants(supabase, true);
      prevTriggerRef.current = refreshTrigger;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); // Only depend on refreshTrigger

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
