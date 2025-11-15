import { Box, Typography } from "@mui/material";
import { budgetCategories } from "../constants/constants";
import React from "react";
import NumberField from "./NumberField";

export const BudgetEntryModal: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4">Budget Entry</Typography>
      <Typography variant="body1">Enter your budget details below:</Typography>
      <Box>
        {budgetCategories.map((category) => (
          <Box key={category.category}>
            <Typography>{category.category}:</Typography>
            <NumberField 
              label="Amount"
              min={0}
              max={10000000}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}