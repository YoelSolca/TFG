import { EjercicioResponse } from '../Model/ejercicio.model';
import { ResultadoDetalle, SesionEjerciciosResponse, SesionListItem, SesionResponse } from '../Model/sesion.model';
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





export const obtenerSesiones = async (page: number, nombreApellido: string,  fecha?: Date)  : Promise<SesionResponse> => {

  try {
    const response = await backendApi().get(`/api/sesiones/`, {
      params: {
        nombreApellido: nombreApellido,
        page: page,
        pageSize: 3,
        fecha: fecha
      }
    });
    return response.data;
  }catch (error) {
    console.error("Error al obtener la sesión:", error);
    throw error;
  }
}

export const obtenerSesion = async (id: string): Promise<SesionListItem> => {
  try {
    const response = await backendApi().get(`/api/sesiones/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    throw error;
  }
}

export const obtenerEjerciciosSesion = async (id: string, page: number = 1): Promise<SesionEjerciciosResponse> => {
  try {
    const response = await backendApi().get(`/api/sesiones/${id}/ejercicios`, {
      params: {
        page: page,
        pageSize: 5
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los ejercicios de la sesión:", error);
    throw error;
  }
}

export const obtenerResultadoEjercicio = async (sesionId: string, ejercicioId: string): Promise<ResultadoDetalle> => {
  try {
    const response = await backendApi().get(`/api/sesiones/${sesionId}/ejercicios/${ejercicioId}/resultado`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el resultado del ejercicio:", error);
    throw error;
  }
}
