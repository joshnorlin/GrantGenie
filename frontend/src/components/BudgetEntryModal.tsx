import { Box, Typography } from "@mui/material";
import { budgetCategories } from "../constants/categories";
import React from "react";
import NumberInputField from "./NumberInputField";

type AmountValue = number | "";

export const BudgetEntryModal: React.FC = () => {
  const initialAmounts: Record<string, AmountValue> = React.useMemo(() => {
    return Object.fromEntries(
      budgetCategories.map((category) => [`category${category.category_id}`, ""])
    );
  }, []);

  const [amounts, setAmounts] = React.useState<Record<string, AmountValue>>(initialAmounts);

  const handleChange = (name: string, value: number | null) => {
    setAmounts((prev) => ({
      ...prev,
      [name]: value === null ? "" : value
    }));
  } 

  /*
    TO DO LIST:
      - add separate amount states for each category, is it really going to be amount1 - amount15?
      - think about WHEN and WHERE this modal is going to pop up? i think it should be immediately prompted when a PI creates a grant,
        and should be editable by PIs in the grant management tab.
      - connect the "insert grant budget items" supabase functions to this component.
  */

  return (
    <Box>
      <Typography variant="h4">Budget Entry</Typography>
      <Typography variant="body1">Enter your budget details below:</Typography>
      <Box>
        {budgetCategories.map((category) => {
          const name = `category${category.category_id}`;
          return (
            <Box key={category.category}>
              <Typography>{category.category}:</Typography>
              <NumberInputField
                name={`category${category.category_id}`}
                value={amounts[name] === "" ? null : amounts[name]}
                onChange={handleChange}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}