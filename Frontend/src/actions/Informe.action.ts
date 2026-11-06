import { InformeCreado } from "../models/Informe.model";
import { InformeDetalle, InformeResponse } from "../models/Sesion.model";
import { backendApi } from "./api/BackendApi";

export const crearInforme = async (
  pacienteId: number | string,
  desde: string,
  hasta: string,
): Promise<InformeCreado> => {
  const response = await backendApi().post(`/api/pacientes/${pacienteId}/informes`, {
    periodoDesde: desde,
    periodoHasta: hasta,
  });
  return response.data;
};

export const obtenerInformes = async (
  page: number,
  nombreApellido: string,
  fecha?: Date,
  pageSize: number = 5,
): Promise<InformeResponse> => {
  try {
    const response = await backendApi().get(`/api/informes`, {
      params: {
        nombreApellido: nombreApellido,
        page: page,
        pageSize: pageSize,
        fecha: fecha,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los informes:", error);
    throw error;
  }
};

export const obtenerInforme = async (id: string): Promise<InformeDetalle> => {
  try {
    const response = await backendApi().get(`/api/informes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el informe:", error);
    throw error;
  }
};
