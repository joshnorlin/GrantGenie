import { Box, Typography, Divider, Button, Paper, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

interface BudgetTabProps {
  budgetItems: any[];
  onAddBudget: () => void;
  onEditBudget: () => void;
}

// Group categories by super category
const categoryGroups = {
  "Personnel": [1, 2, 11], // Salaries, Fringe, Tuition
  "Travel": [4, 5], // Domestic, International
  "Materials & Equipment": [3, 6], // Equipment, Materials & Supplies
  "Services & Collaboration": [8, 9], // Consultants, Subawards
  "Participant Support": [7], // Participant Support
  "Other Costs": [10, 12, 13], // Publication, Computer, Other
  "Indirect Costs": [14, 15] // F&A, Unallowable
};

export function BudgetTab({ budgetItems, onAddBudget, onEditBudget }: BudgetTabProps) {
  const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  // Create a map for quick category lookup
  const budgetMap = new Map();
  budgetItems.forEach(item => {
    if (item.category_id) {
      budgetMap.set(item.category_id, item);
    }
  });
  
  return (
    <Box>
      {budgetItems.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budget items found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by adding your grant budget breakdown
          </Typography>
          <Button
            variant="contained" 
            size="large"
            onClick={onAddBudget}
            startIcon={<AddIcon />}
          >
            Add Budget
          </Button>
        </Box>
      ) : (
        <>
          {/* Header with Total and Edit Button */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Budget Overview
              </Typography>
              <Typography variant="h3" color="primary" fontWeight="bold" sx={{ mt: 0.5 }}>
                ${totalBudget.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Budget
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              size="large"
              onClick={onEditBudget}
              startIcon={<EditIcon />}
            >
              Edit Budget
            </Button>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* Budget Items Grouped by Super Category */}
          <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 2,
          }}>
            {Object.entries(categoryGroups).map(([groupName, categoryIds]) => {
              // Get items for this group
              const groupItems = categoryIds
                .map(id => budgetMap.get(id))
                .filter(Boolean);
              
              if (groupItems.length === 0) return null;
              
              const groupTotal = groupItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
              const groupPercentage = totalBudget > 0 ? ((groupTotal / totalBudget) * 100).toFixed(1) : 0;
              
              return (
                <Paper key={groupName} elevation={1} sx={{ p: 2 }}>
                    {/* Group Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        {groupName}
                      </Typography>
                      <Box textAlign="right">
                        <Typography variant="body1" fontWeight="bold">
                          ${groupTotal.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {groupPercentage}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 1 }} />
                    
                    {/* Category Items - Compact List */}
                    <Stack spacing={0.5}>
                      {groupItems.map((item, idx) => {
                        const amount = Number(item.amount || 0);
                        const percentage = totalBudget > 0 ? ((amount / totalBudget) * 100).toFixed(1) : 0;
                        
                        return (
                          <Box 
                            key={idx}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 0.5,
                              px: 1,
                              bgcolor: "background.default",
                              borderRadius: 0.5,
                              borderLeft: 2,
                              borderColor: "primary.light",
                            }}
                          >
                            <Box flex={1} minWidth={0}>
                              <Typography variant="body2" fontWeight="medium" noWrap>
                                {item.category_lookup?.category || "Uncategorized"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                {percentage}%
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ ml: 1.5, whiteSpace: "nowrap" }}>
                              ${amount.toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}