import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  TextField,
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
import { Autocomplete } from "@mui/material";
import { getUsers } from "@src/api/users";
import { createFactura } from "@src/api/facturacion";
import { showErrorToast, showSuccessToast } from "@src/helpers/toastifyCustom";

// Define the User type based on the expected structure from the "users" endpoint
interface User {
  id: number;
  real_name: string;
  username: string;
}

interface Props {
  updateCards: boolean;
  setUpdateCards: React.Dispatch<React.SetStateAction<boolean>>;
}

const BillForm: React.FC<Props> = ({ setUpdateCards }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string>("");

  const [selectedUser, setSelectedUser] = useState<User | null | undefined>(
    null,
  );
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

  useEffect(() => {
    setLoadingUsers(true);
    getUsers()
      .then((data) => setUsers(data))
      .catch((error) => {
        console.error("Error fetching users:", error);
        setFormError("Error al cargar usuarios");
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleRandomFacturas = () => {
    const min = parseFloat(valorMaximo) * 0.000011;
    const max = parseFloat(valorMaximo) * 0.0000125;
    const randomNumber = Math.random() * (max - min) + min;
    setFacturasTotales(Math.floor(randomNumber) + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (Number(valorMinimo) > Number(valorMaximo)) {
      setFormError('"Valor mínimo" should not exceed "Valor máximo".');
      setUsersError("");
      return;
    }

    if (!selectedUser) {
      setFormError("Seleccione un usuario.");
      setUsersError("");
      return;
    }

    setFormError("");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dateInit = selectedDateInicio ? selectedDateInicio : tomorrow;
    const formatedDateInicio = `${dateInit.getFullYear()}-${dateInit.getMonth() + 1}-${dateInit.getDate()}`;
    const formatedDateFin = `${selectedDateFin?.getFullYear()}-${selectedDateFin?.getMonth() || 0 + 1}-${selectedDateFin?.getDate()}`;

    const parsedData = {
      userId: selectedUser?.id,
      minBill: Number(valorMinimo),
      maxBill: Number(valorMaximo),
      billNumber: Number(facturasTotales),
      startDate: formatedDateInicio,
      endDate: formatedDateFin!,
    };

    createFactura(parsedData)
      .then(() => {
        showSuccessToast("Factura Creada Correctamente", "top-right", 2000);
        setSelectedUser(null);
        setFacturasTotales("");
        setFormError("");
        setTimeout(() => {
          setUpdateCards(true);
        }, 1000);
      })
      .catch((error) => {
        showErrorToast("Error al crear factura", "top-right", 2000);
        console.error("Error:", error);
      });
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setValorMinimo("");
    setValorMaximo("");
    setFacturasTotales("");
    setFormError("");
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 1);
  const maxDayFromCurrentMonth = new Date(today);
  maxDayFromCurrentMonth.setMonth(today.getMonth() + 1);
  maxDayFromCurrentMonth.setDate(0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
              {formError && <Alert severity="error">{formError}</Alert>}

              {/* User Dropdown with Search */}
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={(user) =>
                  `${user.id} - ${user.real_name} - ${user.username}`
                }
                value={selectedUser!}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Usuario"
                    variant="outlined"
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option.id === value?.id
                }
                disableClearable
              />

              {/* Valor Mínimo and Valor Máximo */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <TextField
                  label="Monto mínimo"
                  type="number"
                  fullWidth
                  required
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Monto máximo"
                  type="number"
                  fullWidth
                  required
                  value={valorMaximo}
                  onChange={(e) => setValorMaximo(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
              </Stack>

              {/* Facturas Totales */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <TextField
                  label="Facturas Totales"
                  type="number"
                  fullWidth
                  required
                  value={facturasTotales}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          onClick={handleRandomFacturas}
                          edge="start"
                          disabled={
                            !valorMinimo ||
                            !valorMaximo ||
                            Number(valorMinimo) > Number(valorMaximo)
                          }
                        >
                          <Shuffle />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              {/* Date Pickers */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <DatePicker
                  label="Fecha Inicio"
                  value={selectedDateInicio}
                  onChange={(newValue) => setSelectedDateInicio(newValue)}
                  format="dd/MM/yyyy"
                  minDate={today}
                />
                <DatePicker
                  label="Fecha Fin"
                  value={selectedDateFin}
                  onChange={(newValue) => setSelectedDateFin(newValue)}
                  format="dd/MM/yyyy"
                  minDate={today}
                />
              </Stack>

              {/* Hours */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <TextField
                  label="Hora Inicio"
                  type="number"
                  fullWidth
                  value={minHour}
                  onChange={(e) => setMinHour(Number(e.target.value))}
                  inputProps={{ min: 0, max: 23 }}
                />
                <TextField
                  label="Hora Fin"
                  type="number"
                  fullWidth
                  value={maxHour}
                  onChange={(e) => setMaxHour(Number(e.target.value))}
                  inputProps={{ min: 0, max: 23 }}
                />
              </Stack>

              {/* Buttons */}
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={
                    !selectedUser ||
                    !valorMinimo ||
                    !valorMaximo ||
                    Number(valorMaximo) < Number(valorMinimo) ||
                    !facturasTotales
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
          </form>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default BillForm;
