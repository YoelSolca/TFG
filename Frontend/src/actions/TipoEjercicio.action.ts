import { TipoEjercicio } from "../models/Paciente.model";
import { backendApi } from "./api/BackendApi";

export const filtrarHistorialPacientePorTipoEjercicio = async (): Promise<TipoEjercicio[]> => {
  try {
    const response = await backendApi().get(`/api/tipos-ejercicio/`);
    return response.data;
  } catch (error) {
    console.error("Error al filtrar historial del paciente por tipo de ejercicio:", error);
    throw error;
  }
};
