import { useParams } from "react-router-dom";
import { obtenerHistorialPaciente } from "../../actions/pacientes.action";
import {
  CenteredPagination,
  DateFilter,
  ExerciseTypeIcon,
} from "../../components/common";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  HistorialPacienteItem,
  TipoEjercicio,
} from "../../Model/paciente.model";
import { Box, Card, Chip, Divider, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { filtrarHistorialPacientePorTipoEjercicio } from "../../actions/tipoEjercicio.action";

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
        console.log("Tipos de ejercicio:", response);
        setTipoEjercicio(response);
      })
      .catch((error) => {
        console.error(
          "Error al filtrar historial del paciente por tipo de ejercicio:",
          error,
        );
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
  const [historial, setHistorial] = useState<HistorialPacienteItem[]>([]);
  const [type, setType] = useState<string | number>("Todas");
  const [page, setPage] = useState(1); // la página que se está viendo
  const [totalPages, setTotalPages] = useState(1);
  const [fecha, setFecha] = useState<Date>();
  useEffect(() => {
    obtenerHistorialPaciente(
      id!,
      type === "Todas" ? undefined : Number(type),
      fecha,
      page,
    )
      .then((response) => {
        console.log("Historial del paciente:", response);
        setHistorial(response.items); // Asignar el primer elemento del historial a la variable de estado
        setTotalPages(Math.ceil(response.total / response.pageSize)); // Calcula el total de páginas según la cantidad de pacientes y el tamaño de página (10)
      })
      .catch((error) => {
        console.error("Error al obtener historial del paciente:", error);
      });
  }, [type, id, page, fecha]); // Se ejecuta cada vez que type o id cambian, y realiza la solicitud para obtener el historial del paciente filtrado según el tipo de ejercicio seleccionado.

  return (
    <>
      <Stack
        direction="row"
        useFlexGap
        className="gap-4 flex-wrap items-center justify-between"
      >
        <TypeFilterChips value={type} onChange={setType} />
        <DateFilter date={fecha} onChange={(d) => setFecha(d)} />
      </Stack>

      {historial.map((item) => (
        <Card className="p-6 flex flex-col gap-4">
          <Stack
            direction="row"
            useFlexGap
            className="gap-4 flex-wrap items-center"
          >
            <ExerciseTypeIcon icon={item.tipoEjercicio} size={40} />
            <Box className="flex-1 min-w-50">
              <Typography variant="subtitle1">
                {item.tipoEjercicio} · {item.ejercicio}
              </Typography>
              <Typography variant="body2">
                {dayjs(item.fecha.toString()).format("DD/MM/YYYY")}
              </Typography>
            </Box>
            <Stack direction="row" useFlexGap className="gap-2 flex-wrap">
              <Chip
                size="small"
                variant="outlined"
                label={`Aciertos: ${item.aciertos}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`Errores: ${item.errores}`}
              />
              {item.metricas.map((metrica) => (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${metrica.nombre.charAt(0).toUpperCase() + metrica.nombre.slice(1)}: ${metrica.valor} ${metrica.unidad ? metrica.unidad : ""}`}
                />
              ))}
              <Chip
                size="small"
                variant="outlined"
                label={`Tiempo: ${item.tiempoSegundos} seg`}
              />
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
      <CenteredPagination
        page={page}
        count={totalPages}
        onChange={(t) => setPage(t)}
      />
    </>
  );
}
