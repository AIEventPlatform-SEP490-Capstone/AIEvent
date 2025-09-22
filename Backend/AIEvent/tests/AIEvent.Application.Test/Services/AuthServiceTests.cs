using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Auth;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IJwtService> _mockJwtService;
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<SignInManager<AppUser>> _mockSignInManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IGenericRepository<RefreshToken>> _mockRefreshTokenRepository;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockJwtService = new Mock<IJwtService>();
            _mockMapper = new Mock<IMapper>();
            _mockRefreshTokenRepository = new Mock<IGenericRepository<RefreshToken>>();

            var userStore = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            var claimsFactory = new Mock<IUserClaimsPrincipalFactory<AppUser>>();
            _mockSignInManager = new Mock<SignInManager<AppUser>>(
                _mockUserManager.Object, contextAccessor.Object, claimsFactory.Object, null!, null!, null!, null!);

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository).Returns(_mockRefreshTokenRepository.Object);

            _authService = new AuthService(
                _mockUnitOfWork.Object,
                _mockJwtService.Object,
                _mockUserManager.Object,
                _mockSignInManager.Object,
                _mockMapper.Object);
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnSuccessResult()
        {
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var roles = new List<string> { "User" };
            var accessToken = "mock-access-token";
            var refreshToken = "mock-refresh-token";

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Success);

            _mockUserManager.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(roles);

            _mockJwtService.Setup(x => x.GenerateAccessToken(user, roles))
                .Returns(accessToken);

            _mockJwtService.Setup(x => x.GenerateRefreshToken())
                .Returns(refreshToken);

            _mockRefreshTokenRepository.Setup(x => x.AddAsync(It.IsAny<RefreshToken>()))
                .ReturnsAsync((RefreshToken rt) => rt);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value.RefreshToken.Should().Be(refreshToken);
            result.Value.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromMinutes(1));

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false), Times.Once);
            _mockUserManager.Verify(x => x.GetRolesAsync(user), Times.Once);
            _mockJwtService.Verify(x => x.GenerateAccessToken(user, roles), Times.Once);
            _mockJwtService.Verify(x => x.GenerateRefreshToken(), Times.Once);
            _mockRefreshTokenRepository.Verify(x => x.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithNonExistentUser_ShouldReturnFailureResult()
        {
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "Password123!"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync((AppUser?)null);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(It.IsAny<AppUser>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WithInactiveUser_ShouldReturnFailureResult()
        {
            var loginRequest = new LoginRequest
            {
                Email = "inactive@example.com",
                Password = "Password123!"
            };

            var inactiveUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "inactive@example.com",
                UserName = "inactive@example.com",
                FullName = "Inactive User",
                IsActive = false 
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(inactiveUser);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(It.IsAny<AppUser>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ShouldReturnFailureResult()
        {
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "WrongPassword!"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                IsActive = true
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Failed);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid email or password");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false), Times.Once);
            _mockUserManager.Verify(x => x.GetRolesAsync(It.IsAny<AppUser>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WithLockedOutUser_ShouldReturnFailureResult()
        {
            var loginRequest = new LoginRequest
            {
                Email = "locked@example.com",
                Password = "Password123!"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "locked@example.com",
                UserName = "locked@example.com",
                FullName = "Locked User",
                IsActive = true
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.LockedOut);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid email or password");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false), Times.Once);
            _mockUserManager.Verify(x => x.GetRolesAsync(It.IsAny<AppUser>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WhenSaveChangesFails_ShouldThrowException()
        {
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                UserName = "test@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var roles = new List<string> { "User" };
            var accessToken = "mock-access-token";
            var refreshToken = "mock-refresh-token";

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Success);

            _mockUserManager.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(roles);

            _mockJwtService.Setup(x => x.GenerateAccessToken(user, roles))
                .Returns(accessToken);

            _mockJwtService.Setup(x => x.GenerateRefreshToken())
                .Returns(refreshToken);

            _mockRefreshTokenRepository.Setup(x => x.AddAsync(It.IsAny<RefreshToken>()))
                .ReturnsAsync((RefreshToken rt) => rt);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                .ThrowsAsync(new Exception("Database connection failed"));

            await Assert.ThrowsAsync<Exception>(() => _authService.LoginAsync(loginRequest));

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false), Times.Once);
            _mockUserManager.Verify(x => x.GetRolesAsync(user), Times.Once);
            _mockJwtService.Verify(x => x.GenerateAccessToken(user, roles), Times.Once);
            _mockJwtService.Verify(x => x.GenerateRefreshToken(), Times.Once);
            _mockRefreshTokenRepository.Verify(x => x.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithEmptyEmail_ShouldFindNullUser()
        {
            var loginRequest = new LoginRequest
            {
                Email = "",
                Password = "Password123!"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync((AppUser?)null);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUserManager.Verify(x => x.FindByEmailAsync(loginRequest.Email), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithMultipleRoles_ShouldReturnSuccessResult()
        {
            var loginRequest = new LoginRequest
            {
                Email = "admin@example.com",
                Password = "AdminPassword123!"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "admin@example.com",
                UserName = "admin@example.com",
                FullName = "Admin User",
                IsActive = true
            };

            var roles = new List<string> { "Admin", "User", "Manager" };
            var accessToken = "mock-admin-access-token";
            var refreshToken = "mock-admin-refresh-token";

            _mockUserManager.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Success);

            _mockUserManager.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(roles);

            _mockJwtService.Setup(x => x.GenerateAccessToken(user, roles))
                .Returns(accessToken);

            _mockJwtService.Setup(x => x.GenerateRefreshToken())
                .Returns(refreshToken);

            _mockRefreshTokenRepository.Setup(x => x.AddAsync(It.IsAny<RefreshToken>()))
                .ReturnsAsync((RefreshToken rt) => rt);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _authService.LoginAsync(loginRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value.RefreshToken.Should().Be(refreshToken);

            _mockJwtService.Verify(x => x.GenerateAccessToken(user, roles), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "New User"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = registerRequest.Email,
                UserName = registerRequest.Email,
                FullName = registerRequest.FullName,
                IsActive = true
            };

            var roles = new List<string> { "User" };
            var accessToken = "mock-access-token";
            var refreshToken = "mock-refresh-token";

            // Mock FindByEmailAsync instead of Users.AnyAsync to avoid async query provider issues
            _mockUserManager.Setup(x => x.FindByEmailAsync(registerRequest.Email))
                .ReturnsAsync((AppUser?)null);

            _mockMapper.Setup(x => x.Map<AppUser>(registerRequest))
                .Returns(user);

            _mockUserManager.Setup(x => x.CreateAsync(user, registerRequest.Password))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserManager.Setup(x => x.AddToRoleAsync(user, "User"))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserManager.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(roles);

            _mockJwtService.Setup(x => x.GenerateAccessToken(user, roles))
                .Returns(accessToken);

            _mockJwtService.Setup(x => x.GenerateRefreshToken())
                .Returns(refreshToken);

            _mockRefreshTokenRepository.Setup(x => x.AddAsync(It.IsAny<RefreshToken>()))
                .ReturnsAsync((RefreshToken rt) => rt);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value.RefreshToken.Should().Be(refreshToken);
            result.Value.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromMinutes(1));

            _mockMapper.Verify(x => x.Map<AppUser>(registerRequest), Times.Once);
            _mockUserManager.Verify(x => x.CreateAsync(user, registerRequest.Password), Times.Once);
            _mockUserManager.Verify(x => x.AddToRoleAsync(user, "User"), Times.Once);
            _mockJwtService.Verify(x => x.GenerateAccessToken(user, roles), Times.Once);
            _mockJwtService.Verify(x => x.GenerateRefreshToken(), Times.Once);
            _mockRefreshTokenRepository.Verify(x => x.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ShouldReturnFailureResult()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "Existing User"
            };

            var existingUsers = new List<AppUser>
            {
                new AppUser
                {
                    Id = Guid.NewGuid(),
                    Email = "existing@example.com",
                    UserName = "existing@example.com",
                    FullName = "Existing User",
                    IsActive = true
                }
            };

            // Mock FindByEmailAsync to return existing user
            _mockUserManager.Setup(x => x.FindByEmailAsync(registerRequest.Email))
                .ReturnsAsync(existingUsers.First());

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Email address is already registered");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockMapper.Verify(x => x.Map<AppUser>(It.IsAny<RegisterRequest>()), Times.Never);
            _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RegisterAsync_WhenUserCreationFails_ShouldReturnFailureResult()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "New User"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = registerRequest.Email,
                UserName = registerRequest.Email,
                FullName = registerRequest.FullName,
                IsActive = true
            };

            // Mock FindByEmailAsync to return null (no existing user)
            _mockUserManager.Setup(x => x.FindByEmailAsync(registerRequest.Email))
                .ReturnsAsync((AppUser?)null);

            _mockMapper.Setup(x => x.Map<AppUser>(registerRequest))
                .Returns(user);

            var identityErrors = new[]
            {
                new IdentityError { Code = "PasswordTooShort", Description = "Password is too short" }
            };

            _mockUserManager.Setup(x => x.CreateAsync(user, registerRequest.Password))
                .ReturnsAsync(IdentityResult.Failed(identityErrors));

            // Act
            var result = await _authService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsFailure.Should().BeTrue();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Failed to create user account");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockMapper.Verify(x => x.Map<AppUser>(registerRequest), Times.Once);
            _mockUserManager.Verify(x => x.CreateAsync(user, registerRequest.Password), Times.Once);
            _mockUserManager.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        }
    }
}
