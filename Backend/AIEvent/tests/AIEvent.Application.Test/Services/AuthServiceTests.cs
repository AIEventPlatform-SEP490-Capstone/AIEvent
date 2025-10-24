using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using MimeKit;
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
        private readonly Mock<IHasherHelper> _mockHasherHelper;
        private readonly Mock<ICacheService> _mockCacheService;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly IAuthService _authService;
        

        public AuthServiceTests()
        {
            // Khởi tạo mock cho các dependency
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockJwtService = new Mock<IJwtService>();
            _mockHasherHelper = new Mock<IHasherHelper>();
            _mockMapper = new Mock<IMapper>();
            _mockEmailService = new Mock<IEmailService>();
            _mockCacheService = new Mock<ICacheService>();
            _mockConfiguration = new Mock<IConfiguration>();
            _authService = new AuthService(_mockUnitOfWork.Object,
                                               _mockJwtService.Object,
                                               _mockMapper.Object,
                                               _mockEmailService.Object,
                                               _mockHasherHelper.Object,
                                               _mockCacheService.Object,
                                               _mockConfiguration.Object);
        }
        #region Login
        // UTCID01: Valid credentials, successful login
        [Fact]
        public async Task UTCID01_LoginAsync_WithValidCredentials_ShouldReturnSuccess()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var request = new LoginRequest { Email = "test@gmail.com", Password = "123" };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12)
            };
            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);
            _mockJwtService.Setup(x => x.GenerateAccessToken(user)).Returns("access-token");
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns("refresh-token");
            _mockHasherHelper.Setup(p => p.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.AccessToken.Should().Be("access-token");
            result.Value!.RefreshToken.Should().Be("refresh-token");
            (result.Value!.ExpiresAt - now).Should().BeCloseTo(TimeSpan.FromHours(1), TimeSpan.FromSeconds(10));
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        // UTCID02: Inactive user
        [Fact]
        public async Task UTCID02_LoginAsync_WithInactiveUser_ShouldReturnFailure()
        {
            // Arrange
            var request = new LoginRequest { Email = "test@gmail.com", Password = "123" };
            var user = new User { Id = Guid.NewGuid(), Email = "test@gmail.com", IsActive = false };
            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID03: Invalid password
        [Fact]
        public async Task UTCID03_LoginAsync_WithInvalidPassword_ShouldReturnFailure()
        {
            // Arrange
            var request = new LoginRequest { Email = "test@gmail.com", Password = "wrong" };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123")
            };
            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email or password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID04: Non-existent user
        [Fact]
        public async Task UTCID04_LoginAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var request = new LoginRequest { Email = "notfound@gmail.com", Password = "123" };
            var users = new List<User>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID05: Null request
        [Fact]
        public async Task UTCID05_LoginAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Act
            var result = await _authService.LoginAsync(null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email or password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID06: Empty email
        [Fact]
        public async Task UTCID06_LoginAsync_WithEmptyEmail_ShouldReturnFailure()
        {
            // Arrange
            var request = new LoginRequest { Email = "", Password = "123" };

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email or password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID07: Empty password
        [Fact]
        public async Task UTCID07_LoginAsync_WithEmptyPassword_ShouldReturnFailure()
        {
            // Arrange
            var request = new LoginRequest { Email = "test@gmail.com", Password = "" };

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email or password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID08: Invalid email format
        [Fact]
        public async Task UTCID08_LoginAsync_WithInvalidEmailFormat_ShouldReturnFailure()
        {
            // Arrange
            var request = new LoginRequest { Email = "invalid-email", Password = "123" };

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email or password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }
        #endregion

        #region Register
        [Fact]
        public async Task UTCID01_RegisterAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };
            var user = new User { Id = Guid.NewGuid(), Email = request.Email, IsActive = false };
            var role = new Role { Id = Guid.NewGuid(), Name = "User" };
            var otpResult = Result.Success();


            _mockCacheService.Setup(x => x.SetAsync($"Register {request.Email}", It.IsAny<string>(), It.IsAny<TimeSpan>()));
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(false))
                           .Returns(new List<Role> { role }.AsQueryable().BuildMockDbSet().Object);
            _mockMapper.Setup(x => x.Map<User>(request)).Returns(user);
            _mockUnitOfWork.Setup(x => x.UserRepository.AddAsync(It.IsAny<User>())).ReturnsAsync(user);
            _mockEmailService.Setup(x => x.SendEmailAsync(request.Email, It.IsAny<MimeMessage>())).ReturnsAsync(otpResult);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.AddAsync(It.Is<User>(u =>
                u.Email == request.Email && u.IsActive == false && u.RoleId == role.Id)), Times.Once());
            _mockCacheService.Verify(x => x.SetAsync($"Register {request.Email}", It.IsAny<string>(), It.IsAny<TimeSpan>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID02_RegisterAsync_WithExistingEmail_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };
            var existingUser = new User { Id = Guid.NewGuid(), Email = request.Email };
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User> { existingUser }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Email address is already registered");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID03_RegisterAsync_WithNoRole_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(false))
                           .Returns(new List<Role>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found role");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UTCID04_RegisterAsync_WithFailedOtpSend_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };
            var user = new User { Id = Guid.NewGuid(), Email = request.Email, IsActive = false };
            var role = new Role { Id = Guid.NewGuid(), Name = "User" };

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(false))
                           .Returns(new List<Role> { role }.AsQueryable().BuildMockDbSet().Object);
            _mockMapper.Setup(x => x.Map<User>(request)).Returns(user);
            _mockUnitOfWork.Setup(x => x.UserRepository.AddAsync(It.IsAny<User>())).ReturnsAsync(user);
            _mockEmailService.Setup(x => x.SendEmailAsync(request.Email, It.IsAny<MimeMessage>()))
                            .ReturnsAsync(ErrorResponse.FailureResult("Email send failed", ErrorCodes.InternalServerError));
            _mockUnitOfWork.Setup(x => x.UserRepository.DeleteAsync(It.IsAny<User>()));

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to send email");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockUnitOfWork.Verify(x => x.UserRepository.DeleteAsync(It.Is<User>(u => u.Id == user.Id)), Times.Once());
            _mockCacheService.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID05_RegisterAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Act
            var result = await _authService.RegisterAsync(null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID06_RegisterAsync_WithEmptyFullName_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Full name is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID07_RegisterAsync_WithEmptyEmail_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Email is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID08_RegisterAsync_WithInvalidEmailFormat_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "invalid-email",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email format");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID09_RegisterAsync_WithEmptyPassword_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "",
                ConfirmPassword = "",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Password is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID10_RegisterAsync_WithMismatchedConfirmPassword_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass124",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Password and confirm password do not match");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID11_RegisterAsync_WithInvalidPhoneNumber_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "invalid",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid phone number format");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID12_RegisterAsync_WithNullPhoneNumber_ShouldReturnSuccess()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = null,
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };
            var user = new User { Id = Guid.NewGuid(), Email = request.Email, IsActive = false };
            var role = new Role { Id = Guid.NewGuid(), Name = "User" };
            var otpResult = Result.Success();

            _mockCacheService.Setup(x => x.SetAsync($"Register {request.Email}", It.IsAny<string>(), It.IsAny<TimeSpan>()));
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(false))
                           .Returns(new List<Role> { role }.AsQueryable().BuildMockDbSet().Object);
            _mockMapper.Setup(x => x.Map<User>(request)).Returns(user);
            _mockUnitOfWork.Setup(x => x.UserRepository.AddAsync(It.IsAny<User>())).ReturnsAsync(user);
            _mockEmailService.Setup(x => x.SendEmailAsync(request.Email, It.IsAny<MimeMessage>())).ReturnsAsync(otpResult);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.AddAsync(It.IsAny<User>()), Times.Once());
            _mockCacheService.Verify(x => x.SetAsync($"Register {request.Email}", It.IsAny<string>(), It.IsAny<TimeSpan>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID13_RegisterAsync_WithInvalidParticipationFrequency_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true,
                ParticipationFrequency = (ParticipationFrequency)0,
                BudgetOption = BudgetOption.From500kTo2M
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("The field ParticipationFrequency must be between 1 and 4");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID14_RegisterAsync_WithInvalidBudgetOption_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true,
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = (BudgetOption)4
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("The field BudgetOption must be between 0 and 3");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID15_RegisterAsync_WithAddUserFailed_ShouldReturnFailure()
        {
            // Arrange
            var request = new RegisterRequest
            {
                FullName = "John Doe",
                Email = "test@gmail.com",
                Password = "Pass123",
                ConfirmPassword = "Pass123",
                PhoneNumber = "+1234567890",
                UserInterests = new List<UserInterest>{
                    new UserInterest { InterestName = "book"}
                },
                InterestedCities = new List<InterestedCities>{
                    new InterestedCities { CityName = "HoChiMinh"}
                },
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };
            var role = new Role { Id = Guid.NewGuid(), Name = "User" };

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(false)).Returns(new List<Role> { role }.AsQueryable().BuildMockDbSet().Object);
            _mockMapper.Setup(x => x.Map<User>(request)).Returns(new User { Email = request.Email });
            _mockUnitOfWork.Setup(x => x.UserRepository.AddAsync(It.IsAny<User>())).ReturnsAsync((User)null!);

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to create user account");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<MimeMessage>()), Times.Never());
            _mockCacheService.Verify(x => x.SetAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()), Times.Never());
        }
        #endregion

        #region RefreshToken
        [Fact]
        public async Task UTCID01_RefreshTokenAsync_WithValidActiveToken_ShouldReturnSuccess()
        {
            // Arrange
            var refreshToken = "validToken";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Role = new Role { Id = Guid.NewGuid(), Name = "User" },
                OrganizerProfile = new OrganizerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    OrganizationType = OrganizationType.NonProfit,
                    EventFrequency = EventFrequency.Monthly,
                    EventSize = EventSize.Small,
                    OrganizerType = OrganizerType.Individual,
                    EventExperienceLevel = EventExperienceLevel.Beginner,
                    ContactName = "John Doe",
                    ContactEmail = "john@example.com",
                    ContactPhone = "+1234567890",
                    Address = "123 Main St",
                    Status = ConfirmStatus.NeedConfirm
                }
            };
            var tokenEntity = new RefreshToken
            {
                Token = refreshToken,
                IsDeleted = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                UserId = user.Id,
                User = user
            };

            var newAccessToken = "newAccessToken";
            var newRefreshToken = "newRefreshToken";

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken> { tokenEntity }.AsQueryable().BuildMockDbSet().Object);
            _mockJwtService.Setup(x => x.GenerateAccessToken(user)).Returns(newAccessToken);
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns(newRefreshToken);
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.UpdateAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.DeleteAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.RefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.AccessToken.Should().Be(newAccessToken);
            result.Value!.RefreshToken.Should().Be(newRefreshToken);
            result.Value!.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromSeconds(5));
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.DeleteAsync(It.Is<RefreshToken>(t => t.Token == refreshToken)), Times.Once());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.Is<RefreshToken>(t => t.Token == newRefreshToken && t.UserId == user.Id && t.ExpiresAt.Date == DateTime.UtcNow.AddDays(7).Date)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID02_RefreshTokenAsync_WithNonExistentToken_ShouldReturnFailure()
        {
            // Arrange
            var refreshToken = "invalidToken";
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.UpdateAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID03_RefreshTokenAsync_WithRevokedToken_ShouldReturnFailure()
        {
            // Arrange
            var refreshToken = "revokedToken";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Role = new Role { Id = Guid.NewGuid(), Name = "User" },
                OrganizerProfile = new OrganizerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    OrganizationType = OrganizationType.NonProfit,
                    EventFrequency = EventFrequency.Monthly,
                    EventSize = EventSize.Small,
                    OrganizerType = OrganizerType.Individual,
                    EventExperienceLevel = EventExperienceLevel.Beginner,
                    ContactName = "John Doe",
                    ContactEmail = "john@example.com",
                    ContactPhone = "+1234567890",
                    Address = "123 Main St",
                    Status = ConfirmStatus.NeedConfirm
                }
            };
            var tokenEntity = new RefreshToken
            {
                Token = refreshToken,
                IsDeleted = true,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                UserId = user.Id,
                User = user
            };

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken> { tokenEntity }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.UpdateAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID04_RefreshTokenAsync_WithNullToken_ShouldReturnFailure()
        {
            // Arrange
            string? refreshToken = null;

            // Act
            var result = await _authService.RefreshTokenAsync(refreshToken!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.UpdateAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID05_RefreshTokenAsync_WithExpiredToken_ShouldReturnFailure()
        {
            // Arrange
            var refreshToken = "expiredToken";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Role = new Role { Id = Guid.NewGuid(), Name = "User" },
                OrganizerProfile = new OrganizerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    OrganizationType = OrganizationType.NonProfit,
                    EventFrequency = EventFrequency.Monthly,
                    EventSize = EventSize.Small,
                    OrganizerType = OrganizerType.Individual,
                    EventExperienceLevel = EventExperienceLevel.Beginner,
                    ContactName = "John Doe",
                    ContactEmail = "john@example.com",
                    ContactPhone = "+1234567890",
                    Address = "123 Main St",
                    Status = ConfirmStatus.NeedConfirm
                }
            };
            var tokenEntity = new RefreshToken
            {
                Token = refreshToken,
                IsDeleted = false,
                ExpiresAt = DateTime.UtcNow.AddSeconds(-1),
                UserId = user.Id,
                User = user
            };

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken> { tokenEntity }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.UpdateAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }
        #endregion

        #region RevokeRefreshToken
        [Fact]
        public async Task UTCID01_RevokeRefreshTokenAsync_WithValidActiveToken_ShouldReturnSuccess()
        {
            // Arrange
            var refreshToken = "validToken";
            var tokenEntity = new RefreshToken
            {
                Token = refreshToken,
                IsDeleted = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                UserId = Guid.NewGuid()
            };

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken> { tokenEntity }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.DeleteAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.RevokeRefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.DeleteAsync(It.Is<RefreshToken>(t => t.Token == refreshToken)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID02_RevokeRefreshTokenAsync_WithNonExistentToken_ShouldReturnFailure()
        {
            // Arrange
            var refreshToken = "invalidToken";
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RevokeRefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.DeleteAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID03_RevokeRefreshTokenAsync_WithRevokedToken_ShouldReturnFailure()
        {
            // Arrange
            var refreshToken = "revokedToken";
            var tokenEntity = new RefreshToken
            {
                Token = refreshToken,
                IsDeleted = true,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                UserId = Guid.NewGuid()
            };

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken> { tokenEntity }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RevokeRefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.DeleteAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID04_RevokeRefreshTokenAsync_WithNullToken_ShouldReturnFailure()
        {
            // Arrange
            string? refreshToken = null;

            // Act
            var result = await _authService.RevokeRefreshTokenAsync(refreshToken!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.DeleteAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID05_RevokeRefreshTokenAsync_WithExpiredToken_ShouldReturnFailure()
        {
            // Arrange
            var refreshToken = "expiredToken";
            var tokenEntity = new RefreshToken
            {
                Token = refreshToken,
                IsDeleted = false,
                ExpiresAt = DateTime.UtcNow.AddSeconds(-1), // Expired
                UserId = Guid.NewGuid()
            };

            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.Query(false))
                           .Returns(new List<RefreshToken> { tokenEntity }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.RevokeRefreshTokenAsync(refreshToken);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid or expired refresh token");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.DeleteAsync(It.IsAny<RefreshToken>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }
        #endregion

        #region VerifyOTP
        [Fact]
        public async Task UTCID01_VerifyOTPAsync_WithValidRequestAndOTP_ShouldReturnSuccess()
        {
            // Arrange
            var request = new VerifyOTPRequest { Email = "john@example.com", OTPCode = "123456" };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                IsActive = false,
                Role = new Role { Id = Guid.NewGuid(), Name = "User" },
                OrganizerProfile = new OrganizerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    OrganizationType = OrganizationType.NonProfit,
                    EventFrequency = EventFrequency.Monthly,
                    EventSize = EventSize.Small,
                    OrganizerType = OrganizerType.Individual,
                    EventExperienceLevel = EventExperienceLevel.Beginner,
                    ContactName = "John Doe",
                    ContactEmail = "john@example.com",
                    ContactPhone = "+1234567890",
                    Address = "123 Main St",
                    Status = ConfirmStatus.NeedConfirm
                }
            };
            var accessToken = "accessToken";
            var refreshToken = "refreshToken";


            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);
            _mockJwtService.Setup(x => x.GenerateAccessToken(user)).Returns(accessToken);
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns(refreshToken);
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork
                .Setup(r => r.WalletRepository.AddAsync(It.IsAny<Wallet>()));
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));
            _mockCacheService.Setup(x => x.GetAsync<string>($"Register {request.Email}")).ReturnsAsync("123456");
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.VerifyOTPAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value!.RefreshToken.Should().Be(refreshToken);
            result.Value!.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromSeconds(5));
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.Is<User>(u => u.Id == user.Id && u.IsActive)), Times.Once());
            _mockUnitOfWork.Verify(x => x.WalletRepository.AddAsync(It.Is<Wallet>(w => w.UserId == user.Id && w.Balance == 0)), Times.Once());
            _mockUnitOfWork.Verify(x => x.RefreshTokenRepository.AddAsync(It.Is<RefreshToken>(t => t.Token == refreshToken && t.UserId == user.Id && t.ExpiresAt.Date == DateTime.UtcNow.AddDays(7).Date)), Times.Once());
            _mockCacheService.Verify(x => x.GetAsync<string>($"Register {request.Email}"), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID02_VerifyOTPAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Arrange
            VerifyOTPRequest? request = null;

            // Act
            var result = await _authService.VerifyOTPAsync(request!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email or otp code");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID03_VerifyOTPAsync_WithInvalidEmail_ShouldReturnFailure()
        {
            // Arrange
            var request = new VerifyOTPRequest { Email = "", OTPCode = "123456" };

            // Act
            var result = await _authService.VerifyOTPAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID04_VerifyOTPAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var request = new VerifyOTPRequest { Email = "nonexistent@example.com", OTPCode = "123456" };
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockCacheService.Setup(x => x.GetAsync<string>($"Register {request.Email}")).ReturnsAsync("123456");
            // Act
            var result = await _authService.VerifyOTPAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID05_VerifyOTPAsync_WithNoOTP_ShouldReturnFailure()
        {
            // Arrange
            var request = new VerifyOTPRequest { Email = "john@example.com", OTPCode = "123456" };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                IsActive = false,
                Role = new Role { Id = Guid.NewGuid(), Name = "User" },
                OrganizerProfile = new OrganizerProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    OrganizationType = OrganizationType.NonProfit,
                    EventFrequency = EventFrequency.Monthly,
                    EventSize = EventSize.Small,
                    OrganizerType = OrganizerType.Individual,
                    EventExperienceLevel = EventExperienceLevel.Beginner,
                    ContactName = "John Doe",
                    ContactEmail = "john@example.com",
                    ContactPhone = "+1234567890",
                    Address = "123 Main St",
                    Status = ConfirmStatus.NeedConfirm
                }
            };
            _mockCacheService.Setup(x => x.GetAsync<string>($"Register {request.Email}")).ReturnsAsync((string)null!);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _authService.VerifyOTPAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("OTP not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.WalletRepository.AddAsync(It.IsAny<Wallet>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UTCID06_VerifyOTPAsync_WithInvalidOTPCode_ShouldReturnFailure()
        {
            // Arrange
            var request = new VerifyOTPRequest { Email = "john@example.com", OTPCode = "wrongCode" };
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                IsActive = false,
                Role = new Role { Id = Guid.NewGuid(), Name = "User" },
                OrganizerProfile = new OrganizerProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), OrganizationType = OrganizationType.NonProfit, EventFrequency = EventFrequency.Monthly, EventSize = EventSize.Small, OrganizerType = OrganizerType.Individual, EventExperienceLevel = EventExperienceLevel.Beginner, ContactName = "John Doe", ContactEmail = "john@example.com", ContactPhone = "+1234567890", Address = "123 Main St", Status = ConfirmStatus.NeedConfirm }
            };

            _mockCacheService.Setup(x => x.GetAsync<string>($"Register {request.Email}")).ReturnsAsync("123456");
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false))
                           .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);
            _mockHasherHelper.Setup(p => p.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

            // Act
            var result = await _authService.VerifyOTPAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid OTP");
            result.Error!.StatusCode.Should().Be(ErrorCodes.TokenInvalid);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.WalletRepository.AddAsync(It.IsAny<Wallet>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }
        #endregion

        #region ChangePassword
        [Fact]
        public async Task UTCID01_ChangePasswordAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };
            var user = new User
            {
                Id = userId,
                IsActive = true,
                DeletedAt = null,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);
            _mockHasherHelper.Setup(x => x.Verify(request.CurrentPassword, user.PasswordHash!)).Returns(true);
            _mockHasherHelper.Setup(x => x.Verify(request.NewPassword, user.PasswordHash!)).Returns(false);
            _mockHasherHelper.Setup(x => x.Hash(request.NewPassword, It.IsAny<int>())).Returns("hashedNewPassword");
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.CurrentPassword, "hashedOldPassword"), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.NewPassword, "hashedOldPassword"), Times.Once());
            _mockHasherHelper.Verify(x => x.Hash(request.NewPassword, It.IsAny<int>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.Is<User>(u => u.Id == userId)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID02_ChangePasswordAsync_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        [Fact]
        public async Task UTCID03_ChangePasswordAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            ChangePasswordRequest? request = null;

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        [Fact]
        public async Task UTCID04_ChangePasswordAsync_WithEmptyCurrentPassword_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Current password is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        [Fact]
        public async Task UTCID05_ChangePasswordAsync_WithEmptyNewPassword_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "",
                ConfirmPassword = ""
            };

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("New password is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        [Fact]
        public async Task UTCID06_ChangePasswordAsync_WithMismatchedConfirmPassword_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "differentPassword123"
            };

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Password and confirm password do not match");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        [Fact]
        public async Task UTCID07_ChangePasswordAsync_WithUserNotFound_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync((User)null!);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(It.IsAny<string>(), It.IsAny<string>()), Times.Never());
        }

        [Fact]
        public async Task UTCID08_ChangePasswordAsync_WithInactiveUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };
            var user = new User
            {
                Id = userId,
                IsActive = false,
                DeletedAt = null,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(It.IsAny<string>(), It.IsAny<string>()), Times.Never());
        }

        [Fact]
        public async Task UTCID09_ChangePasswordAsync_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };
            var user = new User
            {
                Id = userId,
                IsActive = true,
                DeletedAt = DateTime.UtcNow,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(It.IsAny<string>(), It.IsAny<string>()), Times.Never());
        }

        [Fact]
        public async Task UTCID10_ChangePasswordAsync_WithWrongCurrentPassword_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "wrongPassword123",
                NewPassword = "newPassword123",
                ConfirmPassword = "newPassword123"
            };
            var user = new User
            {
                Id = userId,
                IsActive = true,
                DeletedAt = null,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);
            _mockHasherHelper.Setup(x => x.Verify(request.CurrentPassword, user.PasswordHash!)).Returns(false);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Old password not true");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.CurrentPassword, user.PasswordHash!), Times.Once());
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never());
        }

        [Fact]
        public async Task UTCID11_ChangePasswordAsync_WithSameNewPassword_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "oldPassword123",
                ConfirmPassword = "oldPassword123"
            };
            var user = new User
            {
                Id = userId,
                IsActive = true,
                DeletedAt = null,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);
            _mockHasherHelper.Setup(x => x.Verify(request.CurrentPassword, user.PasswordHash!)).Returns(true);
            _mockHasherHelper.Setup(x => x.Verify(request.NewPassword, user.PasswordHash!)).Returns(true);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("New password cannot be the same as current password");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(It.IsAny<string>(), user.PasswordHash!), Times.Exactly(2));
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never());
        }

        [Fact]
        public async Task UTCID12_ChangePasswordAsync_WithSpecialCharacters_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "NewPass@123!@#$%^&*()",
                ConfirmPassword = "NewPass@123!@#$%^&*()"
            };
            var user = new User
            {
                Id = userId,
                IsActive = true,
                DeletedAt = null,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);
            _mockHasherHelper.Setup(x => x.Verify(request.CurrentPassword, user.PasswordHash!)).Returns(true);
            _mockHasherHelper.Setup(x => x.Verify(request.NewPassword, user.PasswordHash!)).Returns(false);
            _mockHasherHelper.Setup(x => x.Hash(request.NewPassword, It.IsAny<int>())).Returns("hashedNewPassword");
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.CurrentPassword, "hashedOldPassword"), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.NewPassword, "hashedOldPassword"), Times.Once());
            _mockHasherHelper.Verify(x => x.Hash(request.NewPassword, It.IsAny<int>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }

        [Fact]
        public async Task UTCID13_ChangePasswordAsync_WithUnicodeCharacters_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "oldPassword123",
                NewPassword = "新密码123中文",
                ConfirmPassword = "新密码123中文"
            };
            var user = new User
            {
                Id = userId,
                IsActive = true,
                DeletedAt = null,
                PasswordHash = "hashedOldPassword"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>())).ReturnsAsync(user);
            _mockHasherHelper.Setup(x => x.Verify(request.CurrentPassword, user.PasswordHash!)).Returns(true);
            _mockHasherHelper.Setup(x => x.Verify(request.NewPassword, user.PasswordHash!)).Returns(false);
            _mockHasherHelper.Setup(x => x.Hash(request.NewPassword, It.IsAny<int>())).Returns("hashedNewPassword");
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _authService.ChangePasswordAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, It.IsAny<bool>()), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.CurrentPassword, "hashedOldPassword"), Times.Once());
            _mockHasherHelper.Verify(x => x.Verify(request.NewPassword, "hashedOldPassword"), Times.Once());
            _mockHasherHelper.Verify(x => x.Hash(request.NewPassword, It.IsAny<int>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }
        #endregion
    }
}
