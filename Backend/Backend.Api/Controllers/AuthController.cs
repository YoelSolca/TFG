using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [Route("api/auth")]
    public class AuthController(IAuthService authService) : Controller
    {
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var result = await authService.LoginAsync(request);
            if (result.IsSuccess) return Ok(result.Value);

            // La contraseña era correcta pero la cuenta no está habilitada: no es un problema de credenciales (401), sino un 403.
            var cuentaNoHabilitada = result.ErrorCode is ErrorCodes.AccountPending or ErrorCodes.AccountRejected or ErrorCodes.AccountSuspended;
            return Problem(
                detail: result.Error,
                statusCode: cuentaNoHabilitada ? StatusCodes.Status403Forbidden : StatusCodes.Status401Unauthorized,
                title: result.ErrorCode);
        }


        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] string correoElectronico)
        {
            await authService.ForgotPasswordAsync(correoElectronico);

            return Ok(new { mensaje = "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPassword resetPassword)
        {
            var result = await authService.ResetPasswordAsync(resetPassword.Token, resetPassword.NuevaContrasenia);
            return result.IsSuccess
                ? Ok()
                : Problem(detail: result.Error, statusCode: StatusCodes.Status400BadRequest, title: result.ErrorCode);
        }
    }
}
