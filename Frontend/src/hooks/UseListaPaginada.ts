import { useEffect, useRef, useState } from "react";

type Pagina<T> = { items: T[]; total: number; pageSize: number };

// Maneja una lista paginada que se pide al servidor: la página actual, el total de páginas y la carga.
// `filtros` son los valores que cambian lo que se pide (búsqueda, fecha, tipo...). Al cambiar alguno
// se vuelve a la primera página. `recargar` vuelve a pedir la página actual sin moverse de ella.
export function useListaPaginada<T>(
  cargar: (pagina: number) => Promise<Pagina<T>>,
  filtros: unknown[],
  mensajeError: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [version, setVersion] = useState(0);
  // Pasa a true cuando llega la primera respuesta: sirve para mostrar "no hay nada" sin que parpadee mientras carga.
  const [cargado, setCargado] = useState(false);

  // Se guarda la última versión de `cargar` para no tener que volver a pedir en cada render.
  const cargarRef = useRef(cargar);
  useEffect(() => {
    cargarRef.current = cargar;
  });

  // Al cambiar un filtro se vuelve a la primera página (se ajusta durante el render para pedir una sola vez).
  const clave = JSON.stringify(filtros);
  const [claveAnterior, setClaveAnterior] = useState(clave);
  if (clave !== claveAnterior) {
    setClaveAnterior(clave);
    setPage(1);
  }

  useEffect(() => {
    let vigente = true;
    cargarRef
      .current(page)
      .then((respuesta) => {
        if (!vigente) return; // llegó tarde: ya se pidió otra cosa
        setItems(respuesta.items);
        setTotalPages(Math.max(1, Math.ceil(respuesta.total / respuesta.pageSize)));
        setCargado(true);
      })
      .catch((error) => console.error(mensajeError, error));
    return () => {
      vigente = false;
    };
  }, [clave, page, version, mensajeError]);

  return { items, page, setPage, totalPages, cargado, recargar: () => setVersion((v) => v + 1) };
}
