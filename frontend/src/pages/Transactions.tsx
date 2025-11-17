import { useState } from "react";
import { Button, Box } from "@mui/material";
import TransactionModal from '../components/TransactionSubmitter';
import TransactionViewer from '../components/TransactionViewer';

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ mt: 5, gap: 4 }}
    >
      <Button variant="contained" color="primary" onClick={handleOpenModal}>
        Add Transaction
      </Button>

      <TransactionModal
        open={isModalOpen}
        onClose={handleCloseModal}
      />

      <TransactionViewer />
    </Box>
  );
}

