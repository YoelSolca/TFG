import { Box, Tooltip, Typography } from "@mui/material";
import type { Semana } from "../utils/Evolucion";

export const AZUL = "#2563EB";
export const AZUL_OSCURO = "#1E3A8A";
export const VACIO = "#E9EDF4";

// Cuadradito de color con su texto, para las referencias de cada bloque.
export function Referencia({ color, texto }: { color: string; texto: string }) {
  return (
    <span>
      <Box
        component="span"
        sx={{ display: "inline-block", width: 10, height: 10, borderRadius: "2px", bgcolor: color, mr: 0.75 }}
      />
      {texto}
    </span>
  );
}

// Número grande con su rótulo, para el resumen de la constancia.
export function Dato({ valor, rotulo, pista }: { valor: string | number; rotulo: string; pista?: string }) {
  return (
    <Box className="rounded-[10px] border border-[#E3E8F0] p-3">
      <Typography className="text-[26px] font-semibold leading-8">{valor}</Typography>
      <Typography variant="body2">{rotulo}</Typography>
      <Typography variant="caption" color="text.secondary">
        {pista ?? " "}
      </Typography>
    </Box>
  );
}

// Una columna por semana, con el mes escrito sobre la primera semana de cada mes.
export function TiraSemanas({ semanas }: { semanas: Semana[] }) {
  const color = (n: number) => (n === 0 ? VACIO : n === 1 ? AZUL : AZUL_OSCURO);

  return (
    // Una sola fila: los cuadrados se achican si hay muchas semanas (máximo 26 px).
    <Box className="flex gap-[4px]">
      {semanas.map((s, i) => (
        <Box key={s.inicio.valueOf()} className="flex flex-col gap-1" sx={{ flex: "1 1 0", minWidth: 0, maxWidth: 26 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            className="h-4 leading-4 whitespace-nowrap overflow-visible"
          >
            {i === 0 || semanas[i - 1].numeroMes !== s.numeroMes ? s.mes : ""}
          </Typography>
          <Tooltip
            arrow
            title={`Semana del ${s.inicio.format("D/M")}: ${s.cantidad === 0 ? "sin sesión" : `${s.cantidad} ${s.cantidad === 1 ? "sesión" : "sesiones"}`}`}
          >
            <Box sx={{ width: "100%", aspectRatio: "1 / 1", borderRadius: "4px", bgcolor: color(s.cantidad) }} />
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}
