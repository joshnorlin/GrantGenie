import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";

interface Props {
  transaction: any;
}

export default function TransactionDetailsDisplay({ transaction }: Props) {
  // Fields to display (exclude internal/technical fields)
  const fieldsToDisplay = [
    { key: "amount", label: "Amount", format: (v: any) => `$${Number(v).toFixed(2)}` },
    { key: "description", label: "Description" },
    {
      key: "status",
      label: "Status",
      format: (v: any) => (
        <Chip
          label={v || "PENDING"}
          color={
            v === "APPROVED"
              ? "success"
              : v === "REJECTED"
                ? "error"
                : "warning"
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    { key: "created_at", label: "Created", format: (v: any) => new Date(v).toLocaleString() },
    { key: "updated_at", label: "Updated", format: (v: any) => new Date(v).toLocaleString() },
  ];

  return (
    <Paper elevation={0} sx={{ p: 2, backgroundColor: "#fafafa", borderRadius: 2 }}>
      <Table size="small">
        <TableBody>
          {fieldsToDisplay.map(({ key, label, format }) => {
            const value = transaction[key];
            if (value === undefined || value === null) return null;

            return (
              <TableRow key={key}>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    width: "35%",
                    color: "#555",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  {label}
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                  {format ? format(value) : String(value)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
