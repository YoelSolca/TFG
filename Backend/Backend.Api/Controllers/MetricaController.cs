using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/metricas")]
    public class MetricaController(IMetricaService metricaService) : Controller
    {
        [HttpGet]
        [ProducesResponseType<IReadOnlyList<MetricaDto>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken ct)
            => Ok(await metricaService.GetAllAsync(ct));
    }
}
