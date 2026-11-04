import { InformeDetalle, InformeResponse } from '../Model/sesion.model';
import { backendApi } from './api/backendApi';

export const obtenerInformes = async (page: number, nombreApellido: string, fecha?: Date): Promise<InformeResponse> => {
  try {
    const response = await backendApi().get(`/api/informes`, {
      params: {
        nombreApellido: nombreApellido,
        page: page,
        pageSize: 5,
        fecha: fecha
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener los informes:", error);
    throw error;
  }
}

export const obtenerInforme = async (id: string): Promise<InformeDetalle> => {
  try {
    const response = await backendApi().get(`/api/informes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el informe:", error);
    throw error;
  }
}
