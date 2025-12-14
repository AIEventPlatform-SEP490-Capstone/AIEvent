using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class DashboardServiceTests
    {
        // Test constants
        private static readonly Guid TestAdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid TestUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid TestEventId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        private static readonly Guid TestOrganizerProfileId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IHangfireJobService> _mockHangfireJobService;
        private readonly IDashboardService _dashboardService;

        public DashboardServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockHangfireJobService = new Mock<IHangfireJobService>();
            _dashboardService = new DashboardService(_mockUnitOfWork.Object, _mockHangfireJobService.Object);
        }

        #region GetAdminDashboardAsync Tests

        // UTCID01: Valid request with default parameters (current year/month) - Success
        [Fact]
        public async Task UTCID01_GetAdminDashboardAsync_WithDefaultParameters_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (default year and month)
            var now = DateTimeOffset.UtcNow;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            var users = new List<User>
            {
                new User { Id = TestUserId, IsDeleted = false, RoleId = Guid.NewGuid(), CreatedAt = now.AddDays(-10) }
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(users.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Booking>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.TicketRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Ticket>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetAdminDashboardAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.TotalUsers.Should().Be(1);
        }

        // UTCID02: Valid request with specific year and month - Success
        [Fact]
        public async Task UTCID02_GetAdminDashboardAsync_WithValidYearAndMonth_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (year = 2024, month = 6)
            var year = 2024;
            var month = 6;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Booking>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.TicketRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Ticket>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetAdminDashboardAsync(year, month);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
        }

        // UTCID03: Invalid year (below 2000) - Failure
        [Fact]
        public async Task UTCID03_GetAdminDashboardAsync_WithInvalidYearBelow2000_ShouldReturnFailure()
        {
            // Arrange - BV: year = 1999 (below minimum)
            var year = 1999;
            var month = 6;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetAdminDashboardAsync(year, month);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid year");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID04: Invalid year (above 9999) - Failure
        [Fact]
        public async Task UTCID04_GetAdminDashboardAsync_WithInvalidYearAbove9999_ShouldReturnFailure()
        {
            // Arrange - BV: year = 10000 (above maximum)
            var year = 10000;
            var month = 6;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetAdminDashboardAsync(year, month);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid year");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID05: Invalid month (below 1) - Failure
        [Fact]
        public async Task UTCID05_GetAdminDashboardAsync_WithInvalidMonthBelow1_ShouldReturnFailure()
        {
            // Arrange - BV: month = 0 (below minimum)
            var year = 2024;
            var month = 0;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetAdminDashboardAsync(year, month);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid month");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID06: Invalid month (above 12) - Failure
        [Fact]
        public async Task UTCID06_GetAdminDashboardAsync_WithInvalidMonthAbove12_ShouldReturnFailure()
        {
            // Arrange - BV: month = 13 (above maximum)
            var year = 2024;
            var month = 13;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetAdminDashboardAsync(year, month);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid month");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        #endregion

        #region GetEventManagementAsync Tests

        // UTCID01: Valid request without search - Success
        [Fact]
        public async Task UTCID01_GetEventManagementAsync_WithoutSearch_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (no search, default pagination)
            var events = new List<Event>
            {
                new Event
                {
                    Id = TestEventId,
                    Title = "Test Event",
                    Description = "Test Description",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    OrganizerProfile = new OrganizerProfile
                    {
                        CompanyName = "Test Company",
                        ContactName = "Test Contact",
                        OrganizationType = OrganizationType.PrivateCompany,
                        EventFrequency = EventFrequency.Monthly,
                        EventSize = EventSize.Medium,
                        OrganizerType = OrganizerType.Individual,
                        EventExperienceLevel = EventExperienceLevel.Intermediate,
                        ContactEmail = "test@example.com",
                        ContactPhone = "0123456789",
                        Address = "Test Address"
                    },
                    ImgListEvent = "image1.jpg",
                    SoldQuantity = 10,
                    Status = EventStatus.Approved
                }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(events.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetEventManagementAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(1);
        }

        // UTCID02: Valid request with search by title - Success
        [Fact]
        public async Task UTCID02_GetEventManagementAsync_WithSearchByTitle_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (search by title)
            var search = "Test";
            var events = new List<Event>
            {
                new Event
                {
                    Id = TestEventId,
                    Title = "Test Event",
                    Description = "Test Description",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    OrganizerProfile = new OrganizerProfile
                    {
                        CompanyName = "Test Company",
                        ContactName = "Test Contact",
                        OrganizationType = OrganizationType.PrivateCompany,
                        EventFrequency = EventFrequency.Monthly,
                        EventSize = EventSize.Medium,
                        OrganizerType = OrganizerType.Individual,
                        EventExperienceLevel = EventExperienceLevel.Intermediate,
                        ContactEmail = "test@example.com",
                        ContactPhone = "0123456789",
                        Address = "Test Address"
                    },
                    ImgListEvent = "image1.jpg",
                    SoldQuantity = 10,
                    Status = EventStatus.Approved
                }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(events.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetEventManagementAsync(search);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
        }

        // UTCID03: Valid request with pagination - Success
        [Fact]
        public async Task UTCID03_GetEventManagementAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pagination)
            var pageNumber = 1;
            var pageSize = 2;
            var events = new List<Event>
            {
                new Event
                {
                    Id = TestEventId,
                    Title = "Event 1",
                    Description = "Description 1",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    OrganizerProfile = new OrganizerProfile
                    {
                        CompanyName = "Company 1",
                        ContactName = "Contact 1",
                        OrganizationType = OrganizationType.PrivateCompany,
                        EventFrequency = EventFrequency.Monthly,
                        EventSize = EventSize.Medium,
                        OrganizerType = OrganizerType.Individual,
                        EventExperienceLevel = EventExperienceLevel.Intermediate,
                        ContactEmail = "company1@example.com",
                        ContactPhone = "0123456789",
                        Address = "Address 1"
                    },
                    ImgListEvent = "image1.jpg",
                    SoldQuantity = 10,
                    Status = EventStatus.Approved
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event 2",
                    Description = "Description 2",
                    StartTime = DateTime.UtcNow.AddDays(2),
                    EndTime = DateTime.UtcNow.AddDays(2).AddHours(2),
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    OrganizerProfile = new OrganizerProfile
                    {
                        CompanyName = "Company 2",
                        ContactName = "Contact 2",
                        OrganizationType = OrganizationType.PrivateCompany,
                        EventFrequency = EventFrequency.Monthly,
                        EventSize = EventSize.Medium,
                        OrganizerType = OrganizerType.Individual,
                        EventExperienceLevel = EventExperienceLevel.Intermediate,
                        ContactEmail = "company2@example.com",
                        ContactPhone = "0123456789",
                        Address = "Address 2"
                    },
                    ImgListEvent = "image2.jpg",
                    SoldQuantity = 20,
                    Status = EventStatus.Approved
                },
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Event 3",
                    Description = "Description 3",
                    StartTime = DateTime.UtcNow.AddDays(3),
                    EndTime = DateTime.UtcNow.AddDays(3).AddHours(2),
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(1),
                    OrganizerProfile = new OrganizerProfile
                    {
                        CompanyName = "Company 3",
                        ContactName = "Contact 3",
                        OrganizationType = OrganizationType.PrivateCompany,
                        EventFrequency = EventFrequency.Monthly,
                        EventSize = EventSize.Medium,
                        OrganizerType = OrganizerType.Individual,
                        EventExperienceLevel = EventExperienceLevel.Intermediate,
                        ContactEmail = "company3@example.com",
                        ContactPhone = "0123456789",
                        Address = "Address 3"
                    },
                    ImgListEvent = "image3.jpg",
                    SoldQuantity = 30,
                    Status = EventStatus.Approved
                }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(events.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetEventManagementAsync(null, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(2);
        }

        // UTCID04: Search with no results - Success (empty list)
        [Fact]
        public async Task UTCID04_GetEventManagementAsync_WithNoMatchingSearch_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but no matching results
            var search = "NonExistent";
            var events = new List<Event>
            {
                new Event
                {
                    Id = TestEventId,
                    Title = "Test Event",
                    Description = "Test Description",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    OrganizerProfile = new OrganizerProfile
                    {
                        CompanyName = "Test Company",
                        ContactName = "Test Contact",
                        OrganizationType = OrganizationType.PrivateCompany,
                        EventFrequency = EventFrequency.Monthly,
                        EventSize = EventSize.Medium,
                        OrganizerType = OrganizerType.Individual,
                        EventExperienceLevel = EventExperienceLevel.Intermediate,
                        ContactEmail = "test@example.com",
                        ContactPhone = "0123456789",
                        Address = "Test Address"
                    },
                    ImgListEvent = "image1.jpg",
                    SoldQuantity = 10,
                    Status = EventStatus.Approved
                }
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(events.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetEventManagementAsync(search);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
        }

        #endregion

        #region GetUserManagementAsync Tests

        // UTCID01: Valid request without search - Success
        [Fact]
        public async Task UTCID01_GetUserManagementAsync_WithoutSearch_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (no search, default pagination)
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            var userRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = "User",
                IsDeleted = false
            };

            var users = new List<User>
            {
                new User
                {
                    Id = TestUserId,
                    FullName = "Test User",
                    Email = "test@example.com",
                    IsDeleted = false,
                    RoleId = userRole.Id,
                    Role = userRole,
                    CreatedAt = DateTimeOffset.UtcNow,
                    Bookings = new List<Booking>(),
                    OrganizerProfile = null
                }
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(users.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetUserManagementAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
        }

        // UTCID02: Valid request with search by email - Success
        [Fact]
        public async Task UTCID02_GetUserManagementAsync_WithSearchByEmail_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (search by email)
            var search = "test@example.com";
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            var userRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = "User",
                IsDeleted = false
            };

            var users = new List<User>
            {
                new User
                {
                    Id = TestUserId,
                    FullName = "Test User",
                    Email = "test@example.com",
                    IsDeleted = false,
                    RoleId = userRole.Id,
                    Role = userRole,
                    CreatedAt = DateTimeOffset.UtcNow,
                    Bookings = new List<Booking>(),
                    OrganizerProfile = null
                }
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(users.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetUserManagementAsync(search);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
        }

        // UTCID03: Valid request with pagination - Success
        [Fact]
        public async Task UTCID03_GetUserManagementAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pagination)
            var pageNumber = 1;
            var pageSize = 2;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            var userRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = "User",
                IsDeleted = false
            };

            var users = new List<User>
            {
                new User
                {
                    Id = TestUserId,
                    FullName = "User 1",
                    Email = "user1@example.com",
                    IsDeleted = false,
                    RoleId = userRole.Id,
                    Role = userRole,
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
                    Bookings = new List<Booking>(),
                    OrganizerProfile = null
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "User 2",
                    Email = "user2@example.com",
                    IsDeleted = false,
                    RoleId = userRole.Id,
                    Role = userRole,
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    Bookings = new List<Booking>(),
                    OrganizerProfile = null
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    FullName = "User 3",
                    Email = "user3@example.com",
                    IsDeleted = false,
                    RoleId = userRole.Id,
                    Role = userRole,
                    CreatedAt = DateTimeOffset.UtcNow,
                    Bookings = new List<Booking>(),
                    OrganizerProfile = null
                }
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(users.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetUserManagementAsync(null, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(3);
        }

        #endregion

        #region GetSystemReportAsync Tests

        // UTCID01: Valid request with default parameters - Success
        [Fact]
        public async Task UTCID01_GetSystemReportAsync_WithDefaultParameters_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (default pagination)
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>()))
                .Returns(new List<SystemSetting>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetSystemReportAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.MonthlyStatistics.Should().NotBeNull();
            result.Value!.RecentActivities.Should().NotBeNull();
        }

        // UTCID02: Valid request with pagination - Success
        [Fact]
        public async Task UTCID02_GetSystemReportAsync_WithPagination_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (custom pagination)
            var pageNumber = 1;
            var pageSize = 5;
            var adminRole = new Role
            {
                Id = TestAdminRoleId,
                Name = "Admin",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Role> { adminRole }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>()))
                .Returns(new List<User>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.Query(It.IsAny<bool>()))
                .Returns(new List<OrganizerProfile>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>()))
                .Returns(new List<SystemSetting>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetSystemReportAsync(pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.RecentActivities.CurrentPage.Should().Be(pageNumber);
            result.Value!.RecentActivities.PageSize.Should().Be(pageSize);
        }

        #endregion

        #region GetPayoutHistoryAsync Tests

        // UTCID01: Valid request with default parameters - Success
        [Fact]
        public async Task UTCID01_GetPayoutHistoryAsync_WithDefaultParameters_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (default parameters)
            var revenueReports = new List<RevenueReport>();
            var walletTransactions = new List<WalletTransaction>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
        }

        // UTCID02: Valid request with RevenueReport data - Success
        [Fact]
        public async Task UTCID02_GetPayoutHistoryAsync_WithRevenueReports_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RevenueReport exists)
            var now = DateTimeOffset.UtcNow;
            var organizerProfile = new OrganizerProfile
            {
                Id = TestOrganizerProfileId,
                ContactName = "Test Organizer",
                ContactEmail = "organizer@example.com",
                CompanyName = "Test Company",
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var revenueReports = new List<RevenueReport>
            {
                new RevenueReport
                {
                    Id = Guid.NewGuid(),
                    OrganizerProfileId = TestOrganizerProfileId,
                    EventId = TestEventId,
                    EventName = "Test Event",
                    GrossRevenue = 1000000m,
                    NetRevenue = 900000m,
                    PlatformFee = 100000m,
                    ReportMonth = now.Month,
                    ReportYear = now.Year,
                    PayoutDate = now.DateTime,
                    CreatedAt = now,
                    IsDeleted = false,
                    OrganizerProfile = organizerProfile
                }
            };

            var walletTransactions = new List<WalletTransaction>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().HistoryType.Should().Be("Payout");
            result.Value!.Items.First().EventName.Should().Be("Test Event");
            result.Value!.Items.First().Amount.Should().Be(900000m);
        }

        // UTCID03: Valid request with WalletTransaction (Topup) - Success
        [Fact]
        public async Task UTCID03_GetPayoutHistoryAsync_WithTopupTransaction_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (WalletTransaction with Type = Topup)
            var now = DateTimeOffset.UtcNow;
            var user = new User
            {
                Id = TestUserId,
                FullName = "Test User",
                Email = "user@example.com",
                IsDeleted = false
            };

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = TestUserId,
                User = user,
                Balance = 100000m,
                IsDeleted = false
            };

            var walletTransactions = new List<WalletTransaction>
            {
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Wallet = wallet,
                    Type = TransactionType.Topup,
                    Amount = 500000m,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.In,
                    Description = "Topup transaction",
                    CreatedAt = now,
                    IsDeleted = false
                }
            };

            var revenueReports = new List<RevenueReport>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().HistoryType.Should().Be("Topup");
            result.Value!.Items.First().Amount.Should().Be(500000m);
        }

        // UTCID04: Valid request with WalletTransaction (Withdraw) - Success
        [Fact]
        public async Task UTCID04_GetPayoutHistoryAsync_WithWithdrawTransaction_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (WalletTransaction with Type = Withdraw)
            var now = DateTimeOffset.UtcNow;
            var user = new User
            {
                Id = TestUserId,
                FullName = "Test User",
                Email = "user@example.com",
                IsDeleted = false
            };

            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = TestUserId,
                User = user,
                Balance = 100000m,
                IsDeleted = false
            };

            var walletTransactions = new List<WalletTransaction>
            {
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Wallet = wallet,
                    Type = TransactionType.Withdraw,
                    Amount = 300000m,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.Out,
                    Description = "Withdraw transaction",
                    CreatedAt = now,
                    IsDeleted = false
                }
            };

            var revenueReports = new List<RevenueReport>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync();

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().HistoryType.Should().Be("Withdraw");
            result.Value!.Items.First().Amount.Should().Be(300000m);
        }

        // UTCID05: Valid request with search by organizer name - Success
        [Fact]
        public async Task UTCID05_GetPayoutHistoryAsync_WithSearchByOrganizerName_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (search by organizer name)
            var search = "Test Organizer";
            var now = DateTimeOffset.UtcNow;
            var organizerProfile = new OrganizerProfile
            {
                Id = TestOrganizerProfileId,
                ContactName = "Test Organizer",
                ContactEmail = "organizer@example.com",
                CompanyName = "Test Company",
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var revenueReports = new List<RevenueReport>
            {
                new RevenueReport
                {
                    Id = Guid.NewGuid(),
                    OrganizerProfileId = TestOrganizerProfileId,
                    EventId = TestEventId,
                    EventName = "Test Event",
                    GrossRevenue = 1000000m,
                    NetRevenue = 900000m,
                    PlatformFee = 100000m,
                    ReportMonth = now.Month,
                    ReportYear = now.Year,
                    PayoutDate = now.DateTime,
                    CreatedAt = now,
                    IsDeleted = false,
                    OrganizerProfile = organizerProfile
                }
            };

            var walletTransactions = new List<WalletTransaction>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync(search);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
        }

        // UTCID06: Valid request with year filter - Success
        [Fact]
        public async Task UTCID06_GetPayoutHistoryAsync_WithYearFilter_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (year = 2024)
            var year = 2024;
            var now = DateTimeOffset.UtcNow;
            var organizerProfile = new OrganizerProfile
            {
                Id = TestOrganizerProfileId,
                ContactName = "Test Organizer",
                ContactEmail = "organizer@example.com",
                CompanyName = "Test Company",
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var revenueReports = new List<RevenueReport>
            {
                new RevenueReport
                {
                    Id = Guid.NewGuid(),
                    OrganizerProfileId = TestOrganizerProfileId,
                    EventId = TestEventId,
                    EventName = "Test Event",
                    GrossRevenue = 1000000m,
                    NetRevenue = 900000m,
                    PlatformFee = 100000m,
                    ReportMonth = 6,
                    ReportYear = year,
                    PayoutDate = new DateTime(year, 6, 15),
                    CreatedAt = new DateTimeOffset(year, 6, 15, 0, 0, 0, TimeSpan.Zero),
                    IsDeleted = false,
                    OrganizerProfile = organizerProfile
                }
            };

            var walletTransactions = new List<WalletTransaction>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync(null, year);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().ReportYear.Should().Be(year);
        }

        // UTCID07: Valid request with month filter - Success
        [Fact]
        public async Task UTCID07_GetPayoutHistoryAsync_WithMonthFilter_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (month = 6)
            var month = 6;
            var now = DateTimeOffset.UtcNow;
            var organizerProfile = new OrganizerProfile
            {
                Id = TestOrganizerProfileId,
                ContactName = "Test Organizer",
                ContactEmail = "organizer@example.com",
                CompanyName = "Test Company",
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var revenueReports = new List<RevenueReport>
            {
                new RevenueReport
                {
                    Id = Guid.NewGuid(),
                    OrganizerProfileId = TestOrganizerProfileId,
                    EventId = TestEventId,
                    EventName = "Test Event",
                    GrossRevenue = 1000000m,
                    NetRevenue = 900000m,
                    PlatformFee = 100000m,
                    ReportMonth = month,
                    ReportYear = now.Year,
                    PayoutDate = new DateTime(now.Year, month, 15),
                    CreatedAt = new DateTimeOffset(now.Year, month, 15, 0, 0, 0, TimeSpan.Zero),
                    IsDeleted = false,
                    OrganizerProfile = organizerProfile
                }
            };

            var walletTransactions = new List<WalletTransaction>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync(null, null, month);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().ReportMonth.Should().Be(month);
        }

        // UTCID08: Valid request with year and month filter - Success
        [Fact]
        public async Task UTCID08_GetPayoutHistoryAsync_WithYearAndMonthFilter_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (year = 2024, month = 6)
            var year = 2024;
            var month = 6;
            var organizerProfile = new OrganizerProfile
            {
                Id = TestOrganizerProfileId,
                ContactName = "Test Organizer",
                ContactEmail = "organizer@example.com",
                CompanyName = "Test Company",
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            var revenueReports = new List<RevenueReport>
            {
                new RevenueReport
                {
                    Id = Guid.NewGuid(),
                    OrganizerProfileId = TestOrganizerProfileId,
                    EventId = TestEventId,
                    EventName = "Test Event",
                    GrossRevenue = 1000000m,
                    NetRevenue = 900000m,
                    PlatformFee = 100000m,
                    ReportMonth = month,
                    ReportYear = year,
                    PayoutDate = new DateTime(year, month, 15),
                    CreatedAt = new DateTimeOffset(year, month, 15, 0, 0, 0, TimeSpan.Zero),
                    IsDeleted = false,
                    OrganizerProfile = organizerProfile
                }
            };

            var walletTransactions = new List<WalletTransaction>();

            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>()))
                .Returns(revenueReports.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(walletTransactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.GetPayoutHistoryAsync(null, year, month);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().ReportYear.Should().Be(year);
            result.Value!.Items.First().ReportMonth.Should().Be(month);
        }
        #endregion

        #region CreateSystemSetting Tests
        [Fact]
        public async Task UTCID01_CreateSystemSetting_ShouldFail_WhenFlatformFeeIsZero()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            var request = new SystemSettingRequest
            {
                FlatformFee = 0,            
                FixFee = 100,
                DatePayout = 5,
                EventReminderHours = 24,
                DateApply = DateTime.UtcNow.AddDays(1)
            };

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("All fields must be greater than 0", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Never);
        }


        [Fact]
        public async Task UTCID02_CreateSystemSetting_ShouldFail_WhenFixFeeIsZero()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            var request = new SystemSettingRequest
            {
                FlatformFee = 100,         
                FixFee = 0,                
                DatePayout = 5,
                EventReminderHours = 24,
                DateApply = DateTime.UtcNow.AddDays(1)
            };

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("All fields must be greater than 0", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Never);
        }


        [Fact]
        public async Task UTCID03_CreateSystemSetting_ShouldFail_WhenDatePayoutIsZero()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            var request = new SystemSettingRequest
            {
                FlatformFee = 100,
                FixFee = 100,
                DatePayout = 0,            
                EventReminderHours = 24,
                DateApply = DateTime.UtcNow.AddDays(1)
            };

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("All fields must be greater than 0", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Never);
        }


        [Fact]
        public async Task UTCID04_CreateSystemSetting_ShouldFail_WhenEventReminderHoursIsZero()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            var request = new SystemSettingRequest
            {
                FlatformFee = 100,
                FixFee = 100,
                DatePayout = 5,
                EventReminderHours = 0,        // <= 0, trigger validation
                DateApply = DateTime.UtcNow.AddDays(1) // valid future date
            };

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("All fields must be greater than 0", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Never);
        }


        [Fact]
        public async Task UTCID05_CreateSystemSetting_ShouldFail_WhenDateApplyIsNotInFuture()
        {
            // Arrange
            var adminId = Guid.NewGuid();

            var request = new SystemSettingRequest
            {
                FlatformFee = 100,
                FixFee = 100,
                DatePayout = 5,
                EventReminderHours = 24,
                DateApply = DateTime.UtcNow
            };

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("DateApply must be greater than today", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify 
            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Never);
        }


        [Fact]
        public async Task UTCID06_CreateSystemSetting_ShouldFail_WhenSettingAlreadyExistsThisMonth()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var existingSetting = new SystemSetting
            {
                CreatedBy = adminId.ToString(),
                CreatedAt = now,  
                IsDeleted = false
            };

            var request = new SystemSettingRequest
            {
                FlatformFee = 100,
                FixFee = 100,
                DatePayout = 5,
                EventReminderHours = 24,
                DateApply = now.AddDays(1) 
            };

            _mockUnitOfWork.Setup(u => u.SystemSettingRepository
                    .Query(false))
                .Returns(new List<SystemSetting> { existingSetting }
                    .AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("System setting can only be update once per month", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify
            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Never);
        }


        [Fact]
        public async Task UTCID07_CreateSystemSetting_ShouldSucceed_WhenInputIsValidAndNoExistingSetting()
        {
            // Arrange
            var adminId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var request = new SystemSettingRequest
            {
                FlatformFee = 100,
                FixFee = 200,
                DatePayout = 5,
                EventReminderHours = 24,
                DateApply = now.AddDays(1) 
            };

            _mockUnitOfWork.Setup(u => u.SystemSettingRepository
                .Query(false))
                .Returns(new List<SystemSetting>()
                .AsQueryable()
                .BuildMockDbSet().Object);

            _mockUnitOfWork.Setup(u => u.SystemSettingRepository
                .AddAsync(It.IsAny<SystemSetting>()))
                .ReturnsAsync((SystemSetting s) => s);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _mockHangfireJobService.Setup(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _dashboardService.CreateSystemSetting(adminId, request);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Null(result.Error);

            // Verify 
            _mockUnitOfWork.Verify(u => u.SystemSettingRepository.AddAsync(It.IsAny<SystemSetting>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mockHangfireJobService.Verify(h => h.EnqueueNotifyPlatformSettingChange(It.IsAny<SystemSetting>()), Times.Once);
        }
        #endregion
    }
}

