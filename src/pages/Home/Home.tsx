import React, { useState, useMemo } from "react";
import { BillForm, CardList, PrimarySearchAppBar } from "./components";
import { Box, Stack } from "@mui/material";
import { ToastContainer } from "react-toastify";

const Home: React.FC = React.memo(() => {
  const [updateCards, setUpdateCards] = useState<boolean>(true);

  // Memoizar los estilos para evitar re-creaciones
  const containerStyles = useMemo(() => ({
    width: "100%", 
    mb: { xs: 2, md: 5 }, 
    mt: { xs: 1, md: 3 }, 
    p: { xs: 1, md: 2 },
    minHeight: '100vh',
    backgroundColor: 'background.default'
  }), []);

  const boxStyles = useMemo(() => ({
    width: "100%", 
    maxWidth: { xs: "95%", sm: "90%", md: "80%" },
    '@media (max-width:600px)': {
      maxWidth: "100%"
    }
  }), []);

  return (
    <>
      <PrimarySearchAppBar />
      <ToastContainer />
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={{ xs: 2, md: 4 }}
        sx={containerStyles}
      >
        <Box sx={boxStyles}>
          <BillForm 
            updateCards={updateCards} 
            setUpdateCards={setUpdateCards} 
          />
        </Box>
        <Box sx={boxStyles}>
          <CardList 
            updateCards={updateCards} 
            setUpdateCards={setUpdateCards} 
          />
        </Box>
      </Stack>
    </>
  );
});

Home.displayName = 'Home';

export default Home;
