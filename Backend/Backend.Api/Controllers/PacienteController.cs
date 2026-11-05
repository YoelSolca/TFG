using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/pacientes")]
    public class PacienteController(IPacienteService pacienteService) : Controller
    {
        [HttpGet()]
        [ProducesResponseType<PagedResponse<PacienteListItemDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? tipoDificultadId, [FromQuery] int page = 1, [FromQuery] int pageSize = 5, CancellationToken ct = default)
        {
            var result = await pacienteService.GetPacientesAsync(search, tipoDificultadId, page, pageSize, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("{pacienteId:int}/informacion")]
        [ProducesResponseType<PacienteDetalleDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int pacienteId, CancellationToken ct)
        {
            var result = await pacienteService.GetDetalleAsync(pacienteId, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("{pacienteId:int}/historial")]
        [ProducesResponseType<PacienteDetalleDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetHistorial(int pacienteId, int? tipoEjercicioId, DateTime? Fecha, int page = 1, int pageSize = 2, CancellationToken ct = default)
        {
            var result = await pacienteService.GetHistorialAsync(pacienteId, tipoEjercicioId, Fecha, page, pageSize, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("{pacienteId:int}/seguimiento")]
        [ProducesResponseType<IReadOnlyList<SesionSeguimientoDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetSeguimiento(int pacienteId, DateTime? desde, DateTime? hasta, CancellationToken ct = default)
        {
            var result = await pacienteService.GetSeguimientoAsync(pacienteId, desde, hasta, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("{pacienteId:int}/informes")]
        [ProducesResponseType<PacienteDetalleDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetInformes(int pacienteId, DateTime? Fecha, int page = 1, int pageSize = 2, CancellationToken ct = default)
        {
            var result = await pacienteService.GetInformesAsync(pacienteId, Fecha, page, pageSize, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPost()]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create(CreatePacienteRequest request, CancellationToken ct)
        {
            var result = await pacienteService.CreatePacienteAsync(request, ct);

            if (!result.IsSuccess)
                return ToError(result.Error, result.ErrorCode);

            var registro = result.Value!;
            return registro.Creado
                ? CreatedAtAction(nameof(GetById), new { pacienteId = registro.Paciente.personaId }, registro.Paciente)
                : Ok(registro.Paciente);
        }

        [HttpPut("{pacienteId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int pacienteId, UpsertPacienteRequest request, CancellationToken ct)
        {
            var result = await pacienteService.UpdatePacienteAsync(pacienteId, request, ct);
            return result.IsSuccess
                ? Ok(result.Value)
                : ToError(result.Error, result.ErrorCode);
        }

        private ObjectResult ToError(string? error, string? code)
        {
            var status = code switch
            {
                ErrorCodes.NotFound => StatusCodes.Status404NotFound,
                ErrorCodes.Unauthorized => StatusCodes.Status401Unauthorized,
                ErrorCodes.Duplicate => StatusCodes.Status409Conflict,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(detail: error, statusCode: status, title: code);
        }

    }
}
