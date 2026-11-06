import { TipoDificultad } from "../models/Paciente.model";
import { backendApi } from "./api/BackendApi";

export const obtenerTiposDificultad = async (): Promise<TipoDificultad[]> => {
  try {
    const response = await backendApi().get("/api/tipos-dificultad");
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de dificultad:", error);
    throw error;
  }
};
