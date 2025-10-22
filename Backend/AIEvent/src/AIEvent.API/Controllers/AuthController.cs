using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
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

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            Response.Cookies.Append("refreshToken", result.Value!.RefreshToken!, new CookieOptions
            {
                HttpOnly = true,            
                Secure = true,              
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(SuccessResponse<AuthResponse>.SuccessResult(result.Value!));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<object>>> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Registration successful. Send email successfully"));
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<AuthResponse>>> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized("Refresh token not found");

            var result = await _authService.RefreshTokenAsync(refreshToken);

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            Response.Cookies.Append("refreshToken", result.Value!.RefreshToken!, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(SuccessResponse<AuthResponse>.SuccessResult(
                result.Value!,
                message: "Token refreshed successfully"));
        }

        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<AuthResponse>>> VerifyOTP([FromBody] VerifyOTPRequest request)
        {
            var result = await _authService.VerifyOTPAsync(request);

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            Response.Cookies.Append("refreshToken", result.Value!.RefreshToken!, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(SuccessResponse<AuthResponse>.SuccessResult(result.Value!));
        }

        [HttpPost("revoke-token")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> RevokeToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized("Refresh token not found");

            var result = await _authService.RevokeRefreshTokenAsync(refreshToken);

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            Response.Cookies.Delete("refreshToken");

            return Ok(SuccessResponse<object>.SuccessResult(
                null!,
                message: "Token revoked successfully"));
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _authService.ChangePasswordAsync(userId, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Change password successfully"));
        }
    }
}
