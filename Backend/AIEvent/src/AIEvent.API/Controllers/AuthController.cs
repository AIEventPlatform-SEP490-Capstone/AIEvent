using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<AuthResponse>.SuccessResult(result.Value!));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<AuthResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Created,
                "Registration successful"));
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshTokenAsync(request.RefreshToken);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<AuthResponse>.SuccessResult(
                result.Value!,
                message: "Token refreshed successfully"));
        }

        [HttpPost("revoke-token")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> RevokeToken([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RevokeRefreshTokenAsync(request.RefreshToken);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                null!,
                message: "Token revoked successfully"));
        }
    }
}
