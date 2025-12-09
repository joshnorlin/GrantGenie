import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Collapse,
  Box,
} from "@mui/material";
import { useSupabase } from "../contexts/SessionProvider";
import { updateTransactionStatus } from "../utils/supabase-client-queries/transactions";
import { useDataCache } from "../contexts/DataCacheProvider";

export default function TransactionViewer() {
  const supabase = useSupabase();
  const { grants, transactions, loading, fetchGrants, fetchTransactions, invalidateCache } = useDataCache();

  // Which transaction is expanded?
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  useEffect(() => {
    fetchGrants(supabase);
    fetchTransactions(supabase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Group transactions by grant
  const transactionsByGrant = transactions.reduce(
    (acc: Record<number, any[]>, t: any) => {
      if (!acc[t.grant_id]) acc[t.grant_id] = [];
      acc[t.grant_id].push(t);
      return acc;
    },
    {}
  );

  const handleApprove = async (transactionId: number) => {
    try {
      await updateTransactionStatus(supabase, transactionId, "APPROVED");
      invalidateCache();
      await fetchTransactions(supabase, true);
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };
  
  const handleReject = async (transactionId: number) => {
    try {
      await updateTransactionStatus(supabase, transactionId, "REJECTED");
      invalidateCache();
      await fetchTransactions(supabase, true);
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

  return (
    <Paper elevation={3} sx={{ mt: 4, p: 3, width: "80%" }}>
      <Typography variant="h6" gutterBottom>
        All Transactions (Table View)
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      ) : grants.length === 0 ? (
        <Typography>No grants found.</Typography>
      ) : (
        grants.map((grant) => {
          const grantTransactions = transactionsByGrant[grant.grant_id] || [];

          return (
            <div key={grant.grant_id} style={{ marginBottom: 20 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                {grant.name} (Grant #{grant.grant_number})
              </Typography>

              <Divider sx={{ mb: 1 }} />

              {grantTransactions.length === 0 ? (
                <Typography>No transactions yet.</Typography>
              ) : (
                <List dense>
                  {grantTransactions.map((t) => {
                    const isOpen = expanded === t.transaction_id;

                    return (
                      <div key={t.transaction_id}>
                        {/* CLICKABLE BUTTON */}
                        <ListItem sx={{ p: 0, mb: 1, display: "flex", gap: 1 }}>
                          {/* Main Dropdown Button */}
                          <Button
                            variant="contained"
                            color={isOpen ? "secondary" : "primary"}
                            onClick={() => toggleExpand(t.transaction_id)}
                            sx={{
                              flexGrow: 1,
                              justifyContent: "space-between",
                              textTransform: "none",
                              fontWeight: "bold",
                              borderRadius: 2,
                              py: 1.2,
                            }}
                          >
                            Transaction #{t.transaction_id} — ${t.amount}
                            <span>{isOpen ? "▲" : "▼"}</span>
                          </Button>

                          {/* Status or Review Buttons */}
                          {t.status === "REQUIRES_REVIEW" ? (
                            <>
                              {/* Approve */}
                              <Button
                                variant="contained"
                                color="success"
                                sx={{ minWidth: 50 }}
                                onClick={() => handleApprove(t.transaction_id)}
                              >
                                ✔
                              </Button>

                              {/* Reject */}
                              <Button
                                variant="contained"
                                color="error"
                                sx={{ minWidth: 50 }}
                                onClick={() => handleReject(t.transaction_id)}
                              >
                                ✖
                              </Button>
                            </>
                          ) : (
                            // Otherwise show status text
                            <Typography
                              sx={{
                                minWidth: 120,
                                textAlign: "center",
                                fontWeight: "bold",
                                p: 1,
                                borderRadius: 1,
                                color: "white", // text color
                                backgroundColor: (() => {
                                  switch (t.status?.toUpperCase()) {
                                    case "APPROVED":
                                      return "success.main";
                                    case "REJECTED":
                                      return "error.main";
                                    default:
                                      return "warning.main"; // pending or other
                                  }
                                })(),
                              }}
                            >
                              {t.status || "PENDING"}
                            </Typography>
                          )}
                        </ListItem>

                        {/* EXPAND/COLLAPSE TABLE */}
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Paper
                            elevation={1}
                            sx={{ p: 2, mb: 2, backgroundColor: "#fafafa" }}
                          >
                            <Table size="small">
                              <TableBody>
                                {Object.entries(t).map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell
                                      sx={{
                                        fontWeight: "bold",
                                        width: "30%",
                                      }}
                                    >
                                      {key}
                                    </TableCell>
                                    <TableCell>
                                      {typeof value === "string" &&
                                      value.startsWith("20")
                                        ? new Date(value).toLocaleString()
                                        : String(value)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Paper>
                        </Collapse>
                      </div>
                    );
                  })}
                </List>
              )}
            </div>
          );
        })
      )}
    </Paper>
  );
}
