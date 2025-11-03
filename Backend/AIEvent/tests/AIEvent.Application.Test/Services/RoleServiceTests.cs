using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Services.Implements;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using MockQueryable.Moq;
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
            // Arrange
            var request = new CreateRoleRequest
            {
                Name = "NewRole",
                Description = "New role description"
            };

            var mapRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description
            };

            // Mock empty roles list (no existing role with same name)
            var emptyRoles = new List<Role>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyRoles.Object);

            _mockMapper.Setup(m => m.Map<Role>(It.IsAny<CreateRoleRequest>()))
                .Returns(mapRole);

            _mockUnitOfWork.Setup(x => x.RoleRepository.AddAsync(It.IsAny<Role>()))
                          .ReturnsAsync((Role r) => r);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                          .ReturnsAsync(1);

            // Act
            var result = await _roleService.CreateRoleAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RoleRepository.AddAsync(It.Is<Role>(r => r.Name == request.Name)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }


        [Fact]
        public async Task CreateRoleAsync_WithExistingName_ShouldReturnFailureResult()
        {
            // Arrange
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

            // Mock existing role found
            var roles = new List<Role> { existingRole }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>()))
                          .Returns(roles.Object);

            // Act
            var result = await _roleService.CreateRoleAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Role with this name already exists");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.RoleRepository.AddAsync(It.IsAny<Role>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task UpdateRoleAsync_WithInvalidId_ShouldReturnFailureResult()
        {
            // Arrange
            var roleId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var request = new UpdateRoleRequest
            {
                Description = "Updated role description"
            };

            // Mock role not found (returns null)
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(Guid.Parse(roleId), true))
                          .ReturnsAsync((Role?)null);

            // Act
            var result = await _roleService.UpdateRoleAsync(roleId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Role not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.RoleRepository.UpdateAsync(It.IsAny<Role>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        [Fact]
        public async Task DeleteRoleAsync_WithInvalidId_ShouldReturnFailureResult()
        {
            // Arrange
            var roleId = Guid.NewGuid().ToString();

            // Mock role not found (returns null)
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(Guid.Parse(roleId), true))
                          .ReturnsAsync((Role?)null);

            // Act
            var result = await _roleService.DeleteRoleAsync(roleId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Role not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.Query(It.IsAny<bool>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RoleRepository.DeleteAsync(It.IsAny<Role>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }
    }
}
