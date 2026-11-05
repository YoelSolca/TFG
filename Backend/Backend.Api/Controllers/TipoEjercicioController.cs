using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/tipos-ejercicio")]
    public class TipoEjercicioController(IEjercicioService ejercicioService) : Controller
    {
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<TipoEjercicioDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken ct)
            => Ok(await ejercicioService.GetTiposEjercicioAsync(ct));
    }
}
