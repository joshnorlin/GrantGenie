import { InputAdornment, TextField } from "@mui/material";

interface PositiveIntegerInputProps {
  value: number | null;
  onChange: (value: number | null) => void;

}

export default function NumberInputField({
  value,
  onChange,
}: PositiveIntegerInputProps) {
  // Convert numeric value to string for display.
  const displayValue = value === null ? "" : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;

    // Allow backspacing → empty string → null in parent
    if (next === "") {
      onChange(null);
      return;
    }

    // Only allow digits
    if (/^[0-9]+$/.test(next)) {
      onChange(Number(next)); // parent gets a number
    }

    // If invalid ("-", "+", "e", letters), do nothing
  };

  return (
    <TextField
      id="outlined-start-adornment"
      value={displayValue}
      onChange={handleChange}
      size="small"
      slotProps={{
        input: {
          inputMode: "numeric",
          startAdornment: <InputAdornment position="start">$</InputAdornment>
        },
      }}
    />
  );
}
