import { Box, Typography, Divider, Paper, Stack, LinearProgress, Chip } from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface SpendingOverviewTabProps {
  totalBudget: number;
  totalSpent: number;
  transactions: any[];
}

export function SpendingOverviewTab({ totalBudget, totalSpent, transactions }: SpendingOverviewTabProps) {
  const percentUsed = totalBudget ? +((totalSpent / totalBudget) * 100).toFixed(1) : 0;
  const remaining = totalBudget - totalSpent;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Spending Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track your grant budget usage and transactions
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Budget Summary Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={{ flex: "1 1 calc(33.333% - 14px)", minWidth: "250px" }}>
          <Paper elevation={1} sx={{ p: 2.5, borderLeft: 4, borderColor: "primary.main" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AccountBalanceWalletIcon color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Total Budget
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              ${totalBudget.toLocaleString()}
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: "1 1 calc(33.333% - 14px)", minWidth: "250px" }}>
          <Paper elevation={1} sx={{ p: 2.5, borderLeft: 4, borderColor: percentUsed > 90 ? "error.main" : "success.main" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <TrendingUpIcon color={percentUsed > 90 ? "error" : "success"} />
              <Typography variant="subtitle2" color="text.secondary">
                Total Spent
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              ${totalSpent.toLocaleString()}
            </Typography>
            <Typography variant="caption" color={percentUsed > 90 ? "error.main" : "success.main"}>
              {percentUsed}% used
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ flex: "1 1 calc(33.333% - 14px)", minWidth: "250px" }}>
          <Paper elevation={1} sx={{ p: 2.5, borderLeft: 4, borderColor: remaining < 0 ? "error.main" : "info.main" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Remaining
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color={remaining < 0 ? "error.main" : "text.primary"}>
              ${remaining.toLocaleString()}
            </Typography>
          </Paper>
        </Box>
      </Box>
      
      {/* Progress Bar */}
      <Paper elevation={1} sx={{ p: 2.5, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight="bold">
            Budget Usage
          </Typography>
          <Chip 
            label={`${percentUsed}%`}
            color={percentUsed > 90 ? "error" : percentUsed > 75 ? "warning" : "success"}
            size="small"
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(percentUsed, 100)} 
          color={percentUsed > 90 ? "error" : percentUsed > 75 ? "warning" : "success"}
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Paper>
      
      {/* Transactions List */}
      <Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Recent Transactions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {transactions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No transactions recorded yet
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {transactions.map((t, i) => (
              <Paper key={i} elevation={1} sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body1" fontWeight="medium" noWrap>
                      {t.description || "(No description)"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(t.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ whiteSpace: "nowrap" }}>
                    ${Number(t.amount).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}