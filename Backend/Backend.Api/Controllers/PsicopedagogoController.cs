using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PsicopedagogoController(IPsicopedagogoService psicopedagogoService) : Controller
    {

        [HttpGet()]
        [ProducesResponseType<PagedResponse<PsicopedagogoDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAll([FromQuery] PsicopedagogoSearchCriteria criteria, CancellationToken ct = default)
           => Ok(await psicopedagogoService.GetPsicopedagogosAsync(criteria, ct));

        [HttpGet("{psicopedagogoId:int}")]
        [ProducesResponseType<PsicopedagogoDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int psicopedagogoId, CancellationToken ct)
        {
            var result = await psicopedagogoService.GetByPsicopedagogoIdAsync(psicopedagogoId);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType<PsicopedagogoDto>(StatusCodes.Status201Created)]
        public async Task<IActionResult> Create(CreatePsicopedagogoRequest request, CancellationToken ct)
        {
            var result = await psicopedagogoService.CreatepsicopedagogoAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { psicopedagogoId = result.Value!.PersonaId }, result.Value);
        }

        [HttpPut("{psicopedagogoId:int}")]
        [ProducesResponseType<PsicopedagogoDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateAsync(int psicopedagogoId, UpsertPsicopedagogoRequest request, CancellationToken ct)
        {
            var result = await psicopedagogoService.UpdateAsync(psicopedagogoId, request, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        [HttpPut("{psicopedagogoId:int}/state")]
        [ProducesResponseType<PsicopedagogoDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateAsync(int psicopedagogoId, UpdateStateRequest request, CancellationToken ct)
        {
            var result = await psicopedagogoService.UpdateStateAsync(psicopedagogoId, request, ct);
            return result.IsSuccess ? Ok(result.Value) : ToError(result.Error, result.ErrorCode);
        }

        private ObjectResult ToError(string? error, string? code)
        {
            var status = code switch
            {
                ErrorCodes.NotFound => StatusCodes.Status404NotFound,
                _ => StatusCodes.Status400BadRequest
            };

            return Problem(detail: error, statusCode: status, title: code);
        }
    }
}
