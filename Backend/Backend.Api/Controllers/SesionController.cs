using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{

    [ApiController]
    [Route("api/sesiones")]
    public class SesionController(ISesionService sesionService) : Controller
    {

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] SesionSearchCriteria criteria, DateTime? fecha, CancellationToken ct)
        {
            var result = await sesionService.GetAllAsync(criteria, fecha, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }


        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var result = await sesionService.GetByIdAsync(id, ct);

            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("{id:int}/ejercicios")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEjercicios(int id, [FromQuery] SesionEjerciciosCriteria criteria, CancellationToken ct)
        {
            var result = await sesionService.GetEjerciciosAsync(id, criteria, ct);

            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create(CreateSesionRequest request, CancellationToken ct)
        {
            var result = await sesionService.AddAsync(request, ct);

            return result.IsSuccess
                ? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value)
                : ToError(result.Error, result.ErrorCode);
        }



        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(int id, UpsertSesionRequest request, CancellationToken ct)
        {
            var result = await sesionService.UpdateAsync(id, request, ct);

            return result.IsSuccess
                ? Ok(result.Value)
                : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("planificada")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPlanificada([FromQuery] int pacienteId, CancellationToken ct)
        {
            var result = await sesionService.GetPlanificadaAsync(pacienteId, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPost("{id:int}/iniciar")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Iniciar(int id, CancellationToken ct)
        {
            var result = await sesionService.IniciarAsync(id, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPost("{id:int}/finalizar")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Finalizar(int id, CancellationToken ct)
        {
            var result = await sesionService.FinalizarAsync(id, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        private ObjectResult ToError(string? error, string? code)
        {
            var status = code switch
            {
                ErrorCodes.NotFound => StatusCodes.Status404NotFound,
                ErrorCodes.Unauthorized => StatusCodes.Status401Unauthorized,
                ErrorCodes.Duplicate => StatusCodes.Status409Conflict,
                ErrorCodes.Forbidden => StatusCodes.Status403Forbidden,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(detail: error, statusCode: status, title: code);
        }
    }
}
