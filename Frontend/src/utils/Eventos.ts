// Aviso entre pantallas que no se conocen: la de solicitudes lo dispara al aprobar, rechazar o suspender a alguien,
// y el menú lateral lo escucha para actualizar el globito de solicitudes pendientes.
export const SOLICITUDES_CAMBIARON = "solicitudes-cambiaron";

export const avisarCambioDeSolicitudes = () => window.dispatchEvent(new Event(SOLICITUDES_CAMBIARON));
