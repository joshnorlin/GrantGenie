import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import FlagIcon from "@mui/icons-material/Flag";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { LLMVerdict } from "../types/types";

interface Props {
  verdict: LLMVerdict;
}

export default function TransactionVerdictDisplay({ verdict }: Props) {
  const decision = verdict.decision || "UNKNOWN";
  const confidence = verdict.confidence_score ?? 0;

    const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "APPROVED":
        return <CheckCircleIcon sx={{ fontSize: 40 }} />;
      case "REJECTED":
        return <CancelIcon sx={{ fontSize: 40 }} />;
      case "REQUIRES_REVIEW":
        return <WarningIcon sx={{ fontSize: 40 }} />;
      default:
        return <ErrorIcon sx={{ fontSize: 40 }} />;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mt: 2,
        backgroundColor:
          decision === "APPROVED"
            ? "#e8f5e9"
            : decision === "REJECTED"
              ? "#ffebee"
              : "#fff3e0",
        borderLeft: `6px solid`,
        borderLeftColor:
          decision === "APPROVED"
            ? "#4caf50"
            : decision === "REJECTED"
              ? "#f44336"
              : "#ff9800",
      }}
    >
      {/* Header with decision */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            color:
              decision === "APPROVED"
                ? "#4caf50"
                : decision === "REJECTED"
                  ? "#f44336"
                  : "#ff9800",
          }}
        >
          {getDecisionIcon(decision)}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
            Transaction {decision}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            LLM Verification Result
          </Typography>
        </Box>
      </Box>

      {/* Confidence Score */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Confidence Score
          </Typography>
          <Chip
            label={`${Math.round(confidence * 100)}%`}
            color={confidence >= 0.8 ? "success" : confidence >= 0.6 ? "warning" : "error"}
            size="small"
            variant="outlined"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={confidence * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "#e0e0e0",
            "& .MuiLinearProgress-bar": {
              backgroundColor:
                confidence >= 0.8 ? "#4caf50" : confidence >= 0.6 ? "#ff9800" : "#f44336",
              borderRadius: 4,
            },
          }}
        />
      </Box>

      {/* Reasoning */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          Reasoning
        </Typography>
        <Alert severity={decision === "APPROVED" ? "success" : decision === "REJECTED" ? "error" : "warning"} sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {verdict.reasoning || "No reasoning provided"}
          </Typography>
        </Alert>
      </Box>

      {/* Rule Citations */}
      {verdict.rule_citations && verdict.rule_citations.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FlagIcon sx={{ fontSize: 18 }} />
              Applicable Rules
            </Box>
          </Typography>
          <List dense>
            {verdict.rule_citations.map((rule, idx) => (
              <ListItem key={idx} sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#1976d2",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={rule}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: { fontSize: "0.9rem" },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Confidence Suggestions */}
      {verdict.confidence_score_suggestions && verdict.confidence_score_suggestions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 18 }} />
              Suggestions
            </Box>
          </Typography>
          <List dense>
            {verdict.confidence_score_suggestions.map((suggestion, idx) => (
              <ListItem key={idx} sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#ff9800",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={suggestion}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: { fontSize: "0.9rem" },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}
