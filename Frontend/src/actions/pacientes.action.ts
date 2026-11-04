import { HistorialPacienteResponse, PacientesResponse } from "../Model/paciente.model";
import { PacienteDetalle } from "../Model/PacienteDetalle.model";
import { backendApi } from "./api/backendApi";

export const obtenerPacientes = async (search: string, tipoDificultadId?: number, page: number = 1): Promise<PacientesResponse> => {
  try {
    const response = await backendApi().get("/api/pacientes/", {
        params: {
           search: search,
           page: page,
           pageSize: 10,
           tipoDificultadId: tipoDificultadId,
        },
    });

    return response.data;
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    throw error;
  }
}

export const obtenerPacientePorId = async (id: string) => {
  try {
    const response = await backendApi().get(`/api/pacientes/${id}/informacion`);

    return response.data as Promise<PacienteDetalle>;
  } catch (error) {
    console.error("Error al obtener paciente por ID:", error);
    throw error;
  }
}

export const obtenerHistorialPaciente = async (id: string, tipoEjercicioId?: number, fecha?: Date, page?: number, pageSize?: number) : Promise<HistorialPacienteResponse> => {
  try {
    const response = await backendApi().get(`/api/pacientes/${id}/historial`, {
      params: {
        page: page,
        pageSize: pageSize,
        tipoEjercicioId: tipoEjercicioId,
        fecha: fecha,
      },
    });
    return response.data;
  }
  catch (error) {
    console.error("Error al obtener historial del paciente:", error);
    throw error;
  }
}

export const obtenerInformesPaciente = async (id: string, fecha?: Date, page?: number, pageSize?: number) => {
  try {
    const response = await backendApi().get(`/api/pacientes/${id}/informes`, {
      params: {
        page: page,
        pageSize: pageSize, 
        fecha: fecha,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener informes del paciente:", error);
    throw error;
  }
};

export const guardarCambiosPaciente = async (id: string, paciente: PacienteDetalle) => {
  try {
    const response = await backendApi().put(`/api/pacientes/${id}`, paciente);
    return response.data;
  } catch (error) {
    console.error("Error al guardar cambios del paciente:", error);
    throw error;
  }
};

