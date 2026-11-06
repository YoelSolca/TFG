import { tieneEstado } from "../utils/Errores";
import { EjercicioResponse } from "../models/Ejercicio.model";
import {
  EjercicioRealizadoResponse,
  ResultadoDetalle,
  ResultadoRequest,
  SesionEjerciciosResponse,
  SesionListItem,
  SesionPlan,
  SesionResponse,
} from "../models/Sesion.model";
import { backendApi } from "./api/BackendApi";

export const sesionEjercicios = async (tipoEjercicioId?: number, page: number = 1): Promise<EjercicioResponse> => {
  try {
    const response = await backendApi().get(`/api/ejercicios/`, {
      params: {
        tipoEjercicioId: tipoEjercicioId,
        page: page,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los ejercicios de la sesión:", error);
    throw error;
  }
};

export const obtenerPlanSesion = async (pacienteId: string): Promise<SesionPlan | null> => {
  try {
    const response = await backendApi().get(`/api/sesiones/planificada`, { params: { pacienteId } });
    return response.data;
  } catch (error) {
    if (tieneEstado(error, 404)) return null;
    console.error("Error al obtener el plan de la sesión:", error);
    throw error;
  }
};

export const crearSesion = async (pacienteId: number, ejercicioIds: number[]): Promise<SesionPlan> => {
  const response = await backendApi().post(`/api/sesiones`, { pacienteId, ejercicioIds });
  return response.data;
};

export const actualizarSesion = async (id: number, ejercicioIds: number[]): Promise<SesionPlan> => {
  const response = await backendApi().put(`/api/sesiones/${id}`, { ejercicioIds });
  return response.data;
};

export const iniciarSesion = async (id: number): Promise<SesionPlan> => {
  const response = await backendApi().post(`/api/sesiones/${id}/iniciar`);
  return response.data;
};

export const finalizarSesion = async (id: number): Promise<SesionPlan> => {
  const response = await backendApi().post(`/api/sesiones/${id}/finalizar`);
  return response.data;
};

export const obtenerMetricas = async (): Promise<{ id: number; nombre: string }[]> => {
  const response = await backendApi().get(`/api/metricas`);
  return response.data;
};

export const obtenerSesiones = async (
  page: number,
  nombreApellido: string,
  fecha?: Date,
  estado?: string,
): Promise<SesionResponse> => {
  try {
    const response = await backendApi().get(`/api/sesiones/`, {
      params: {
        nombreApellido: nombreApellido,
        estado: estado,
        page: page,
        pageSize: 3,
        fecha: fecha,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    throw error;
  }
};

export const obtenerSesion = async (id: string): Promise<SesionListItem> => {
  try {
    const response = await backendApi().get(`/api/sesiones/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    throw error;
  }
};

export const obtenerEjerciciosSesion = async (id: string, page: number = 1): Promise<SesionEjerciciosResponse> => {
  try {
    const response = await backendApi().get(`/api/sesiones/${id}/ejercicios`, {
      params: {
        page: page,
        pageSize: 5,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los ejercicios de la sesión:", error);
    throw error;
  }
};

export const obtenerEjerciciosRealizados = async (
  page: number,
  nombreApellido: string,
  tipoEjercicioId?: number,
  fecha?: Date,
  pageSize: number = 5,
): Promise<EjercicioRealizadoResponse> => {
  try {
    const response = await backendApi().get(`/api/ejercicios/realizados`, {
      params: {
        nombreApellido: nombreApellido,
        tipoEjercicioId: tipoEjercicioId,
        page: page,
        pageSize: pageSize,
        fecha: fecha,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los ejercicios realizados:", error);
    throw error;
  }
};

export const guardarResultado = async (
  sesionId: string,
  ejercicioId: string,
  resultado: ResultadoRequest,
): Promise<void> => {
  await backendApi().put(`/api/sesiones/${sesionId}/ejercicios/${ejercicioId}/resultado`, resultado);
};

export const obtenerResultadoEjercicio = async (sesionId: string, ejercicioId: string): Promise<ResultadoDetalle> => {
  try {
    const response = await backendApi().get(`/api/sesiones/${sesionId}/ejercicios/${ejercicioId}/resultado`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el resultado del ejercicio:", error);
    throw error;
  }
};
