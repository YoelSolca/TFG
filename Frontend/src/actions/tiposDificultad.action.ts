import { TipoDificultad } from "../Model/paciente.model";
import { backendApi } from "./api/backendApi";




export const obtenerTiposDificultad = async (): Promise<TipoDificultad[]> => {
  try {
    const response = await backendApi().get("/api/tipos-dificultad");
    return response.data;
  } catch (error) {
    console.error("Error al obtener tipos de dificultad:", error);
    throw error;
  }
}