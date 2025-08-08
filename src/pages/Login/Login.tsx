import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AppDispatch } from "@src/redux/store";
import { Image, Footer } from "./components";
import { login } from "@src/redux/states";
import imageLogin from "@src/assets/logo.png";

interface FormField {
  id: number;
  label: string;
  required: boolean;
  model: string;
  type?: string;
}

const Login: React.FC = () => {
  const [status, setStatus] = useState<{ valid: boolean }>({ valid: true });
  const [formFields, setFormFields] = useState<FormField[]>([
    { id: 1, label: "Usuario", required: true, model: "" },
    { id: 2, label: "Contraseña", required: true, model: "", type: "password" },
  ]);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [disabled, setDisabled] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: number
  ) => {
    setFormFields(
      formFields.map((field) =>
        field.id === id ? { ...field, model: e.target.value } : field
      )
    );
  };

  const loginHandler = async () => {
    setStatus({ valid: true });
    setDisabled(true);
    const resultAction = await dispatch(login(formFields));

    if (login.fulfilled.match(resultAction)) {
      navigate("/home");
    } else {
      setStatus({ valid: false });
    }
    setDisabled(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1000 1000\'%3E%3Cdefs%3E%3CradialGradient id=\'stars\' cx=\'50%25\' cy=\'50%25\' r=\'50%25\'%3E%3Cstop offset=\'0%25\' stop-color=\'%23ffffff\' stop-opacity=\'0.8\'/%3E%3Cstop offset=\'100%25\' stop-color=\'%23ffffff\' stop-opacity=\'0\'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'2\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'300\' cy=\'200\' r=\'1.5\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'500\' cy=\'150\' r=\'1\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'700\' cy=\'300\' r=\'2.5\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'900\' cy=\'100\' r=\'1.5\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'200\' cy=\'400\' r=\'1\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'400\' cy=\'500\' r=\'2\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'600\' cy=\'450\' r=\'1.5\' fill=\'url(%23stars)\'/%3E%3Ccircle cx=\'800\' cy=\'600\' r=\'1\' fill=\'url(%23stars)\'/%3E%3C/svg%3E")',
          opacity: 0.2,
          animation: 'twinkle 3s ease-in-out infinite alternate',
        }
      }}
    >
      {/* Moon */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '15%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
          boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
          zIndex: 1,
        }}
      />
      
      {/* Clouds */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: 120,
          height: 40,
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.6)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -20,
            left: 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -15,
            right: 20,
            width: 35,
            height: 35,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
          }
        }}
      />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          py: 4
        }}
      >
        <Container 
          maxWidth="sm" 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 400,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}
          >
            {/* Logo/Image */}
            <Box sx={{ mb: 2 }}>
              <Image imageSrc={imageLogin} cover={true} />
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textAlign: 'center',
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              🚀 Bienvenido
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
                mb: 3
              }}
            >
              Ingresa tus credenciales para continuar
            </Typography>

            {/* Form */}
            <Box 
              component="form" 
              onSubmit={loginHandler} 
              noValidate 
              sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {formFields.map((field) => (
                <TextField
                  key={field.id}
                  fullWidth
                  label={field.label}
                  type={field.type ?? "text"}
                  value={field.model}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => handleInputChange(e, field.id)}
                  error={!status.valid && field.required && !field.model}
                  helperText={
                    !status.valid && field.required && !field.model
                      ? "Este campo es requerido"
                      : ""
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'text.secondary',
                      fontWeight: 500,
                    }
                  }}
                />
              ))}
              
              {!status.valid && (
                <Typography 
                  variant="body2" 
                  color="error" 
                  align="center" 
                  sx={{ 
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'error.light',
                    color: 'white',
                    fontWeight: 500
                  }}
                >
                  ❌ Usuario o contraseña incorrectos
                </Typography>
              )}
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={loginHandler}
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  boxShadow: '0 8px 16px rgba(107, 114, 128, 0.3)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
                    boxShadow: '0 12px 24px rgba(107, 114, 128, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'grey.300',
                    color: 'grey.500',
                    transform: 'none',
                  },
                  transition: 'all 0.3s ease'
                }}
                disabled={disabled}
              >
                🔐 Iniciar sesión
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* Footer - Fixed at bottom */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2
        }}
      >
        <Footer />
      </Box>
    </Box>
  );
};

export default Login;
