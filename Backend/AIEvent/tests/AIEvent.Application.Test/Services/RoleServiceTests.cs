using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Services.Implements;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class RoleServiceTests
    {
        private readonly Mock<IMapper> _mockMapper;
        private readonly RoleService _roleService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;

        public RoleServiceTests()
        {
            _mockMapper = new Mock<IMapper>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _roleService = new RoleService(
                _mockUnitOfWork.Object,
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

            var mapRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description
            };

            _mockMapper.Setup(m => m.Map<Role>(It.IsAny<CreateRoleRequest>()))
                .Returns(mapRole);

            _mockMapper.Setup(m => m.Map<RoleResponse>(It.IsAny<Role>()))
                .Returns(new RoleResponse
                {
                    Id = mapRole.Id.ToString(),
                    Name = mapRole.Name,
                    Description = mapRole.Description
                });

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

            var existingRole = new Role
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = request.Name
            };

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


            // Act
            var result = await _roleService.DeleteRoleAsync(roleId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }
    }
}
