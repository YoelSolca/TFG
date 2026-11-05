// Cada validador devuelve el mensaje de error, o "" si el valor es válido.
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const validarDocumento = (v: string) =>
  /^\d{6,9}$/.test(v.trim()) ? "" : "Ingresá solo números (6 a 9 dígitos)";

export const validarTelefono = (v: string) =>
  /^\d{8,13}$/.test(v.replace(/[\s-]/g, "")) ? "" : "Teléfono inválido";
