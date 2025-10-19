using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using System.ComponentModel.DataAnnotations;

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

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            IMapper mapper,
            IEmailService emailService,
            IHasherHelper hasherHelper,
            ICacheService cacheService)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _mapper = mapper;
            _emailService = emailService;
            _hasherHelper = hasherHelper;
            _cacheService = cacheService;
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            if(request == null)
                return ErrorResponse.FailureResult("Invalid email or password", ErrorCodes.Unauthorized);

            var context = new ValidationContext(request);
            var results = new List<ValidationResult>();
            bool isValid = Validator.TryValidateObject(request, context, results, true);
            if (!isValid)
                return ErrorResponse.FailureResult("Invalid email or password", ErrorCodes.Unauthorized);

            var user = await _unitOfWork.UserRepository
                                .Query()
                                .AsNoTracking()
                                .Include(u => u.OrganizerProfile)
                                .Include(u => u.Role)
                                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !user.IsActive)
            {
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            }

            if (!_hasherHelper.Verify(request.Password ,user.PasswordHash!))
            {
                return ErrorResponse.FailureResult("Invalid email or password", ErrorCodes.Unauthorized);
            }

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
            if (request == null)
                return ErrorResponse.FailureResult("Invalid email or otp code", ErrorCodes.Unauthorized);

            var context = new ValidationContext(request);
            var results = new List<ValidationResult>();
            bool isValid = Validator.TryValidateObject(request, context, results, true);
            if (!isValid)
                return ErrorResponse.FailureResult("Invalid email", ErrorCodes.Unauthorized);


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
            if (request == null || string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.Email) ||
        string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.ConfirmPassword))
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var context = new ValidationContext(request);
            var results = new List<ValidationResult>();
            bool isValid = Validator.TryValidateObject(request, context, results, true);
            if (!isValid)
            {
                var messages = string.Join("; ", results.Select(r => r.ErrorMessage));
                return ErrorResponse.FailureResult(messages, ErrorCodes.InvalidInput);
            }

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

            var userOtps = await _emailService.SendOtpAsync(request.Email, message);
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

        
    }
}
