import { useEffect, useState } from "react";

// Devuelve el valor recién después de que dejó de cambiar durante `ms` milisegundos.
export function useDebounce<T>(valor: T, ms = 300): T {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(timer);
  }, [valor, ms]);

  return retrasado;
}
