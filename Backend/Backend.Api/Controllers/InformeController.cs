using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/informes")]
    public class InformeController(IInformeService informeService) : Controller
    {
        [HttpGet]
        [ProducesResponseType<PagedResponse<InformeListItemDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAll([FromQuery] InformeSearchCriteria criteria, DateTime? fecha, CancellationToken ct)
        {
            var result = await informeService.GetAllAsync(criteria, fecha, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType<InformeDetalleDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var result = await informeService.GetByIdAsync(id, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPost("~/api/pacientes/{pacienteId:int}/informes")]
        [ProducesResponseType<InformeDto>(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Create(int pacienteId, CreateInformeRequest request, CancellationToken ct)
        {
            var result = await informeService.CreateAsync(pacienteId, request, ct);
            return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) : ToError(result.Error, result.ErrorCode);
        }

        private ObjectResult ToError(string? error, string? code)
        {
            var status = code switch
            {
                ErrorCodes.NotFound => StatusCodes.Status404NotFound,
                ErrorCodes.Forbidden => StatusCodes.Status403Forbidden,
                ErrorCodes.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(detail: error, statusCode: status, title: code);
        }
    }
}
