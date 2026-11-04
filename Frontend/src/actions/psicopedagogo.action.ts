import { CreatePsicopedagogoRequest, UpdateStateRequest } from "../Model/psicopedagogo.model";
import { backendApi, backendApiLogin } from "./api/backendApi";






export const ListPsicopedagogos = async (searchTerm: string, estado: string[] = [], page: number = 1, pageSize: number = 100) => {
    try {
        const response = await backendApi().get('/api/psicopedagogo/',
        {
            params: {
                searchTerm: searchTerm,
                estado: estado,
                page: page,
                pageSize: pageSize
            },
            paramsSerializer: { indexes: null },
        }
        );
        return response.data;
    } catch (error) {
        console.error("Error al listar psicopedagogos:", error);
        throw error;
    }
};

export const UpdatePsicopedagogoState = async (personaId: number, request: UpdateStateRequest) => {
    try {
        const response = await backendApi().put(`/api/psicopedagogo/${personaId}/state`, request);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar el estado del psicopedagogo:", error);
        throw error;
    }
};

export const register = async (request: CreatePsicopedagogoRequest)  =>{
    try{    
        const { contrasenia2, aceptoTerminos, genero, ...rest } = request;
        const response = await backendApiLogin().post('/api/psicopedagogo/',
            { ...rest, genero: genero.charAt(0), aceptoTerminos: Boolean(aceptoTerminos) }
        );

        return response.data;
    }catch (error){
        console.error("Error al registrarse:", error);
        throw error; 
    }

}