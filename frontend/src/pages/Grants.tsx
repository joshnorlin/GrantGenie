import { useState, useCallback } from "react";
import { GrantViewer } from "../components/GrantViewer";
import MultiStepGrantCreator from "../components/MultiStepGrantCreator";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSupabase } from "../contexts/SessionProvider";

export default function Grants() {
  const supabase = useSupabase();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleGrantCreated = useCallback(() => {
    // Increment to trigger a refetch in GrantViewer
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleGrantDeleted = useCallback(() => {
    // Increment to trigger a refetch in GrantViewer after deletion
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Grant
        </Button>
      </Box>

      <GrantViewer 
        refreshTrigger={refreshTrigger}
        onGrantDeleted={handleGrantDeleted}
      />

      <MultiStepGrantCreator
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleGrantCreated}
        supabase={supabase}
      />
    </Box>
  );
}
