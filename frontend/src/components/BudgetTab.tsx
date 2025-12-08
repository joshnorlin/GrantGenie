import { Box, Typography, Divider, List, ListItem, ListItemText, Button } from "@mui/material";

interface BudgetTabProps {
  budgetItems: any[];
  onAddBudget: () => void;
  onEditBudget: () => void;
}

export function BudgetTab({ budgetItems, onAddBudget, onEditBudget }: BudgetTabProps) {
  return (
    <Box>
      <Typography variant="h6">Budget Line Items</Typography>
      <Divider sx={{ mb: 2 }} />
      
      {budgetItems.length === 0 ? (
        <>
          <Typography>No budget items found.</Typography>
          <Button variant="contained" onClick={onAddBudget} sx={{ mt: 2 }}>
            Add Budget
          </Button>
        </>
      ) : (
        <>
          <Button variant="contained" onClick={onEditBudget} sx={{ mb: 2 }}>
            Edit Budget
          </Button>
          <List dense>
            {budgetItems.map((item, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={`${item.category_lookup?.category || "Uncategorized"} — $${Number(
                    item.amount
                  ).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
}