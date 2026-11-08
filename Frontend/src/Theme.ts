import { createTheme } from "@mui/material/styles";

// Tema de Aprendo: Material UI por defecto con el azul de la marca.
const theme = createTheme({
  palette: {
    primary: { main: "#2563EB" },
    background: { default: "#F5F7FA", paper: "#FFFFFF" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontSize: 32, fontWeight: 600, lineHeight: "40px" },
    h5: { fontSize: 24, fontWeight: 600, lineHeight: "32px" },
    h6: { fontSize: 18, fontWeight: 600, lineHeight: "28px" },
    subtitle1: { fontSize: 16, fontWeight: 600, lineHeight: "24px" },
  },
  components: {
    MuiCard: { defaultProps: { variant: "outlined" } },
    MuiPaper: { styleOverrides: { outlined: { borderColor: "rgba(0, 0, 0, 0.12)" } } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 500, backgroundColor: "#F8FAFC" },
        root: { paddingTop: 12, paddingBottom: 12 },
      },
    },
    MuiChip: { styleOverrides: { sizeSmall: { fontSize: 12 } } },
  },
});

export default theme;
