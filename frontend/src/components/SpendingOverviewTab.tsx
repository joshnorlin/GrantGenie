import { Box, Typography, Divider, List, ListItem, ListItemText } from "@mui/material";

interface SpendingOverviewTabProps {
  totalBudget: number;
  totalSpent: number;
  transactions: any[];
}

export function SpendingOverviewTab({ totalBudget, totalSpent, transactions }: SpendingOverviewTabProps) {
  const percentUsed = totalBudget ? +((totalSpent / totalBudget) * 100).toFixed(1) : 0;

  return (
    <Box>
      <Typography variant="h6">Spending Overview</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Typography>Total Budget: ${totalBudget.toLocaleString()}</Typography>
      <Typography>Total Spent: ${totalSpent.toLocaleString()}</Typography>
      <Typography color={percentUsed > 90 ? "error" : "success.main"}>
        {percentUsed}% of budget used
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1">Recent Transactions</Typography>
      {transactions.length === 0 ? (
        <Typography>No transactions recorded.</Typography>
      ) : (
        <List dense>
          {transactions.map((t, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={t.description || "(No description)"}
                secondary={`${new Date(t.created_at).toLocaleDateString()} — $${t.amount}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}