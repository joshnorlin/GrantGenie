import { InputAdornment, TextField } from "@mui/material";

interface PositiveIntegerInputProps {
  name: string;
  value: number | null;
  onChange: (name: string, value: number | null) => void;
}

export default function NumberInputField({
  name,
  value,
  onChange,
}: PositiveIntegerInputProps) {
  // Convert numeric value to string for display, with commas.
  const displayValue = value === null ? "" : value.toLocaleString("en-US");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    const inputWithoutCommas = raw.replace(/,/g, "");
    // Allow backspacing → empty string → null in parent
    if (inputWithoutCommas === "") {
      onChange(name, null);
      return;
    }

    // Only allow digits
    if (/^[0-9]+$/.test(inputWithoutCommas)) {
      onChange(name, Number(inputWithoutCommas)); // parent gets a number
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
        htmlInput: {
          maxlength: 12,
        },
        input: {
          inputMode: "numeric",
          startAdornment: <InputAdornment position="start">$</InputAdornment>
        },
      }}
    />
  );
}
