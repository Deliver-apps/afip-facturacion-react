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
        spacing={4}
        sx={{ width: "100%", mb: 5, mt: 3, p: 2 }}
      >
        <Box sx={{ width: "100%", maxWidth: "90%" }}>
          <BillForm updateCards={updateCards} setUpdateCards={setUpdateCards} />
        </Box>
        <Box sx={{ width: "100%", maxWidth: "90%" }}>
          <CardList updateCards={updateCards} setUpdateCards={setUpdateCards} />
        </Box>
      </Stack>
    </>
  );
};

export default Home;
