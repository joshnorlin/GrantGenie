import { Box, Typography, Divider } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface InstitutionalRulesTabProps {
  rules: Record<string, any> | null;
}

// Helper to format field names nicely
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export function InstitutionalRulesTab({ rules }: InstitutionalRulesTabProps) {
  if (!rules || Object.keys(rules).length === 0) {
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Institutional Rules
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No institutional rules configured
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This grant does not have custom institutional rules set
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Institutional Rules
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Object.entries(rules).map(([key, val]) => {
          const isBoolean = typeof val === 'boolean';
          
          return (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {isBoolean && (
                val ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <CancelIcon color="error" fontSize="small" />
                )
              )}
              <Typography variant="body1">
                <strong>{formatFieldName(key)}:</strong> {isBoolean ? (val ? 'Yes' : 'No') : String(val)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}