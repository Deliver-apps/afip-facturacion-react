import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Box,
  CircularProgress,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { supabase } from "@src/service/supabaseClient";
import {
  checkJobStatus,
  createUserFacturacion,
  generateCSR,
  scrapAfip,
} from "@src/api/usersFacturacion";
import { showErrorToast, showSuccessToast } from "@src/helpers/toastifyCustom";
import { getOkFromAfipSdk, getOkFromVault } from "@src/api/users";
import { triggerRedeploy } from "@src/api/github";
import { AddCircle, Visibility, VisibilityOff } from "@mui/icons-material";

interface NewUserPayload {
  created_at: string;
  external_client: boolean | null;
  password: string | null;
  real_name: string | null;
  username: string | null;
}

const CreateUserDialog = () => {
  const [showPassword, setShowPassword] = useState(true);
  const [open, setOpen] = useState(false);
  const [isExternalUser, setIsExternalUser] = useState<boolean>(false);
  const [steps, setSteps] = useState<{
    createUser: "idle" | "loading" | "success" | "error";
    createCSR: "idle" | "loading" | "success" | "error";
    addingCSR: "idle" | "loading" | "success" | "error";
    consultVault: "idle" | "loading" | "success" | "error";
    consultAfipSdk: "idle" | "loading" | "success" | "error";
  }>({
    createUser: "idle",
    createCSR: "idle",
    addingCSR: "idle",
    consultVault: "idle",
    consultAfipSdk: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getExternalBoolean = async () => {
      const tokenFromCookie = Cookies.get("authToken");
      if (!tokenFromCookie) {
        setIsExternalUser(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser(tokenFromCookie);
      if (error) {
        console.error("Error fetching user:", error);
        setIsExternalUser(false);
        return;
      }

      const external =
        data.user.email === "test1@gmail.com" ||
        data.user.email === "julychaves@gmail.com";

      setIsExternalUser(external);
    };
    getExternalBoolean();
  }, []);

  const [formData, setFormData] = useState<NewUserPayload>({
    created_at: new Date().toISOString(),
    external_client: false,
    password: null,
    real_name: null,
    username: null,
  });

  const handleChange =
    (key: keyof NewUserPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const value =
        target.type === "checkbox" ? target.checked : target.value || null;

      setFormData((prev) => ({ ...prev, [key]: value }));
    };

  useEffect(() => {
    if (error && error?.length > 0) {
      showErrorToast(error, "top-right", 5_000);
      setIsLoading(false);
    }
  }, [error]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /**
   * Hace polling hasta `maxPolls` veces cada `delay` ms.
   * Devuelve "success" | "error" | "timeout".
   */
  const pollJobStatus = async (
    jobId: string,
    maxPolls = 20,
    delay = 30_000,
  ) => {
    for (let i = 0; i < maxPolls; i++) {
      const job = await checkJobStatus(jobId);
      console.log("Status: ", job.status);
      if (job.status === "success" || job.status === "error") {
        if (job.status === "error" && job.error?.includes("captcha")) {
          await triggerRedeploy();
          setError(
            "El servidor se encuentra bloqueado con captcha. Reiniciando, intente nuevamente en 5 minutos...",
          );
          return job.status;
        }
        return job.status;
      }
      if (!job) {
        return "error";
      }
      await sleep(delay);
    }
    return "timeout";
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSteps({
      createUser: "loading",
      createCSR: "idle",
      addingCSR: "idle",
      consultVault: "idle",
      consultAfipSdk: "idle",
    });

    if (!formData.username || !formData.real_name || !formData.password) {
      setError("Por favor, rellene todos los campos.");
      setIsLoading(false);
      setSteps({
        createUser: "error",
        createCSR: "idle",
        addingCSR: "idle",
        consultVault: "idle",
        consultAfipSdk: "idle",
      });
      return;
    }

    /* ---------- 1. Validaciones ---------- */
    const validations = [
      {
        ok: !!formData.username?.trim(),
        msg: "El nombre de usuario no puede estar vacío.",
      },
      {
        ok: !!formData.real_name?.trim(),
        msg: "El nombre real no puede estar vacío.",
      },
      {
        ok: !!formData.password?.trim(),
        msg: "La contraseña no puede estar vacía.",
      },
    ];

    for (const v of validations) {
      if (!v.ok) {
        setError(v.msg);
        setIsLoading(false);
        return;
      }
    }

    /* ---------- 2. Payload ---------- */
    const payload = {
      external_client: isExternalUser,
      username: formData.username.trim(),
      real_name: formData.real_name.trim(),
      password: formData.password,
    };
    console.log("payload", payload);

    try {
      /* ---------- 3. Crear usuario ---------- */
      const userCreated = await createUserFacturacion(payload);
      if (!userCreated) throw new Error("Hubo un error al crear el usuario.");
      setSteps((p) => ({ ...p, createUser: "success" }));

      // // Si NO se pide creación completa,
      // // salimos felices después de mostrar el toast.
      // if (!formData.complete_creation) {
      //   showSuccessToast("Usuario creado con éxito", "top-right", 5000);
      //   return;
      // }

      /* ---------- 4. Generar CSR ---------- */
      setSteps((p) => ({ ...p, createCSR: "loading" }));
      const csrCreated = await generateCSR(payload);
      if (!csrCreated) throw new Error("Hubo un error al crear el CSR.");
      setSteps((p) => ({ ...p, createCSR: "success" }));

      /* ---------- 5. Scrapping / Job ---------- */
      setSteps((p) => ({ ...p, addingCSR: "loading" }));
      const job = await scrapAfip(payload);
      if (typeof job === "string") throw new Error(job); // mensaje directo del backend

      /* ---------- 6. Polling ---------- */
      const finalStatus = await pollJobStatus(job.jobId);
      console.log("CONSIGUI EL STATUS", finalStatus);
      if (finalStatus === "success") {
        setSteps((p) => ({ ...p, addingCSR: "success" }));
        setSteps((p) => ({ ...p, consultVault: "loading" }));

        const response = await getOkFromVault(payload.username);

        if (!response) {
          setError("Hubo un error al consultar el CSR.");
          setSteps((p) => ({ ...p, consultVault: "error" }));
          return;
        } else {
          setSteps((p) => ({ ...p, consultVault: "success" }));
          setSteps((p) => ({ ...p, consultAfipSdk: "loading" }));

          const response = await getOkFromAfipSdk(payload.username);

          if (!response) {
            setError("Hubo un error al consultar el CSR.");
            setSteps((p) => ({ ...p, consultAfipSdk: "error" }));
            return;
          } else {
            setSteps((p) => ({ ...p, consultAfipSdk: "success" }));
          }
        }
      } else if (finalStatus === "error") {
        throw new Error(
          "El proceso de CSR falló. Revise contraseña y representación de usuario.",
        );
      } else {
        throw new Error(
          "Tiempo de espera agotado al consultar el CSR. Intente nuevamente.",
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      console.error("Error handleSubmit:", err);
      setError(msg);

      // Reflexión mínima de estados fallidos
      setSteps((p) => ({
        ...p,
        createUser: p.createUser === "success" ? p.createUser : "error",
        createCSR: p.createCSR === "success" ? p.createCSR : "error",
        addingCSR: p.addingCSR === "success" ? p.addingCSR : "error",
        consultVault: p.consultVault === "success" ? p.consultVault : "error",
        consultAfipSdk:
          p.consultAfipSdk === "success" ? p.consultAfipSdk : "error",
      }));
    } finally {
      showSuccessToast(
        "Usuario creado con éxito. Listo para facturar.",
        "top-right",
        10_000,
      );
      await sleep(4_000);
      setOpen(false);
      setIsLoading(false);
      setFormData({
        created_at: new Date().toISOString(),
        external_client: false,
        password: null,
        real_name: null,
        username: null,
      });
      setSteps({
        createUser: "idle",
        createCSR: "idle",
        addingCSR: "idle",
        consultVault: "idle",
        consultAfipSdk: "idle",
      });
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        onClick={() => setOpen(true)}
        sx={{
          borderRadius: 2,
          py: 1,
          px: 2,
          borderColor: 'secondary.main',
          color: 'secondary.main',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'secondary.light',
            color: 'white',
            borderColor: 'secondary.light',
          },
          '@media (max-width:600px)': {
            py: 0.75,
            px: 1.5,
            fontSize: '0.875rem',
          }
        }}
      >
        <AddCircle fontSize="medium" />
        <Typography ml={1} variant="body1" sx={{
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
          }
        }}>
          Crear Usuario
        </Typography>
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            '@media (max-width:600px)': {
              margin: 2,
              width: 'calc(100% - 32px)',
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'secondary.main', 
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          Datos del Usuario
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            alignItems="flex-start"
            sx={{ width: "100%" }}
          >
            {/* Left: Form */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="CUIT (Sin Guiones)"
                  fullWidth
                  value={formData.username ?? ""}
                  onChange={handleChange("username")}
                />
                <TextField
                  label="Nombre Real"
                  fullWidth
                  value={formData.real_name ?? ""}
                  onChange={handleChange("real_name")}
                />
                <TextField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  margin="dense"
                  value={formData.password ?? ""}
                  onChange={handleChange("password")}
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
                <Box sx={{ display: "none" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isExternalUser}
                        onChange={handleChange("external_client")}
                      />
                    }
                    label="External Client"
                  />
                </Box>
              </Stack>
            </Box>

            {/* Right: Only shown if checkbox is true */}
            <Box
              sx={{
                flexShrink: 0,
                minWidth: { xs: '100%', md: 240 },
                borderLeft: { xs: 'none', md: '1px solid #e0e0e0' },
                pl: { xs: 0, md: 2 },
                pt: { xs: 2, md: 0 },
                height: "100%",
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Proceso de creación
              </Typography>

              <Stack spacing={2}>
                <ProcessItem
                  label="Creando usuario"
                  active={steps.createUser === "loading"}
                  success={steps.createUser === "success"}
                  error={steps.createUser === "error" ? "Error" : null}
                />
                <ProcessItem
                  label="Creando Archivos CSR"
                  active={steps.createCSR === "loading"}
                  success={steps.createCSR === "success"}
                  error={steps.createCSR === "error" ? "Error" : null}
                />
                <ProcessItem
                  label="Añadiendo CSR a Usuario en AFIP"
                  active={steps.addingCSR === "loading"}
                  success={steps.addingCSR === "success"}
                  error={steps.addingCSR === "error" ? "Error" : null}
                />
                <ProcessItem
                  label="Consultando Cifrado de Seguridad"
                  active={steps.consultVault === "loading"}
                  success={steps.consultVault === "success"}
                  error={steps.consultVault === "error" ? "Error" : null}
                />
                <ProcessItem
                  label="Revisando conexión con AFIP SDK"
                  active={steps.consultAfipSdk === "loading"}
                  success={steps.consultAfipSdk === "success"}
                  error={steps.consultAfipSdk === "error" ? "Error" : null}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading}
            sx={{ minWidth: 120 }}
          >
            Crear
          </Button>
          <Button
            onClick={() => setOpen(false)}
            color="secondary"
            disabled={isLoading}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ProcessItem = ({
  label,
  active,
  success,
  error,
}: {
  label: string;
  active: boolean;
  success: boolean;
  error: string | null;
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    {active && <CircularProgress size={16} />}
    {success && <CheckCircle fontSize="small" color="success" />}
    {error && (
      <Typography variant="body2" color="error">
        ❌
      </Typography>
    )}
    <Typography variant="body2">{label}</Typography>
  </Box>
);

export default CreateUserDialog;
