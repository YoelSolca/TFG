import { CrearPacienteRequest, PacientesResponse, RegistroPaciente } from "../models/Paciente.model";
import { HistorialPacienteResponse, SesionEvolucion } from "../models/Evolucion.model";
import { PacienteDetalle } from "../models/PacienteDetalle.model";
import { backendApi } from "./api/BackendApi";

export const obtenerPacientes = async (
  search: string,
  tipoDificultadId?: number,
  page: number = 1,
  pageSize: number = 10,
): Promise<PacientesResponse> => {
  try {
    const response = await backendApi().get("/api/pacientes/", {
      params: {
        search: search,
        page: page,
        pageSize: pageSize,
        tipoDificultadId: tipoDificultadId,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    throw error;
  }
};

export const obtenerPacientePorId = async (id: string) => {
  try {
    const response = await backendApi().get(`/api/pacientes/${id}/informacion`);

    return response.data as Promise<PacienteDetalle>;
  } catch (error) {
    console.error("Error al obtener paciente por ID:", error);
    throw error;
  }
};

export const obtenerHistorialPaciente = async (
  id: string,
  tipoEjercicioId?: number,
  fecha?: Date,
  page?: number,
  pageSize?: number,
): Promise<HistorialPacienteResponse> => {
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
  } catch (error) {
    console.error("Error al obtener historial del paciente:", error);
    throw error;
  }
};

export const obtenerEvolucionPaciente = async (
  id: string,
  desde?: string,
  hasta?: string,
): Promise<SesionEvolucion[]> => {
  try {
    const response = await backendApi().get(`/api/pacientes/${id}/evolucion`, {
      params: {
        desde: desde,
        hasta: hasta,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener la evolución del paciente:", error);
    throw error;
  }
};

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

export const crearPaciente = async (paciente: CrearPacienteRequest): Promise<RegistroPaciente> => {
  const response = await backendApi().post("/api/pacientes", paciente);
  return { paciente: response.data, creado: response.status === 201 };
};

export const guardarCambiosPaciente = async (id: string, paciente: PacienteDetalle) => {
  try {
    const response = await backendApi().put(`/api/pacientes/${id}`, {
      ...paciente,
      tiposDificultadIds: paciente.tiposDificultad.map((t) => t.id),
    });
    return response.data;
  } catch (error) {
    console.error("Error al guardar cambios del paciente:", error);
    throw error;
  }
};
