import { ChangePasswordRequest, CreatePsicopedagogoRequest, PerfilPsicopedagogo, UpdatePerfilRequest, UpdateStateRequest } from "../Model/psicopedagogo.model";
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

export const obtenerPerfil = async (): Promise<PerfilPsicopedagogo> => {
    try {
        const response = await backendApi().get('/api/psicopedagogo/me');
        return response.data;
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
        throw error;
    }
};

export const actualizarPerfil = async (request: UpdatePerfilRequest): Promise<PerfilPsicopedagogo> => {
    try {
        const response = await backendApi().put('/api/psicopedagogo/me', request);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        throw error;
    }
};

export const cambiarContrasenia = async (request: ChangePasswordRequest): Promise<void> => {
    try {
        await backendApi().put('/api/psicopedagogo/me/password', request);
    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        throw error;
    }
};
