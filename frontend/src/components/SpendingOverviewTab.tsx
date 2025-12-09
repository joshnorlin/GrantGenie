import { useState, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Divider, 
  Paper, 
  Stack, 
  LinearProgress, 
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Alert
} from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import SortIcon from '@mui/icons-material/Sort';

interface SpendingOverviewTabProps {
  totalBudget: number;
  totalSpent: number;
  transactions: any[];
}

export function SpendingOverviewTab({ totalBudget, totalSpent, transactions }: SpendingOverviewTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const percentUsed = totalBudget ? +((totalSpent / totalBudget) * 100).toFixed(1) : 0;
  const remaining = totalBudget - totalSpent;

  // Get unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category_lookup?.category) {
        cats.add(t.category_lookup.category);
      }
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Calculate spending by category
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.category_lookup?.category) {
        const cat = t.category_lookup.category;
        spending[cat] = (spending[cat] || 0) + Number(t.amount || 0);
      }
    });
    return Object.entries(spending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category_lookup?.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Sort
    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "amount-high") {
      filtered.sort((a, b) => Number(b.amount) - Number(a.amount));
    } else if (sortBy === "amount-low") {
      filtered.sort((a, b) => Number(a.amount) - Number(b.amount));
    } else if (sortBy === "category") {
      filtered.sort((a, b) => {
        const catA = a.category_lookup?.category || "";
        const catB = b.category_lookup?.category || "";
        return catA.localeCompare(catB);
      });
    }

    return filtered;
  }, [transactions, categoryFilter, sortBy, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "success";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircleIcon fontSize="small" />;
      case "pending": return <PendingIcon fontSize="small" />;
      case "rejected": return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Spending Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitor your grant spending and track all transactions
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Budget Alert */}
      {percentUsed > 90 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Budget Alert:</strong> You've used {percentUsed}% of your total budget. Consider reviewing your spending.
        </Alert>
      )}
      
      {/* Budget Summary Cards */}
      <Box sx={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 2,
        mb: 3 
      }}>
        <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: "primary.main" }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AccountBalanceWalletIcon color="primary" fontSize="small" />
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
              Total Budget
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="bold">
            ${totalBudget.toLocaleString()}
          </Typography>
        </Paper>
        
        <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: percentUsed > 90 ? "error.main" : "success.main" }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <TrendingUpIcon color={percentUsed > 90 ? "error" : "success"} fontSize="small" />
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
              Total Spent
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="bold">
            ${totalSpent.toLocaleString()}
          </Typography>
          <Typography variant="caption" color={percentUsed > 90 ? "error.main" : "success.main"}>
            {percentUsed}% used
          </Typography>
        </Paper>
        
        <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: remaining < 0 ? "error.main" : "info.main" }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
              Remaining
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="bold" color={remaining < 0 ? "error.main" : "text.primary"}>
            ${remaining.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transactions.length} transactions
          </Typography>
        </Paper>
      </Box>
      
      {/* Progress Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" fontWeight="bold">
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
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Paper>

      {/* Spending by Category */}
      {categorySpending.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Spending by Category
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 1.5
          }}>
            {categorySpending.map(({ category, amount }) => {
              const percent = totalBudget ? ((amount / totalBudget) * 100).toFixed(1) : 0;
              return (
                <Card key={category} variant="outlined" sx={{ bgcolor: "background.default" }}>
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {category}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      ${amount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {percent}% of budget
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}
      
      {/* Transactions Section */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Transactions ({filteredTransactions.length})
          </Typography>
        </Box>
        
        {/* Filters and Sorting */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SortIcon fontSize="small" color="action" />
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(_, value) => value && setSortBy(value)}
              size="small"
            >
              <ToggleButton value="date">Date</ToggleButton>
              <ToggleButton value="amount-high">$ High</ToggleButton>
              <ToggleButton value="amount-low">$ Low</ToggleButton>
              <ToggleButton value="category">Category</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
        {filteredTransactions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              {transactions.length === 0 ? "No transactions recorded yet" : "No transactions match your filters"}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {filteredTransactions.map((t) => (
              <Paper key={t.transaction_id} elevation={1} sx={{ p: 1.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {t.category_lookup?.category || "Uncategorized"}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(t.created_at).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        {...(getStatusIcon(t.status) && { icon: getStatusIcon(t.status)! })}
                        label={t.status || "pending"}
                        size="small"
                        color={getStatusColor(t.status)}
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                      {t.human_verified && (
                        <Chip 
                          label="Human Verified" 
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      )}
                      {t.confidence_score && (
                        <Typography variant="caption" color="text.secondary">
                          {Number(t.confidence_score).toFixed(0)}% confidence
                        </Typography>
                      )}
                    </Box>
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