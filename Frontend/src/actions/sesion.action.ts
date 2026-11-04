import { EjercicioResponse } from '../Model/ejercicio.model';
import { backendApi } from './api/backendApi';




export const sesionEjercicios = async (tipoEjercicioId?: number, page:number = 1)  : Promise<EjercicioResponse> => {
  try {
    const response = await backendApi().get(`/api/ejercicios/`, {
      params: {
        tipoEjercicioId: tipoEjercicioId,
        page: page
      }
    });
    return response.data;
  }
    catch (error) {
        console.error("Error al obtener los ejercicios de la sesión:", error);
        throw error;
    }
}
