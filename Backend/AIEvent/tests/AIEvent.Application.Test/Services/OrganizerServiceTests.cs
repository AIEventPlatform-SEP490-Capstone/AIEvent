using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;

namespace AIEvent.Application.Test.Services
{
    public class OrganizerServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly OrganizerService _organizerService;

        public OrganizerServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockUserManager = CreateMockUserManager();
            _mockMapper = new Mock<IMapper>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();

            _organizerService = new OrganizerService(
                _mockUnitOfWork.Object,
                _mockUserManager.Object,
                _mockMapper.Object,
                _mockTransactionHelper.Object,
                _mockCloudinaryService.Object);
        }

        private static Mock<UserManager<AppUser>> CreateMockUserManager()
        {
            var store = new Mock<IUserStore<AppUser>>();
            return new Mock<UserManager<AppUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        }

        [Fact]
        public async Task RegisterOrganizerAsync_WithInvalidUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                OrganizerType = OrganizerType.Business,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((AppUser?)null);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<AIEvent.Application.Helpers.Result>>>()))
                .Returns<Func<Task<AIEvent.Application.Helpers.Result>>>(func => func());

            // Act
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }
    }
}
