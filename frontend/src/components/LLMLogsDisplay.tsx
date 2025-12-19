import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";

interface Props {
  logs: any[];
}

const formatKey = (key: string): string => {
  // Convert snake_case to Title Case and handle camelCase
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

export default function LLMLogsDisplay({ logs }: Props) {
  if (!logs || logs.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="body2" color="textSecondary">
          No logs available for this transaction.
        </Typography>
      </Paper>
    );
  }

  const parseLogContent = (logText: string): any => {
    try {
      return JSON.parse(logText);
    } catch {
      return { message: logText };
    }
  };

  const getLogType = (logText: string): "error" | "warning" | "info" => {
    const lower = logText.toLowerCase();
    if (lower.includes("error") || lower.includes("failed")) return "error";
    if (lower.includes("warn") || lower.includes("caution")) return "warning";
    return "info";
  };

  const getLogIcon = (type: "error" | "warning" | "info") => {
    switch (type) {
      case "error":
        return <ErrorIcon sx={{ fontSize: 18, mr: 1 }} />;
      case "warning":
        return <WarningIcon sx={{ fontSize: 18, mr: 1 }} />;
      default:
        return <InfoIcon sx={{ fontSize: 18, mr: 1 }} />;
    }
  };

  const getLogColor = (type: "error" | "warning" | "info"): any => {
    switch (type) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  const renderLogContent = (content: any) => {
    if (typeof content === "string") {
      return (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {content}
        </Typography>
      );
    }

    if (typeof content === "object" && content !== null) {
      // Render as a formatted table for objects
      return (
        <Table size="small" sx={{ mt: 1 }}>
          <TableBody>
            {Object.entries(content).map(([key, value]) => (
              <TableRow key={key} sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    width: "25%",
                    fontSize: "0.85rem",
                    padding: "6px 8px",
                    color: "#666",
                  }}
                >
                  {formatKey(key)}
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem", padding: "6px 8px" }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {formatValue(value)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return <Typography variant="body2">{String(content)}</Typography>;
  };

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: "#fafafa", borderRadius: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {logs.map((log, idx) => {
          const logType = getLogType(log.log);
          const timestamp = new Date(log.created_at);
          const parsedContent = parseLogContent(log.log);

          return (
            <Box key={log.log_id || idx} sx={{ mb: idx < logs.length - 1 ? 2 : 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {getLogIcon(logType)}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                  {timestamp.toLocaleString()}
                </Typography>
                <Chip
                  label={logType.toUpperCase()}
                  size="small"
                  color={getLogColor(logType)}
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              </Box>
              <Alert severity={logType} sx={{ py: 1, "& .MuiAlert-message": { width: "100%" } }}>
                {renderLogContent(parsedContent)}
              </Alert>
              {idx < logs.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
