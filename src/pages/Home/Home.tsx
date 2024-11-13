"use client";
import React from "react";
import { BillForm, CardList, PrimarySearchAppBar } from "./components";
import { Stack } from "@mui/material";

const Home: React.FC = () => {
  return (
    <>
      <PrimarySearchAppBar />
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        gap={6} // Increase the gap between elements
        sx={{ width: "100%", mb: 5, mt: 3, p: 2, alignItems: "flex-start" }}
      >
        <BillForm />
        <CardList />
      </Stack>
    </>
  );
};

export default Home;
