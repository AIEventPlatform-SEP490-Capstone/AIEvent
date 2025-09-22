using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Auth;
using AIEvent.Application.DTO.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly IMapper _mapper;

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _userManager = userManager;
            _signInManager = signInManager;
            _mapper = mapper;
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
            {
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return ErrorResponse.FailureResult("Invalid email or password", ErrorCodes.Unauthorized);
            }

            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            await _unitOfWork.RefreshTokenRepository.AddAsync(refreshTokenEntity);
            await _unitOfWork.SaveChangesAsync();

            var authResponse = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            return Result<AuthResponse>.Success(authResponse);
        }

        public async Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null || !tokenEntity.IsActive)
            {
                return ErrorResponse.FailureResult("Invalid or expired refresh token", ErrorCodes.TokenInvalid);
            }

            var user = tokenEntity.User;
            var roles = await _userManager.GetRolesAsync(user);
            var newAccessToken = _jwtService.GenerateAccessToken(user, roles);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            tokenEntity.IsRevoked = true;
            tokenEntity.RevokedAt = DateTime.UtcNow;
            tokenEntity.ReplacedByToken = newRefreshToken;
            await _unitOfWork.RefreshTokenRepository.UpdateAsync(tokenEntity);

            var newTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            await _unitOfWork.RefreshTokenRepository.AddAsync(newTokenEntity);
            await _unitOfWork.SaveChangesAsync();

            var authResponse = new AuthResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            return Result<AuthResponse>.Success(authResponse);
        }

        public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return ErrorResponse.FailureResult("Email address is already registered", ErrorCodes.InvalidInput);
            }
            var user = _mapper.Map<AppUser>(request);

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return ErrorResponse.FailureResult("Failed to create user account", ErrorCodes.InvalidInput);
            }

            await _userManager.AddToRoleAsync(user, "User");

            var roles = new List<string> { "User" }; 
            var accessToken = _jwtService.GenerateAccessToken(user, roles);
            var refreshToken = _jwtService.GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            await _unitOfWork.RefreshTokenRepository.AddAsync(refreshTokenEntity);
            await _unitOfWork.SaveChangesAsync();

            var authResponse = new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            return Result<AuthResponse>.Success(authResponse);
        }

        public async Task<Result> RevokeRefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity != null && tokenEntity.IsActive)
            {
                tokenEntity.IsRevoked = true;
                tokenEntity.RevokedAt = DateTime.UtcNow;
                tokenEntity.ReasonRevoked = "Revoked by user";

                await _unitOfWork.RefreshTokenRepository.UpdateAsync(tokenEntity);
                await _unitOfWork.SaveChangesAsync();
            }

            return Result.Success();
        }

        public async Task<Result<bool>> ValidateRefreshTokenAsync(string refreshToken, string userId)
        {
            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.UserId.ToString() == userId);

            var isValid = tokenEntity != null && tokenEntity.IsActive;
            return Result<bool>.Success(isValid);
        }
    }
}
