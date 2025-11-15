import { Box, Typography } from "@mui/material";
import { budgetCategories } from "../constants/constants";
import React from "react";
import NumberInputField from "./NumberInputField";

export const BudgetEntryModal: React.FC = () => {
  const [amount, setAmount] = React.useState<number | null>(null);

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