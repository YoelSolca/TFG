using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/tipos-dificultad")]
    public class TipoDificultadController(IPacienteService pacienteService) : Controller
    {
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<TipoDificultadDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken ct)
            => Ok(await pacienteService.GetTiposDificultadAsync(ct));
    }
}
