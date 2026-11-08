import axios from "axios";
import { clearSession, getToken } from "../../pages/auth/Session";
export function backendApi() {
  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
  api.interceptors.request.use((config) => {
    const token = getToken(); // lee la sesión de localStorage
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  api.interceptors.response.use(undefined, (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  });
  return api;
}

export function backendApiLogin() {
  return axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
