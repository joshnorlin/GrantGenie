import { Box, Typography, Divider, List, ListItem, ListItemText } from "@mui/material";

interface InstitutionalRulesTabProps {
  rules: Record<string, any> | null;
}

export function InstitutionalRulesTab({ rules }: InstitutionalRulesTabProps) {
  return (
    <Box>
      <Typography variant="h6">Institutional Rules</Typography>
      <Divider sx={{ mb: 2 }} />
      
      {rules ? (
        <List dense>
          {Object.entries(rules).map(([key, val]) => (
            <ListItem key={key}>
              <ListItemText primary={key} secondary={String(val)} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography>No institutional rules found.</Typography>
      )}
    </Box>
  );
}