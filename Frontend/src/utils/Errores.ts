import axios from "axios";

// Lo que el servidor manda cuando algo falla (formato "problem details" de ASP.NET).
export interface ErrorServidor {
  title?: string; // código del error, por ejemplo "INVALID_CREDENTIALS"
  detail?: string; // texto listo para mostrarle a la persona
  errors?: Record<string, string[]>; // errores de validación por campo
}

export const datosDelError = (error: unknown): ErrorServidor | undefined =>
  axios.isAxiosError(error) ? error.response?.data : undefined;

export const tieneEstado = (error: unknown, estado: number): boolean =>
  axios.isAxiosError(error) && error.response?.status === estado;

// Saca un texto legible de lo que contesta el servidor: el detalle, o el primer error de validación.
// Si no hay ninguno (por ejemplo, no hubo respuesta) devuelve el mensaje por defecto.
export function mensajeDelServidor(error: unknown, porDefecto: string): string {
  const datos = datosDelError(error);
  if (datos?.detail) return datos.detail;
  const primero = datos?.errors ? Object.values(datos.errors).flat()[0] : undefined;
  return primero ?? porDefecto;
}
