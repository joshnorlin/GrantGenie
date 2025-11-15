import { Box, Typography } from "@mui/material";
import { budgetCategories } from "../constants/constants";
import React from "react";
import NumberInputField from "./NumberInputField";

export const BudgetEntryModal: React.FC = () => {
  const [amount, setAmount] = React.useState<number | null>(null);

  /*
    TO DO LIST:
      - add separate amount states for each category, is it really going to be amount1 - amount15?
      - think about WHEN and WHERE this modal is going to pop up? i think it should be immediately prompted when a PI creates a grant,
        and should be editable by PIs in the grant management tab.
  */

  return (
    <Box>
      <Typography variant="h4">Budget Entry</Typography>
      <Typography variant="body1">Enter your budget details below:</Typography>
      <Box>
        {budgetCategories.map((category) => (
          <Box key={category.category}>
            <Typography>{category.category}:</Typography>
            <NumberInputField
              value={amount}
              onChange={setAmount}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}