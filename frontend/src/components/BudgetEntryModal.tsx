import { Box, InputAdornment, Typography } from "@mui/material";
import { budgetCategories } from "../constants/constants";
import React from "react";

export const BudgetEntryModal: React.FC = () => {

  const [category, setCategory] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  return (
    <Box>
      <Typography variant="h4">Budget Entry</Typography>
      <Typography variant="body1">Enter your budget details below:</Typography>
      <Box>
        {budgetCategories.map((category) => (
          <Box>
            <Typography>{category.category}:</Typography>
            <NumberField
              label="Amount"
              id="outlined-start-adornment"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}