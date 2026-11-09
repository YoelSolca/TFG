import { useParams } from "react-router-dom";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import { obtenerHistorialPaciente } from "../../actions/Pacientes.action";
import { CenteredPagination, DateFilter, ExerciseTypeIcon } from "../../components/Common";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TipoEjercicio } from "../../models/Paciente.model";
import { Box, Card, Chip, Divider, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { filtrarHistorialPacientePorTipoEjercicio } from "../../actions/TipoEjercicio.action";

export function TypeFilterChips({
  value,
  onChange,
}: {
  value: string | number;
  onChange: Dispatch<SetStateAction<string | number>>;
}) {
  const [tipoEjercicio, setTipoEjercicio] = useState<TipoEjercicio[]>([]);

  useEffect(() => {
    filtrarHistorialPacientePorTipoEjercicio()
      .then((response) => {
        setTipoEjercicio(response);
      })
      .catch((error) => {
        console.error("Error al filtrar historial del paciente por tipo de ejercicio:", error);
      });
  }, []);

  return (
    <Stack direction="row" useFlexGap className="gap-2 flex-wrap">
      <Chip
        label="Todas"
        color={value === "Todas" ? "primary" : "default"}
        variant={value === "Todas" ? "filled" : "outlined"}
        onClick={() => onChange("Todas")}
      ></Chip>

      {tipoEjercicio.map((tipo) => (
        <Chip
          key={tipo.id}
          label={tipo.nombre}
          color={value === tipo.id ? "primary" : "default"}
          variant={value === tipo.id ? "filled" : "outlined"}
          onClick={() => onChange(tipo.id)}
        />
      ))}
    </Stack>
  );
}

export default function Historial() {
  const { id } = useParams();
  const [type, setType] = useState<string | number>("Todas");
  const [fecha, setFecha] = useState<Date>();
  const {
    items: historial,
    page,
    setPage,
    totalPages,
    cargado,
  } = useListaPaginada(
    (p) => obtenerHistorialPaciente(id!, type === "Todas" ? undefined : Number(type), fecha, p),
    [id, type, fecha],
    "Error al obtener historial del paciente:",
  );

  return (
    <>
      <Stack direction="row" useFlexGap className="gap-4 flex-wrap items-center justify-between">
        <TypeFilterChips value={type} onChange={setType} />
        <DateFilter date={fecha} onChange={(d) => setFecha(d)} />
      </Stack>

      {historial.map((item) => (
        <Card className="p-6 flex flex-col gap-4">
          <Stack direction="row" useFlexGap className="gap-4 flex-wrap items-center">
            <ExerciseTypeIcon icon={item.tipoEjercicio} size={40} />
            <Box className="flex-1 min-w-50">
              <Typography variant="subtitle1">
                {item.tipoEjercicio} · {item.ejercicio}
              </Typography>
              <Typography variant="body2">{dayjs(item.fecha.toString()).format("DD/MM/YYYY")}</Typography>
            </Box>
            <Stack direction="row" useFlexGap className="gap-2 flex-wrap">
              <Chip size="small" variant="outlined" label={`Aciertos: ${item.aciertos}`} />
              <Chip size="small" variant="outlined" label={`Errores: ${item.errores}`} />
              {item.metricas.map((metrica) => (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${metrica.nombre.charAt(0).toUpperCase() + metrica.nombre.slice(1)}: ${metrica.valor} ${metrica.unidad ? metrica.unidad : ""}`}
                />
              ))}
              <Chip size="small" variant="outlined" label={`Tiempo: ${item.tiempoSegundos} seg`} />
            </Stack>
          </Stack>
          <Divider />

          <Box>
            <Typography variant="body2" className="font-medium mb-2">
              Observaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.observaciones}
            </Typography>
          </Box>
        </Card>
      ))}
      {cargado && !historial.length && (
        <Card className="p-10 text-center">
          <Typography color="text.secondary">
            {type !== "Todas" || fecha
              ? "No hay ejercicios en el historial que coincidan con los filtros."
              : "Este paciente todavía no tiene ejercicios en su historial."}
          </Typography>
        </Card>
      )}
      <CenteredPagination page={page} count={totalPages} onChange={(t) => setPage(t)} />
    </>
  );
}
