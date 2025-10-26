using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace AIEvent.Application.Services.Implements
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IHasherHelper _hasherHelper;
        private readonly ICacheService _cacheService;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            IMapper mapper,
            IEmailService emailService,
            IHasherHelper hasherHelper,
            ICacheService cacheService,
            IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _mapper = mapper;
            _emailService = emailService;
            _hasherHelper = hasherHelper;
            _cacheService = cacheService;
            _configuration = configuration;
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return ErrorResponse.FailureResult("Invalid email or password", ErrorCodes.Unauthorized);

            var user = await _unitOfWork.UserRepository
                                .Query()
                                .AsNoTracking()
                                .Include(u => u.OrganizerProfile)
                                .Include(u => u.Role)
                                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !user.IsActive)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            if (!_hasherHelper.Verify(request.Password ,user.PasswordHash!))
                return ErrorResponse.FailureResult("Invalid email or password", ErrorCodes.Unauthorized);

            var accessToken = _jwtService.GenerateAccessToken(user);
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
            if (string.IsNullOrEmpty(refreshToken))
                return ErrorResponse.FailureResult("Invalid refresh token", ErrorCodes.TokenInvalid);

            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .Include(rt => rt.User)
                    .ThenInclude(rtu => rtu.OrganizerProfile)
                .Include(rt => rt.User)
                    .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null || !tokenEntity.IsActive)
                return ErrorResponse.FailureResult("Invalid or expired refresh token", ErrorCodes.TokenInvalid);

            var user = tokenEntity.User;

            var newAccessToken = _jwtService.GenerateAccessToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            await _unitOfWork.RefreshTokenRepository.DeleteAsync(tokenEntity);

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

        public async Task<Result<AuthResponse>> VerifyOTPAsync(VerifyOTPRequest request)
        {
            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return ErrorResponse.FailureResult("Invalid email or otp code", ErrorCodes.Unauthorized);


            var otp = await _cacheService.GetAsync<string>($"Register {request.Email}");

            if (otp == null)
                return ErrorResponse.FailureResult("OTP not found", ErrorCodes.TokenInvalid);

            var user = await _unitOfWork.UserRepository
                    .Query()
                        .Include(u => u.OrganizerProfile)
                        .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            if (otp != request.OTPCode)
                return ErrorResponse.FailureResult("Invalid OTP", ErrorCodes.TokenInvalid);

            user.IsActive = true;
            await _unitOfWork.UserRepository.UpdateAsync(user);

            Wallet wallet = new()
            {
                UserId = user.Id,
                Balance = 0
            };
            await _unitOfWork.WalletRepository.AddAsync(wallet);

            var accessToken = _jwtService.GenerateAccessToken(user);
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

        public async Task<Result> RegisterAsync(RegisterRequest request)
        {
            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var existingUser = await _unitOfWork.UserRepository
                                                .Query()
                                                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
                return ErrorResponse.FailureResult("Email address is already registered", ErrorCodes.InvalidInput);

            var role = await _unitOfWork.RoleRepository
                                    .Query()
                                    .FirstOrDefaultAsync(r => r.Name == "User");
            if (role == null)
                return ErrorResponse.FailureResult("Not found role", ErrorCodes.NotFound);

            var user = _mapper.Map<User>(request);
            user.PasswordHash = _hasherHelper.Hash(request.Password);
            user.RoleId = role.Id;
            user.IsActive = false;
            
            var result = await _unitOfWork.UserRepository.AddAsync(user);
            if (result == null)
                return ErrorResponse.FailureResult("Failed to create user account", ErrorCodes.InvalidInput);


            var otpCode = new Random().Next(100000, 999999).ToString();
            var message = new MimeMessage
            {
                Subject = "Mã OTP của bạn",
                Body = new TextPart("plain")
                {
                    Text = $"Mã xác thực của bạn là: {otpCode}. Mã này sẽ hết hạn sau 5 phút."
                }
            };

            var userOtps = await _emailService.SendEmailAsync(request.Email, message);
            if (!userOtps.IsSuccess) {
                await _unitOfWork.UserRepository.DeleteAsync(user);
                return ErrorResponse.FailureResult("Failed to send email", ErrorCodes.InternalServerError);
            }
            await _cacheService.SetAsync($"Register {request.Email}", otpCode, TimeSpan.FromMinutes(5));
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
        public async Task<Result> RevokeRefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken))
                return ErrorResponse.FailureResult("Invalid refresh token", ErrorCodes.TokenInvalid);

            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null || !tokenEntity!.IsActive)
                return ErrorResponse.FailureResult("Invalid or expired refresh token", ErrorCodes.TokenInvalid);

            await _unitOfWork.RefreshTokenRepository.DeleteAsync(tokenEntity);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            
            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.Unauthorized);

            if (!user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User account is inactive", ErrorCodes.Unauthorized);

            if (!_hasherHelper.Verify(request.CurrentPassword, user.PasswordHash!))
                return ErrorResponse.FailureResult("Old password not true", ErrorCodes.InvalidInput);
            if (_hasherHelper.Verify(request.NewPassword, user.PasswordHash!))
                return ErrorResponse.FailureResult("New password cannot be the same as current password", ErrorCodes.InvalidInput);

            user.PasswordHash = _hasherHelper.Hash(request.NewPassword);
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<AuthResponse>> GoogleLoginAsync(GoogleLoginRequest request)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new List<string> { _configuration["Authentication:Google:ClientId"]! }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

                var user = await _unitOfWork.UserRepository.Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Email == payload.Email && payload.EmailVerified && !x.IsDeleted && x.IsActive);

                if(user == null)
                {
                    var roleId = await _unitOfWork.RoleRepository.Query()
                        .Where(r => r.Name == "User" && !r.IsDeleted)
                        .Select(r => r.Id)
                        .FirstOrDefaultAsync();

                    User newUser = new()
                    {
                        RoleId = roleId!,
                        Email = payload.Email,
                        IsActive = true,
                        FullName = payload.Name,
                        ParticipationFrequency = ParticipationFrequency.Monthly,
                        BudgetOption = BudgetOption.Flexible,
                    };
                    await _unitOfWork.UserRepository.AddAsync(newUser);

                    Wallet wallet = new()
                    {
                        UserId = newUser.Id,
                        Balance = 0,
                    };
                    await _unitOfWork.WalletRepository.AddAsync(wallet);
                }

                var accessToken = _jwtService.GenerateAccessToken(user!);
                var refreshToken = _jwtService.GenerateRefreshToken();

                var refreshTokenEntity = new RefreshToken
                {
                    Token = refreshToken,
                    UserId = user!.Id,
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
            catch (Exception ex)
            {
                throw new Exception($"Error: {ex.Message}");
            }
        }
    }
}
