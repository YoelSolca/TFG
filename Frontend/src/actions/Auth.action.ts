import { backendApiLogin } from "./api/BackendApi";

export const login = async (CorreoElectronico: string, Contrasenia: string) => {
  try {
    const response = await backendApiLogin().post("/api/auth/login", {
      CorreoElectronico,
      Contrasenia,
    });
    return response.data;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

export const solicitarRecuperacion = async (correoElectronico: string) => {
  try {
    const response = await backendApiLogin().post("/api/auth/forgot-password", JSON.stringify(correoElectronico));
    return response.data;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

export const restablecerContrasenia = async (token: string, nuevaContrasenia: string) => {
  try {
    const response = await backendApiLogin().post(
      "/api/auth/reset-password",
      JSON.stringify({ token, nuevaContrasenia }),
    );
    return response.data;
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    throw error;
  }
};
