import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Pacientes from "./pages/Pacientes";
import AppLayout from "./layout/AppLayout";
import PacienteLayout from "./layout/PacienteLayout";
import Historial from "./pages/paciente/Historial";
import Informacion from "./pages/paciente/Informacion";
import Informes from "./pages/paciente/Informes";
import NuevaSesionEjercicios from "./pages/NuevaSesionEjercicios";
import AuthLayout from "./layout/authLayout";
import Register from "./pages/auth/register";
import Forgot from "./pages/auth/forgot";
import { createContext, ReactNode, useContext, useState } from "react";
import { User } from "./Model/psicopedagogo.model";
import Login from "./pages/auth/login";
import Reset from "./pages/auth/reset";
import Solicitudes from "./pages/admin/Solicitudes";
import Profesionales from "./pages/admin/Profesionales";
import Sesiones from "./pages/sesiones/sesiones";
import SesionEjercicios from "./pages/sesiones/SesionEjercicios";
import EjercicioResultado from "./pages/sesiones/EjercicioResultado";
import EjerciciosRealizados from "./pages/sesiones/EjerciciosRealizados";
import InformesGeneral from "./pages/Informes";
import InformeDetalle from "./pages/InformeDetalle";
import Inicio from "./pages/Inicio";
import Perfil from "./pages/Perfil";

export const ROLES = { ADMIN: 'Administrador', PRO: 'Psicopedagogo' };

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

const homeOf = (user: { role: string }) => (user.role === ROLES.ADMIN ? '/admin' : '/');

const KEY = "session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); }
    catch { return null; }
  });

  const signIn = (u: User) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };
  const signOut = () => {
    localStorage.removeItem(KEY);
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
  return <Outlet />;                               // antes: <AppLayout />
}
function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />
          <Route path="recuperar" element={<Forgot />} />
          <Route path="restaurar-contraseña" element={<Reset />} />
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
          <Route path="/pacientes/:id" element={<PacienteLayout />}>
            <Route path="informacion" element={<Informacion />} />
            <Route path="historial" element={<Historial />} />
            <Route path="informes" element={<Informes />} />
          </Route>
         <Route path="/sesiones/nueva/ejercicios/:patientId"element={<NuevaSesionEjercicios />}/>
          <Route path="/ejercicios" element={<EjerciciosRealizados />} />
          <Route path="/informes" element={<InformesGeneral />} />
          <Route path="/pacientes/:id/informes/:informeId" element={<InformeDetalle />} />
          <Route path="/sesiones" element={<Sesiones />} />
          <Route path="/sesiones/:id" element={<SesionEjercicios />}/>
          <Route path="/sesiones/:id/ejercicios/:ejercicioId/resultado" element={<EjercicioResultado />}/>
        </Route>


      </Route>
    </Routes>
  );
}

export default App;
