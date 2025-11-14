import { useState } from "react";
import { Button } from "@mui/material";
import TransactionModal from '../components/TransactionSubmitter'

export default function ParentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to open the modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <Button variant="contained" color="primary" onClick={handleOpenModal} sx={{ mt: 30 }}>
        Add Transaction
      </Button>

      <TransactionModal
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
