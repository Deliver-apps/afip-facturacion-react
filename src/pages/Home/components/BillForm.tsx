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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  DeleteForever,
  EditNote,
  Handyman,
  Shuffle,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Autocomplete } from "@mui/material";
import { getOkFromAfipSdk, getUsers } from "@src/api/users";
import { createFactura, deleteFacturasFromUser } from "@src/api/facturacion";
import { showErrorToast, showSuccessToast } from "@src/helpers/toastifyCustom";
import CreateUserDialog from "./CreateUserDialog";
import {
  deleteUserFacturacion,
  updateUserFacturacion,
} from "@src/api/usersFacturacion";

// Define the User type based on the expected structure from the "users" endpoint
interface User {
  id: number;
  real_name: string;
  username: string;
  password: string;
}

interface Props {
  updateCards: boolean;
  setUpdateCards: React.Dispatch<React.SetStateAction<boolean>>;
}

const BillForm: React.FC<Props> = ({ setUpdateCards }) => {
  const [showPassword, setShowPassword] = useState(false);
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editableUser, setEditableUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  // Handle delete icon click
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Handle confirm
  const handleConfirmDelete = () => {
    const id = selectedUser?.id;
    if (!id) {
      showErrorToast("Seleccione un usuario", "top-right", 2000);
      return;
    }
    deleteFacturasFromUser(id)
      .then(() => {
        showSuccessToast(
          "Facturas Eliminadas Correctamente",
          "top-right",
          4_000,
        );
        setDeleteDialogOpen(false);
        setTimeout(() => {
          setUpdateCards(true);
        }, 1_000);
      })
      .catch((error) => {
        showErrorToast("Error al eliminar facturas", "top-right", 2000);
        console.error("Error:", error);
        setDeleteDialogOpen(false);
      });
    deleteUserFacturacion(id)
      .then(() => {
        showSuccessToast("Usuario Eliminado Correctamente", "top-right", 2000);
        setDeleteDialogOpen(false);
        setTimeout(() => {
          setUpdateCards(true);
        }, 1_000);
      })
      .catch((error) => {
        showErrorToast("Error al eliminar usuario", "top-right", 2000);
        console.error("Error:", error);
        setDeleteDialogOpen(false);
      });
  };

  // Handle cancel
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    if (selectedUser) {
      setEditableUser(selectedUser);
      setEditDialogOpen(true);
    }
  };

  // Optional: submit edited data
  const handleSave = () => {
    const id = selectedUser?.id;

    if (!id || !editableUser) {
      showErrorToast("Seleccione un usuario", "top-right", 3000);
      return;
    }

    setLoadingSave(true); // ✅ Start loading

    updateUserFacturacion(id, editableUser)
      .then(() => {
        showSuccessToast(
          "Usuario Actualizado Correctamente",
          "top-right",
          3000,
        );
        setEditDialogOpen(false);
      })
      .catch((error) => {
        showErrorToast("Error al actualizar usuario", "top-right", 3000);
        console.error("Error:", error);
      })
      .finally(() => {
        fetchUsers(); // ✅ Refresh the list

        setLoadingSave(false); // ✅ End loading

        setUsers((prevUsers) => {
          const updatedUser = prevUsers.find((u) => u.id === id);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
          return prevUsers;
        });
      });
  };

  const fetchUsers = () => {
    setLoadingUsers(true);

    getUsers()
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setFormError("Error al cargar usuarios");
      })
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    fetchUsers();
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

  const handleVerify = () => {
    const username = selectedUser?.username;
    if (!username) {
      showErrorToast("Seleccione un usuario.", "top-right", 2000);
      return;
    }
    setLoadingVerify(true);
    getOkFromAfipSdk(username)
      .then((response) => {
        if (!response) {
          showErrorToast(
            "La verificación falló. Intente nuevamente o comuniquese con el Admin.",
            "top-right",
            4_000,
          );
          setLoadingVerify(false);
          return;
        }
        showSuccessToast(
          "La verificación se realizó correctamente. Lista para facturar!",
          "top-right",
          4_000,
        );
        setLoadingVerify(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        showErrorToast(
          "Hubo un error en el servidor. Intente nuevamente o comuniquese con el Admin.",
          "top-right",
          4_000,
        );
        setLoadingVerify(false);
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
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          Crear Facturación
          <Box ml={15}>
            <CreateUserDialog />
          </Box>
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
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: selectedUser ? (
                        <InputAdornment position="start">
                          <IconButton
                            edge="start"
                            size="medium"
                            onClick={handleEditClick}
                            sx={{
                              color: "primary.main",
                            }}
                          >
                            <EditNote fontSize="large" />
                          </IconButton>
                          <IconButton
                            edge="start"
                            size="medium"
                            onClick={handleDeleteClick}
                            sx={{
                              color: "error.main",
                            }}
                          >
                            <DeleteForever fontSize="large" />
                          </IconButton>
                          {params.InputProps.startAdornment}
                        </InputAdornment>
                      ) : (
                        params.InputProps.startAdornment
                      ),
                    }}
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
                  minDate={tomorrow}
                />
                <DatePicker
                  label="Fecha Fin"
                  value={selectedDateFin}
                  onChange={(newValue) => setSelectedDateFin(newValue)}
                  format="dd/MM/yyyy"
                  minDate={tomorrow}
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
                  Aceptar
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              </Box>
            </Stack>
          </form>
        )}
      </Box>
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <TextField
            label="ID"
            fullWidth
            value={editableUser?.id ?? ""}
            margin="dense"
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Nombre Real"
            fullWidth
            margin="dense"
            value={editableUser?.real_name ?? ""}
            onChange={(e) =>
              setEditableUser((prev) =>
                prev ? { ...prev, real_name: e.target.value } : prev,
              )
            }
          />
          <TextField
            label="Username"
            fullWidth
            margin="dense"
            value={editableUser?.username ?? ""}
            onChange={(e) =>
              setEditableUser((prev) =>
                prev ? { ...prev, username: e.target.value } : prev,
              )
            }
          />
          <TextField
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="dense"
            value={editableUser?.password ?? ""}
            onChange={(e) =>
              setEditableUser((prev) =>
                prev ? { ...prev, password: e.target.value } : prev,
              )
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" alignItems="center" spacing={1} mt={2}>
            <Typography variant="inherit">
              ¿Querés verificar la conexión con AFIP SDK?
            </Typography>
            <Button
              variant="text"
              onClick={handleVerify}
              disabled={loadingVerify}
            >
              {loadingVerify ? (
                <CircularProgress size={30} />
              ) : (
                <Handyman color="warning" fontSize="large" />
              )}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loadingSave}
            startIcon={loadingSave ? <CircularProgress size={20} /> : null}
          >
            Guardar
          </Button>
          <Button onClick={() => setEditDialogOpen(false)} color="secondary">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que deseas eliminar al usuario{" "}
            <strong>{selectedUser?.real_name}</strong>?
          </Typography>
          <Typography sx={{ mt: 2, ml: 0.8 }}>
            <strong>
              Esta acción eliminará las facturaciones asociadas a el usuario.
            </strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BillForm;
