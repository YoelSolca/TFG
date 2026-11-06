import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Pacientes from "./pages/paciente/Pacientes";
import NuevoPaciente from "./pages/paciente/NuevoPaciente";
import AppLayout from "./layout/AppLayout";
import PacienteLayout from "./layout/PacienteLayout";
import Historial from "./pages/paciente/Historial";
import Informacion from "./pages/paciente/Informacion";
import Informes from "./pages/paciente/Informes";
import NuevaSesionEjercicios from "./pages/sesiones/NuevaSesionEjercicios";
import AuthLayout from "./layout/AuthLayout";
import Register from "./pages/auth/Register";
import Forgot from "./pages/auth/Forgot";
import { createContext, ReactNode, useContext, useState } from "react";
import { User } from "./models/Auth.model";
import Login from "./pages/auth/Login";
import { clearSession, getSession, saveSession } from "./pages/auth/Session";
import Reset from "./pages/auth/Reset";
import Solicitudes from "./pages/admin/Solicitudes";
import Profesionales from "./pages/admin/Profesionales";
import Sesiones from "./pages/sesiones/Sesiones";
import SesionEjercicios from "./pages/sesiones/SesionEjercicios";
import EjercicioResultado from "./pages/sesiones/EjercicioResultado";
import EjercicioJuego from "./pages/sesiones/EjercicioJuego";
import EjerciciosRealizados from "./pages/sesiones/EjerciciosRealizados";
import InformesGeneral from "./pages/informes/Informes";
import InformeDetalle from "./pages/informes/InformeDetalle";
import Inicio from "./pages/inicio/Inicio";
import Perfil from "./pages/perfil/Perfil";
import Evolucion from "./pages/paciente/Evolucion";

export const ROLES = { ADMIN: "Administrador", PRO: "Psicopedagogo" };

type AuthContextValue = {
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

const homeOf = (user: { role: string }) => (user.role === ROLES.ADMIN ? "/admin" : "/");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSession);

  const signIn = (u: User) => {
    saveSession(u);
    setUser(u);
  };
  const signOut = () => {
    clearSession();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

// Pantallas públicas: si ya hay sesión, se redirige a la home del rol.
function PublicOnly() {
  const { user } = useAuth();
  return user ? <Navigate to={homeOf(user)} replace /> : <Outlet />;
}

// Pantallas privadas: exige sesión y el rol correcto.
function RequireRole({ role }: { role: string }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homeOf(user)} replace />;
  return <Outlet />; // antes: <AppLayout />
}
function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />
          <Route path="recuperar" element={<Forgot />} />
          <Route path="restablecer-contrasena" element={<Reset />} />
        </Route>
      </Route>

      <Route path="admin" element={<RequireRole role={ROLES.ADMIN} />}>
        <Route element={<AppLayout />}>
          <Route index element={<Solicitudes />} />
          <Route path="profesionales" element={<Profesionales />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.PRO} />}>
        <Route element={<AppLayout />}>
          <Route index element={<Inicio />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<NuevoPaciente />} />
          <Route path="/pacientes/:id" element={<PacienteLayout />}>
            <Route path="informacion" element={<Informacion />} />
            <Route path="historial" element={<Historial />} />
            <Route path="informes" element={<Informes />} />
            <Route path="evolucion" element={<Evolucion />} />
          </Route>
          <Route path="/sesiones/nueva/ejercicios/:patientId" element={<NuevaSesionEjercicios />} />
          <Route path="/ejercicios" element={<EjerciciosRealizados />} />
          <Route path="/informes" element={<InformesGeneral />} />
          <Route path="/pacientes/:id/informes/:informeId" element={<InformeDetalle />} />
          <Route path="/sesiones" element={<Sesiones />} />
          <Route path="/sesiones/:id" element={<SesionEjercicios />} />
          <Route path="/sesiones/:id/ejercicios/:ejercicioId" element={<EjercicioJuego />} />
          <Route path="/sesiones/:id/ejercicios/:ejercicioId/resultado" element={<EjercicioResultado />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
