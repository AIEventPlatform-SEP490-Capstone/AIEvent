using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            IMapper mapper,
            IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _mapper = mapper;
            _emailService = emailService;
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            var user = await _unitOfWork.UserRepository.Query()
                                .Include(u => u.OrganizerProfile)
                                .Include(u => u.Role)
                                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !user.IsActive)
            {
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            }

            if (!Verify(request.Password ,user.PasswordHash!))
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
            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .Include(rt => rt.User)
                    .ThenInclude(rtu => rtu.OrganizerProfile)
                .Include(rt => rt.User)
                    .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null || !tokenEntity.IsActive)
            {
                return ErrorResponse.FailureResult("Invalid or expired refresh token", ErrorCodes.TokenInvalid);
            }

            var user = tokenEntity.User;

            var newAccessToken = _jwtService.GenerateAccessToken(user);
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

        public async Task<Result<AuthResponse>> VerifyOTPAsync(VerifyOTPRequest request)
        {
            var user = await _unitOfWork.UserRepository
                    .Query()
                        .Include(u => u.OrganizerProfile)
                        .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);


            var otp = await _unitOfWork.UserOtpsRepository
                    .Query()
                    .Where(o => o.UserId == user.Id && !o.IsDeleted)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync();

            if (otp == null)
                return ErrorResponse.FailureResult("OTP not found", ErrorCodes.TokenInvalid);

            if (otp.ExpiredAt < DateTime.UtcNow)
            {
                await _unitOfWork.UserOtpsRepository.DeleteAsync(otp);
                await _unitOfWork.SaveChangesAsync();
                return ErrorResponse.FailureResult("OTP code has expired", ErrorCodes.TokenInvalid);
            }

            var otpHashInput = Verify(request.OTPCode, otp.Code);
            if (!otpHashInput)
                return ErrorResponse.FailureResult("Invalid OTP", ErrorCodes.TokenInvalid);

            user.IsActive = true;
            await _unitOfWork.UserRepository.UpdateAsync(user);
            await _unitOfWork.UserOtpsRepository.DeleteAsync(otp);

            var accessToken = _jwtService.GenerateAccessToken(otp.User);
            var refreshToken = _jwtService.GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = otp.UserId,
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
            var existingUser = await _unitOfWork.UserRepository
                                                .Query()
                                                .FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return ErrorResponse.FailureResult("Email address is already registered", ErrorCodes.InvalidInput);
            }

            var role = await _unitOfWork.RoleRepository
                                    .Query()
                                    .FirstOrDefaultAsync(r => r.Name == "User");
            if (role == null)
            {
                return ErrorResponse.FailureResult("Not found role", ErrorCodes.NotFound);
            }

            var user = _mapper.Map<User>(request);
            user.PasswordHash = Hash(request.Password);
            user.RoleId = role.Id;
            user.IsActive = false;
            
            var result = await _unitOfWork.UserRepository.AddAsync(user);
            if (result == null)
            {
                return ErrorResponse.FailureResult("Failed to create user account", ErrorCodes.InvalidInput);
            }

            var userOtps = await _emailService.SendOtpAsync(request.Email);
            if (!userOtps.IsSuccess)
            {
                return ErrorResponse.FailureResult("Failed to send email", ErrorCodes.InternalServerError);
            }

            var otp = new UserOtps
            {
                Code = Hash(userOtps.Value!.Code),
                ExpiredAt = userOtps.Value.ExpiredAt,
                Purpose = PurposeStatus.Register,
                UserId = user.Id,
            };

            await _unitOfWork.UserOtpsRepository.AddAsync(otp);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> RevokeRefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _unitOfWork.RefreshTokenRepository
                .Query()
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null || !tokenEntity!.IsActive)
            {
                return ErrorResponse.FailureResult("Invalid or expired refresh token", ErrorCodes.TokenInvalid);
            }

            tokenEntity.IsRevoked = true;
            tokenEntity.RevokedAt = DateTime.UtcNow;

            await _unitOfWork.RefreshTokenRepository.UpdateAsync(tokenEntity);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        private bool Verify(string password = "", string hashedPassword = "")
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Mật khẩu không được để trống", nameof(password));
            }

            if (string.IsNullOrEmpty(hashedPassword))
            {
                throw new ArgumentException("Hash không được để trống", nameof(hashedPassword));
            }

            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        private string Hash(string password, int workFactor = 12)
        {
            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("Mật khẩu không được để trống", nameof(password));
            }

            if (workFactor < 4 || workFactor > 31)
            {
                throw new ArgumentException("Work factor phải nằm trong khoảng 4-31", nameof(workFactor));
            }

            return BCrypt.Net.BCrypt.HashPassword(password, workFactor);
        }
    }
}
