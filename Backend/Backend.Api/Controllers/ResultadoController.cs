using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/sesiones/{sesionId:int}/ejercicios/{ejercicioId:int}/resultado")]
    public class ResultadoController(IResultadoService resultadoService) : Controller
    {
        [HttpGet]
        [ProducesResponseType<ResultadoDetalleDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(int sesionId, int ejercicioId, CancellationToken ct)
        {
            var result = await resultadoService.GetAsync(sesionId, ejercicioId, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        /// <summary>Registra el resultado del ejercicio, o lo reemplaza si se repitió en la misma sesión.</summary>
        [HttpPut]
        [ProducesResponseType<ResultadoDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Upsert(int sesionId, int ejercicioId, UpsertResultadoRequest request, CancellationToken ct)
        {
            var result = await resultadoService.UpsertAsync(sesionId, ejercicioId, request, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        private ObjectResult ToError(string? error, string? code)
        {
            var status = code switch
            {
                ErrorCodes.NotFound => StatusCodes.Status404NotFound,
                ErrorCodes.Unauthorized => StatusCodes.Status401Unauthorized,
                ErrorCodes.Forbidden => StatusCodes.Status403Forbidden,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(detail: error, statusCode: status, title: code);
        }
    }
}
