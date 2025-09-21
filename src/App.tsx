import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { ProtectedRoute } from "@src/components";
import { supabase } from "@src/service/supabaseClient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Home, Login } from "./pages";
import { AppStore } from "./redux/store";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { theme } from "./theme";

const App: React.FC = () => {
  const token = useSelector((state: AppStore) => state.auth.token);
  const isAuthenticatedFromRedux = useSelector((state: AppStore) => state.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  // Memoizar el estado de autenticación para evitar re-renders
  const isAuthenticated = useMemo(() => {
    return Boolean(token && isAuthenticatedFromRedux);
  }, [token, isAuthenticatedFromRedux]);

  const checkAuthentication = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser(token);
      // Solo actualizamos si hay cambios reales en el estado
      if (data && !error && !isAuthenticatedFromRedux) {
        // El estado se maneja desde Redux, no necesitamos estado local duplicado
      } else if ((error || !data) && isAuthenticatedFromRedux) {
        // Si hay error, Redux debería manejar el logout
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticatedFromRedux]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Memoizar el componente de loading para evitar re-creaciones
  const LoadingComponent = useMemo(() => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: theme.palette.primary.main
      }}>
        Cargando...
      </div>
    </ThemeProvider>
  ), []);

  if (isLoading) {
    return LoadingComponent;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute element={Home} isAuthenticated={isAuthenticated} />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute element={Home} isAuthenticated={isAuthenticated} />
            }
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/home" : "/login"} />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
