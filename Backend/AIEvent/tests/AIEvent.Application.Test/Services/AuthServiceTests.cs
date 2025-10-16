using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IJwtService> _mockJwtService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly IAuthService _authService;

        public AuthServiceTests()
        {
            // Khởi tạo mock cho các dependency
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockJwtService = new Mock<IJwtService>();
            _mockMapper = new Mock<IMapper>();
            _mockEmailService = new Mock<IEmailService>();
            _authService = new AuthService(_mockUnitOfWork.Object,
                                               _mockJwtService.Object,
                                               _mockMapper.Object,
                                               _mockEmailService.Object);
        }
        #region Login
        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnSuccessResult()
        {
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "123"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123") 
            };

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(users.Object);

            var accessToken = "access-token";
            var refreshToken = "refresh-token";

            _mockJwtService.Setup(x => x.GenerateAccessToken(user))
                           .Returns(accessToken);
            _mockJwtService.Setup(x => x.GenerateRefreshToken())
                           .Returns(refreshToken);

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                           .ReturnsAsync(1);

            var result = await _authService.LoginAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value!.RefreshToken.Should().Be(refreshToken);
        }


        [Fact]
        public async Task LoginAsync_WithInactiveUser_ShouldReturnFailureResult()
        {
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "123"
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = false
            };

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                            .Returns(users.Object);

            var result = await _authService.LoginAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ShouldReturnFailureResult()
        {
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "321"
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(users.Object);

            var result = await _authService.LoginAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid email or password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task LoginAsync_WithValidRole_ShouldReturnFailureResult()
        {
            var request = new LoginRequest
            {
                Email = "test@gmail.com",
                Password = "123"
            };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

            var result = await _authService.LoginAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Role not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        #endregion

        #region Register
        [Fact]
        public async Task RegisterAsync_WithValidCredentials_ShouldReturnSuccessResult()
        {
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "johndoe@example.com",
                Password = "StrongPassword123!",
                ConfirmPassword = "StrongPassword123!",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>
                {
                    
                },
                InterestedCities = new List<InterestedCities>
                {
                    new InterestedCities{ CityName = "HoChiMinh" }
                },
                ParticipationFrequency = ParticipationFrequency.Monthly,
                BudgetOption = BudgetOption.From500kTo2M,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = false
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var accessToken = "access-token";
            var refreshToken = "refresh-token";

            _mockMapper.Setup(x => x.Map<User>(request)).Returns(user);
            _mockJwtService.Setup(x => x.GenerateAccessToken(user)).Returns(accessToken);
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns(refreshToken);
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _authService.RegisterAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ShouldReturnFailure()
        {
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "johndoe@example.com",
                Password = "StrongPassword123!",
                ConfirmPassword = "StrongPassword123!",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>
                {
                },
                InterestedCities = new List<InterestedCities>
                {
                    new InterestedCities{ CityName = "Hanoi" },
                    new InterestedCities{ CityName = "HoChiMinh" }
                },
                ParticipationFrequency = ParticipationFrequency.Monthly,
                BudgetOption = BudgetOption.From500kTo2M,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = false
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var result = await _authService.RegisterAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Email address is already registered");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task RegisterAsync_WhenCreateUserFails_ShouldReturnFailure()
        {
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "johndoe@example.com",
                Password = "StrongPassword123!",
                ConfirmPassword = "StrongPassword123!",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>
                {
                },
                InterestedCities = new List<InterestedCities>
                {
                    new InterestedCities{ CityName = "Hanoi" },
                    new InterestedCities{ CityName = "HoChiMinh" }
                },
                ParticipationFrequency = ParticipationFrequency.Monthly,
                BudgetOption = BudgetOption.From500kTo2M,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = false
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            _mockMapper.Setup(x => x.Map<User>(request)).Returns(user);

            var result = await _authService.RegisterAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to create user account");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task RegisterAsync_WhenAddToRoleFails_ShouldReturnFailure()
        {
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "johndoe@example.com",
                Password = "StrongPassword123!",
                ConfirmPassword = "StrongPassword321!",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>
                {
                },
                InterestedCities = new List<InterestedCities>
                {
                    new InterestedCities{ CityName = "Hanoi" },
                    new InterestedCities{ CityName = "HoChiMinh" }
                },
                ParticipationFrequency = ParticipationFrequency.Monthly,
                BudgetOption = BudgetOption.From500kTo2M,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = false
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var roles = new List<string> { "User" };

            _mockMapper.Setup(x => x.Map<User>(request)).Returns(user);
            var result = await _authService.RegisterAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to assign role to user");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion

        #region RefreshToken
        [Fact]
        public async Task RefreshTokenAsync_WithValidCredentials_ShouldReturnSuccessResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };

            var accessToken = "new-access-token";
            var refreshToken = "new-refresh-token";

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            var newTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);

            _mockJwtService.Setup(x => x.GenerateAccessToken(exitingToken.User)).Returns(accessToken);
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns(refreshToken);
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.UpdateAsync(exitingToken));
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(newTokenEntity));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync());


            var result = await _authService.RefreshTokenAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value!.RefreshToken.Should().Be(refreshToken);
        }

        [Fact]
        public async Task RefreshTokenAsync_WithTokenIsRevoked_ShouldReturnFailureResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = true,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);
            
            var result = await _authService.RefreshTokenAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
        }

        [Fact]
        public async Task RefreshTokenAsync_WithExpiredToken_ShouldReturnFailureResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(-1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);

            var result = await _authService.RefreshTokenAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
        }

        [Fact]
        public async Task RefreshTokenAsync_WithNoRole_ShouldReturnFailureResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);


            var result = await _authService.RefreshTokenAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Role not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }
        #endregion

        #region RevokeRefreshToken
        [Fact]
        public async Task RevokeRefreshTokenAsync_WithValidCredentials_ShouldReturnSuccessResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.UpdateAsync(exitingToken));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync());

            var result = await _authService.RevokeRefreshTokenAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task RevokeRefreshTokenAsync_WithInValidCredentials_ShouldReturnFailureResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };

            var exitingToken = new RefreshToken
            {
                Token = "old-refresh-token",
                User = user,
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);

            var result = await _authService.RevokeRefreshTokenAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
        }

        [Fact]
        public async Task RevokeRefreshTokenAsync_WithTokenIsRevoked_ShouldReturnFailureResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = true,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);

            var result = await _authService.RevokeRefreshTokenAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
        }

        [Fact]
        public async Task RevokeRefreshTokenAsync_WithTokenExpired_ShouldReturnFailureResult()
        {
            var request = "refresh-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };

            var exitingToken = new RefreshToken
            {
                Token = request,
                User = user,
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(-1)
            };

            var refreshTokens = new List<RefreshToken> { exitingToken }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(r => r.RefreshTokenRepository.Query(false)).Returns(refreshTokens.Object);

            var result = await _authService.RevokeRefreshTokenAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
        }
        #endregion
    }
}
