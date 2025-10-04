using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class AuthTest
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IJwtService> _mockJwtService;
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<SignInManager<AppUser>> _mockSignInManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly IAuthService _authService;

        public AuthTest()
        {
            // Khởi tạo mock cho các dependency
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockJwtService = new Mock<IJwtService>();
            _mockMapper = new Mock<IMapper>();

            // Fake IUserStore
            var store = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                store.Object, null, null, null, null, null, null, null, null
            );

            var contextAccessor = new Mock<IHttpContextAccessor>();
            var userPrincipalFactory = new Mock<IUserClaimsPrincipalFactory<AppUser>>();
            var signInLogger = new Mock<ILogger<SignInManager<AppUser>>>();

            _mockSignInManager = new Mock<SignInManager<AppUser>>(
                _mockUserManager.Object,
                contextAccessor.Object,
                userPrincipalFactory.Object,
                null,
                signInLogger.Object,
                null,
                null
            );
            _authService = new AuthService(_mockUnitOfWork.Object,
                                               _mockJwtService.Object,
                                               _mockUserManager.Object,
                                               _mockSignInManager.Object,
                                               _mockMapper.Object);
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
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };
            var accessToken = "access-token";
            var refreshToken = "refresh-token";

            // Giả lập danh sách Users trong DB, có sẵn 1 user test
            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            // Khi kiểm tra mật khẩu user → giả lập kết quả đăng nhập thành công
            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, false))
                              .ReturnsAsync(SignInResult.Success);

            // Khi lấy roles của user → giả lập trả về ["User"]
            _mockUserManager.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(roles);

            // Khi tạo AccessToken → giả lập trả về "access-token"
            _mockJwtService.Setup(x => x.GenerateAccessToken(user, roles)).Returns(accessToken);

            // Khi tạo RefreshToken → giả lập trả về "refresh-token"
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns(refreshToken);

            // Khi thêm RefreshToken bất kì vào DB → giả lập thành công (không cần trả dữ liệu gì)
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));

            // Khi lưu thay đổi vào DB → giả lập trả về 1 (tức là lưu thành công 1 bản ghi)
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);


            //Thực hiện func LoginAsync
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
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = false
            };

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);


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
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = true
            };

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, false))
                              .ReturnsAsync(SignInResult.Failed);

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
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = true
            };
            var roles = new List<string> { "User" };

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, false))
                              .ReturnsAsync(SignInResult.Success);

            _mockUserManager.Setup(x => x.GetRolesAsync(user))!.ReturnsAsync((IList<string>?)null);


            //Thực hiện func LoginAsync
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
                UserInterests = new List<UserInterestRequest>
                {
                    new UserInterestRequest { UserInterestId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString() }
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

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                UserName = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var roles = new List<string> { "User" };
            var accessToken = "access-token";
            var refreshToken = "refresh-token";

            _mockUserManager.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((AppUser?)null);
            _mockMapper.Setup(x => x.Map<AppUser>(request)).Returns(user);
            _mockUserManager.Setup(x => x.CreateAsync(user, request.Password)).ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(x => x.AddToRoleAsync(user, roles[0])).ReturnsAsync(IdentityResult.Success);
            _mockJwtService.Setup(x => x.GenerateAccessToken(user, roles)).Returns(accessToken);
            _mockJwtService.Setup(x => x.GenerateRefreshToken()).Returns(refreshToken);
            _mockUnitOfWork.Setup(x => x.RefreshTokenRepository.AddAsync(It.IsAny<RefreshToken>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _authService.RegisterAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.AccessToken.Should().Be(accessToken);
            result.Value!.RefreshToken.Should().Be(refreshToken);
            result.Value!.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(1), TimeSpan.FromSeconds(5));
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
                UserInterests = new List<UserInterestRequest>
                {
                    new UserInterestRequest { UserInterestId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString() },
                    new UserInterestRequest { UserInterestId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString() }
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

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                UserName = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(user);

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
                UserInterests = new List<UserInterestRequest>
                {
                    new UserInterestRequest { UserInterestId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString() },
                    new UserInterestRequest { UserInterestId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString() }
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

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                UserName = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var roles = new List<string> { "User" };

            _mockUserManager.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((AppUser?)null);
            _mockMapper.Setup(x => x.Map<AppUser>(request)).Returns(user);
            _mockUserManager.Setup(x => x.CreateAsync(user, request.Password)).ReturnsAsync(IdentityResult.Failed());

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
                UserInterests = new List<UserInterestRequest>
                {
                    new UserInterestRequest { UserInterestId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString() },
                    new UserInterestRequest { UserInterestId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString() }
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

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                UserName = request.Email,
                FullName = request.FullName,
                IsActive = true
            };

            var roles = new List<string> { "User" };

            _mockUserManager.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((AppUser?)null);
            _mockMapper.Setup(x => x.Map<AppUser>(request)).Returns(user);
            _mockUserManager.Setup(x => x.CreateAsync(user, request.Password)).ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(x => x.AddToRoleAsync(user, roles[0])).ReturnsAsync(IdentityResult.Failed());

            var result = await _authService.RegisterAsync(request);


            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to assign role to user");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion
    }
}
