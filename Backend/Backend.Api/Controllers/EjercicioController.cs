using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/ejercicios")]
    public class EjercicioController(IEjercicioService ejercicioService) : Controller
    {
        [HttpGet]
        [ProducesResponseType<PagedResponse<EjercicioDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] EjercicioSearchCriteria criteria, CancellationToken ct = default)
            => Ok(await ejercicioService.GetAllEjercicioAsync(criteria, ct));

        [HttpGet("realizados")]
        [ProducesResponseType<PagedResponse<EjercicioRealizadoItemDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetRealizados([FromQuery] EjercicioRealizadoSearchCriteria criteria, DateTime? fecha, CancellationToken ct)
        {
            var result = await ejercicioService.GetRealizadosAsync(criteria, fecha, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        private ObjectResult ToError(string? error, string? code)
        {
            var status = code switch
            {
                ErrorCodes.NotFound => StatusCodes.Status404NotFound,
                ErrorCodes.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(detail: error, statusCode: status, title: code);
        }
    }
}
