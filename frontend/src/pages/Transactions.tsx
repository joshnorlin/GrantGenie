import { useState, useRef } from "react";
import { Button, Box } from "@mui/material";
import TransactionModal from '../components/TransactionSubmitter';
import TransactionViewer from '../components/TransactionViewer';

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const transactionViewerRef = useRef<any>(null);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleTransactionSubmitted = async () => {
    // Refresh the transaction viewer
    if (transactionViewerRef.current?.refreshTransactions) {
      await transactionViewerRef.current.refreshTransactions();
    }
  };

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
        onTransactionSubmitted={handleTransactionSubmitted}
      />

      <TransactionViewer ref={transactionViewerRef} />
    </Box>
  );
}

