import { Box, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box p={3}>
      <Typography variant="h4" >
        Grant Genie
      </Typography>
      <Typography variant="h6" gutterBottom>
        We help grant your financial wishes.
      </Typography>
      <img 
        src="/FaS6ji4.png" 
        alt="Grant Genie Logo" 
        style={{ width: 200, borderRadius: 8 }}
      />
      <Typography variant="h6" >
        About Us:
      </Typography>
      <Typography paragraph>
        This project was created as part of the curriculum for CS 3600 (Database Systems), a class at the University of
        Idaho. Its goal is to allow principle investigators (PIs) to
        manage federally-awarded research grants in compliance with both federal
        and institutional rules. There will be a large focus on key aspects such as regulation
        enforcements, user authentication, and transaction approval. Grant Genie aims to be a fully functional platform in which
        users can enter, validate, and view grant transactions, as well as
        create and export grant budgets to aid with compliance and auditing.
      </Typography>

    </Box>
  );
}
