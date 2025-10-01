using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;

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
        public async Task RegisterAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "Test User"
            };

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                UserName = request.Email,
                FullName = request.FullName
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(request.Email))
                .ReturnsAsync((AppUser?)null);
            _mockMapper.Setup(x => x.Map<AppUser>(request)).Returns(user);
            _mockUserManager.Setup(x => x.CreateAsync(user, request.Password))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(x => x.AddToRoleAsync(user, "User"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ShouldReturnFailureResult()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "Test User"
            };

            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                UserName = request.Email
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(request.Email))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }


    }
}
