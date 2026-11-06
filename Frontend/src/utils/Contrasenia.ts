export const REQUISITOS_CONTRASENIA =
  "Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial";

// Devuelve el mensaje de error, o "" si la contraseña es válida.
export const validarContrasenia = (v: string) =>
  v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9\s]/.test(v)
    ? ""
    : REQUISITOS_CONTRASENIA;
