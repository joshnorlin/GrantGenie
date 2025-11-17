import { useState, useCallback } from "react";
import { GrantViewer } from "../components/GrantViewer";
import { CreateGrantForm } from "../components/GrantCreator";
import Box from "@mui/material/Box";
import { insertGrant } from "../utils/supabase-client-queries/grants";
import { selectGrants } from "../utils/supabase-client-queries/grants";

export default function Grants() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGrantCreated = useCallback(() => {
    // Increment to trigger a refetch in GrantViewer
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <CreateGrantForm
        insertGrant={insertGrant}
        onSuccess={handleGrantCreated}
      />
      <GrantViewer 
        selectGrants={selectGrants}
        refreshTrigger={refreshTrigger} 
      />
    </Box>
  );
}
