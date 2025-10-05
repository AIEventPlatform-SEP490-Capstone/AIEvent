using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Domain.Identity;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;

namespace AIEvent.Application.Test.Services
{
    public class RoleServiceTests
    {
        private readonly Mock<RoleManager<AppRole>> _mockRoleManager;
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly RoleService _roleService;

        public RoleServiceTests()
        {
            var roleStore = new Mock<IRoleStore<AppRole>>();
            _mockRoleManager = new Mock<RoleManager<AppRole>>(
                roleStore.Object, null!, null!, null!, null!);

            var userStore = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _mockMapper = new Mock<IMapper>();

            _roleService = new RoleService(
                _mockRoleManager.Object,
                _mockUserManager.Object,
                _mockMapper.Object);
        }

        [Fact]
        public async Task CreateRoleAsync_ValidWith_ShouldReturnSuccessResult()
        {
            var request = new CreateRoleRequest
            {
                Name = "ExistingRole",
                Description = "Existing role description"
            };

            var existingRole = new AppRole
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Admin"
            };

            _mockRoleManager.Setup(x => x.FindByNameAsync(request.Name))
                .ReturnsAsync(existingRole);

            var result = await _roleService.CreateRoleAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task CreateRoleAsync_WithExistingName_ShouldReturnFailureResult()
        {
            var request = new CreateRoleRequest
            {
                Name = "ExistingRole",
                Description = "Existing role description"
            };

            var existingRole = new AppRole
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = request.Name
            };

            _mockRoleManager.Setup(x => x.FindByNameAsync(request.Name))
                .ReturnsAsync(existingRole);

            var result = await _roleService.CreateRoleAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Role with this name already exists");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UpdateRoleAsync_WithInvalidId_ShouldReturnFailureResult()
        {
            var roleId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var request = new UpdateRoleRequest
            {
                Description = "Updated role description"
            };

            _mockRoleManager.Setup(x => x.FindByIdAsync(roleId))
                .ReturnsAsync((AppRole?)null);

            // Act
            var result = await _roleService.UpdateRoleAsync(roleId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteRoleAsync_WithInvalidId_ShouldReturnFailureResult()
        {
            // Arrange
            var roleId = Guid.NewGuid().ToString();

            _mockRoleManager.Setup(x => x.FindByIdAsync(roleId))
                .ReturnsAsync((AppRole?)null);

            // Act
            var result = await _roleService.DeleteRoleAsync(roleId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }
    }
}
