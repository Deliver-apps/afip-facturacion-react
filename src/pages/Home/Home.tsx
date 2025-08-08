"use client";
import React, { useState } from "react";
import { BillForm, CardList, PrimarySearchAppBar } from "./components";
import { Box, Stack } from "@mui/material";
import { ToastContainer } from "react-toastify";

const Home: React.FC = () => {
  const [updateCards, setUpdateCards] = useState<boolean>(true);
  return (
    <>
      <PrimarySearchAppBar />
      <ToastContainer />
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={{ xs: 2, md: 4 }}
        sx={{ 
          width: "100%", 
          mb: { xs: 2, md: 5 }, 
          mt: { xs: 1, md: 3 }, 
          p: { xs: 1, md: 2 },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Box sx={{ 
          width: "100%", 
          maxWidth: { xs: "95%", sm: "90%", md: "80%" },
          '@media (max-width:600px)': {
            maxWidth: "100%"
          }
        }}>
          <BillForm updateCards={updateCards} setUpdateCards={setUpdateCards} />
        </Box>
        <Box sx={{ 
          width: "100%", 
          maxWidth: { xs: "95%", sm: "90%", md: "80%" },
          '@media (max-width:600px)': {
            maxWidth: "100%"
          }
        }}>
          <CardList updateCards={updateCards} setUpdateCards={setUpdateCards} />
        </Box>
      </Stack>
    </>
  );
};

export default Home;
