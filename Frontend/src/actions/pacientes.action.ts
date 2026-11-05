import { HistorialPacienteResponse, PacientesResponse, SesionSeguimiento } from "../Model/paciente.model";
import { PacienteDetalle } from "../Model/PacienteDetalle.model";
import { backendApi } from "./api/backendApi";

export const obtenerPacientes = async (search: string, tipoDificultadId?: number, page: number = 1, pageSize: number = 10): Promise<PacientesResponse> => {
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

// desde y hasta viajan como texto "YYYY-MM-DD" para que la zona horaria no corra el día.
export const obtenerSeguimientoPaciente = async (id: string, desde?: string, hasta?: string): Promise<SesionSeguimiento[]> => {
  try {
    const response = await backendApi().get(`/api/pacientes/${id}/seguimiento`, {
      params: {
        desde: desde,
        hasta: hasta,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el seguimiento del paciente:", error);
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

export const guardarCambiosPaciente = async (id: string, paciente: PacienteDetalle) => {
  try {
    // El servidor recibe solo los ids de las dificultades elegidas.
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

