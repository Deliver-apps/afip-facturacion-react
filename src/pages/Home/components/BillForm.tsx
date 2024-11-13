// src/components/BillForm.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Shuffle } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { getUsers } from "@src/api/users";
import { createFactura } from "@src/api/facturacion";

// Define the User type based on the expected structure from the "users" endpoint
interface User {
  id: number;
  real_name: string;
}

const BillForm: React.FC = () => {
  // State for users fetched from the endpoint
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string>("");

  // Form state
  const [selectedUser, setSelectedUser] = useState<number | "">("");
  const [valorMinimo, setValorMinimo] = useState<string>("");
  const [valorMaximo, setValorMaximo] = useState<string>("");
  const [minHour, setMinHour] = useState<number>(9);
  const [maxHour, setMaxHour] = useState<number>(21);
  const [facturasTotales, setFacturasTotales] = useState<number | "">("");
  const [formError, setFormError] = useState<string>("");
  const [selectedDateInicio, setSelectedDateInicio] = useState<Date | null>(
    null,
  );
  const [selectedDateFin, setSelectedDateFin] = useState<Date | null>(null);

  // Fetch users from the "users" endpoint
  useEffect(() => {
    setLoadingUsers(true);
    getUsers()
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setFormError("Error al cargar usuarios");
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, []);

  // Handler for generating a random number between 20 and 35
  const handleRandomFacturas = () => {
    const min = parseFloat(valorMaximo) * 0.00013; // 0.015%
    const max = parseFloat(valorMaximo) * 0.00015; // 0.016%

    const randomNumber = Math.random() * (max - min) + min;

    setFacturasTotales(Math.floor(randomNumber) + 1);
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (Number(valorMinimo) > Number(valorMaximo)) {
      setFormError('"Valor mínimo" should not exceed "Valor máximo".');
      setUsersError("");
      return;
    }

    // Reset form error if any
    setFormError("");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dateInit = selectedDateInicio ? selectedDateInicio : tomorrow;
    const formatedDateInicio = `${dateInit.getFullYear()}-${dateInit.getMonth() + 1}-${dateInit.getDate()}`;
    const formatedDateFin = `${selectedDateFin?.getFullYear()}-${selectedDateFin?.getMonth() || 0 + 1}-${selectedDateFin?.getDate()}`;

    // Proceed with form submission
    const parsedData = {
      userId: Number(selectedUser),
      minBill: Number(valorMinimo),
      maxBill: Number(valorMaximo),
      billNumber: Number(facturasTotales),
      startDate: formatedDateInicio,
      endDate: formatedDateFin!,
    };

    createFactura(parsedData)
      .then(async (data) => {
        setSelectedUser("");
        setFacturasTotales("");
        setFormError("");
        console.log("Data:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    console.log("Form Data:", parsedData);
    // You can send formData to your backend or perform other actions
  };

  // Handler for form cancellation
  const handleCancel = () => {
    // Reset form fields
    setSelectedUser("");
    setValorMinimo("");
    setValorMaximo("");
    setFacturasTotales("");
    setFormError("");
  };
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 2);
  const maxDayFromCurrentMonth = new Date(today);
  maxDayFromCurrentMonth.setMonth(today.getMonth() + 1);
  maxDayFromCurrentMonth.setDate(0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* <LocalizationProvider> */}
      <Box
        sx={{
          maxWidth: 600,
          margin: "0 auto",
          padding: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: "#fff",
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          Crear Facturación
        </Typography>

        {loadingUsers && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            my={4}
          >
            <CircularProgress />
          </Box>
        )}

        {!loadingUsers && usersError && (
          <Alert severity="error">{usersError}</Alert>
        )}

        {!loadingUsers && !usersError && (
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Form Error */}
              {formError && <Alert severity="error">{formError}</Alert>}

              {/* User Dropdown */}
              <FormControl fullWidth required>
                <InputLabel id="user-select-label">Usuario</InputLabel>
                <Select
                  labelId="user-select-label"
                  id="user-select"
                  value={selectedUser}
                  label="Select User"
                  onChange={(e) => setSelectedUser(e.target.value as number)}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.id} - {user.real_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Valor Mínimo and Valor Máximo */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <TextField
                  label="Monto mínimo"
                  type="number"
                  fullWidth
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    },
                    htmlInput: {
                      min: 0,
                    },
                  }}
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                />
                <TextField
                  label="Monto máximo"
                  type="number"
                  fullWidth
                  required
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    },
                    htmlInput: {
                      min: 0,
                    },
                  }}
                  value={valorMaximo}
                  onChange={(e) => setValorMaximo(e.target.value)}
                />
              </Stack>

              {/* Facturas Totales */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <TextField
                  label="Facturas Totales"
                  type="number"
                  fullWidth
                  required
                  disabled
                  value={facturasTotales}
                  onChange={(e) => setFacturasTotales(Number(e.target.value))}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconButton
                            onClick={handleRandomFacturas}
                            edge="start"
                            disabled={
                              valorMinimo === "" ||
                              valorMaximo === "" ||
                              valorMinimo > valorMaximo ||
                              valorMinimo === "0" ||
                              valorMaximo === "0"
                            }
                          >
                            <Shuffle
                              sx={{
                                color:
                                  valorMinimo === "" ||
                                  valorMaximo === "" ||
                                  valorMinimo > valorMaximo ||
                                  valorMinimo === "0" ||
                                  valorMaximo === "0"
                                    ? "grey"
                                    : "primary.main",
                                fontSize: "1.5rem",
                              }}
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                      inputProps: { min: 0 },
                    },
                  }}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <DatePicker
                  label="Fecha Inicio"
                  onChange={(newValue) => setSelectedDateInicio(newValue)}
                  format="dd/MM/yyyy"
                  slots={{
                    textField: TextField,
                  }}
                  defaultValue={tomorrow}
                  minDate={tomorrow}
                  slotProps={{
                    textField: {
                      inputProps: {
                        required: true,
                      },
                    },
                  }}
                />
                <DatePicker
                  label="Fecha Fin"
                  onChange={(newValue) => setSelectedDateFin(newValue)}
                  format="dd/MM/yyyy"
                  minDate={nextDay}
                  maxDate={maxDayFromCurrentMonth}
                  slots={{
                    textField: TextField,
                  }}
                  slotProps={{
                    textField: {
                      inputProps: {
                        required: true,
                      },
                    },
                  }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <TextField
                  label="Hora Inicio"
                  type="number"
                  fullWidth
                  value={minHour}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: 23,
                    },
                  }}
                  onChange={(e) => setMinHour(Number(e.target.value))}
                />
                <TextField
                  label="Hora Fin"
                  type="number"
                  fullWidth
                  required
                  value={maxHour}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: 23,
                    },
                  }}
                  onChange={(e) => setMaxHour(Number(e.target.value))}
                />
              </Stack>

              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={
                    selectedUser === "" ||
                    valorMinimo === "" ||
                    valorMaximo === "" ||
                    valorMaximo < valorMinimo ||
                    valorMinimo === "0" ||
                    valorMaximo === "0" ||
                    facturasTotales === ""
                  }
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
            {/* Buttons */}
          </form>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default BillForm;
