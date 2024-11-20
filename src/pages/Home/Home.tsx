"use client";
import React, { useState } from "react";
import { BillForm, CardList, PrimarySearchAppBar } from "./components";
import { Stack } from "@mui/material";
import { ToastContainer } from "react-toastify";

const Home: React.FC = () => {
  const [updateCards, setUpdateCards] = useState<boolean>(true);
  return (
    <>
      <PrimarySearchAppBar />
      <ToastContainer />
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        gap={6} // Increase the gap between elements
        sx={{ width: "100%", mb: 5, mt: 3, p: 2, alignItems: "flex-start" }}
      >
        <BillForm updateCards={updateCards} setUpdateCards={setUpdateCards} />
        <CardList updateCards={updateCards} setUpdateCards={setUpdateCards} />
      </Stack>
    </>
  );
};

export default Home;
