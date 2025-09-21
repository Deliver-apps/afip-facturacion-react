import AccountCircle from "@mui/icons-material/AccountCircle";
import MoreIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { logout } from "@src/redux/states";
import { AppDispatch } from "@src/redux/store";
import * as React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const PrimarySearchAppBar: React.FC = React.memo(() => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMenuClickClose = () => {
    setAnchorEl(null);
    dispatch(logout()).then(() => {
      navigate("/login");
    });
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const menuId = "primary-search-account-menu";
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          mt: 1, // Margen superior para separarlo del botón
        }
      }}
    >
      <MenuItem 
        onClick={handleMenuClickClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 2,
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'white',
          }
        }}
      >
        <LogoutIcon fontSize="small" />
        Cerrar Sesión
      </MenuItem>
    </Menu>
  );

  const mobileMenuId = "primary-search-account-menu-mobile";
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          mt: 1, // Margen superior para separarlo del botón
        }
      }}
    >
      <MenuItem 
        onClick={handleProfileMenuOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5,
          px: 2,
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'white',
          }
        }}
      >
        <IconButton
          size="small"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
          sx={{ p: 0 }}
        >
          <AccountCircle />
        </IconButton>
        <Typography variant="body2">Perfil</Typography>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1, width: "100vw", margin: 0, padding: 0 }}>
      <AppBar
        position="static"
        sx={{ 
          margin: 0, 
          padding: 0, 
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", 
          width: "100%" 
        }}
      >
        <Toolbar sx={{ 
          paddingLeft: { xs: 2, sm: 3 }, 
          paddingRight: { xs: 2, sm: 3 },
          minHeight: { xs: 64, sm: 70 }
        }}>
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ 
              display: { xs: "block", sm: "block" },
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 700,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            🧾 Facturación AFIP
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <AccountCircle />
            </IconButton>
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
    </Box>
  );
});

PrimarySearchAppBar.displayName = 'PrimarySearchAppBar';

export default PrimarySearchAppBar;
