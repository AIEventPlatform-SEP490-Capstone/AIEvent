using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AIEvent.API.Test.Controllers
{
    public class RoleControllerTests
    {
        private readonly Mock<IRoleService> _mockRoleService;
        private readonly RoleController _roleController;

        public RoleControllerTests()
        {
            _mockRoleService = new Mock<IRoleService>();
            _roleController = new RoleController(_mockRoleService.Object);
        }

        [Fact]
        public async Task GetAllRoles_WhenSuccessful_ShouldReturnOkWithRoles()
        {
            // Arrange
            var roles = new List<RoleResponse>
            {
                new RoleResponse { Id = Guid.NewGuid().ToString(), Name = "Admin", Description = "Administrator role" },
                new RoleResponse { Id = Guid.NewGuid().ToString(), Name = "User", Description = "User role" }
            };

            var serviceResult = Result<List<RoleResponse>>.Success(roles);
            _mockRoleService.Setup(x => x.GetAllRolesAsync())
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.GetAllRoles();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<List<RoleResponse>>>();

            var successResponse = okResult.Value as SuccessResponse<List<RoleResponse>>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.Should().HaveCount(2);
            successResponse.Message.Should().Be("Roles retrieved successfully");

            _mockRoleService.Verify(x => x.GetAllRolesAsync(), Times.Once);
        }

        [Fact]
        public async Task GetAllRoles_WhenServiceFails_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Failed to retrieve roles", ErrorCodes.InternalServerError);
            var serviceResult = Result<List<RoleResponse>>.Failure(errorResponse);
            _mockRoleService.Setup(x => x.GetAllRolesAsync())
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.GetAllRoles();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Failed to retrieve roles");

            _mockRoleService.Verify(x => x.GetAllRolesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateRole_WithValidRequest_ShouldReturnOkWithCreatedRole()
        {
            // Arrange
            var createRequest = new CreateRoleRequest
            {
                Name = "Manager",
                Description = "Manager role"
            };

            var createdRole = new RoleResponse
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Manager",
                Description = "Manager role",
                CreatedAt = DateTime.UtcNow
            };

            var serviceResult = Result<RoleResponse>.Success(createdRole);
            _mockRoleService.Setup(x => x.CreateRoleAsync(createRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.CreateRole(createRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<RoleResponse>>();

            var successResponse = okResult.Value as SuccessResponse<RoleResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.StatusCode.Should().Be(SuccessCodes.Created);
            successResponse.Message.Should().Be("Role created successfully");
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.Name.Should().Be("Manager");

            _mockRoleService.Verify(x => x.CreateRoleAsync(createRequest), Times.Once);
        }

        [Fact]
        public async Task CreateRole_WhenRoleExists_ShouldReturnBadRequest()
        {
            // Arrange
            var createRequest = new CreateRoleRequest
            {
                Name = "Admin",
                Description = "Administrator role"
            };

            var errorResponse = ErrorResponse.FailureResult("Role with this name already exists", ErrorCodes.InvalidInput);
            var serviceResult = Result<RoleResponse>.Failure(errorResponse);
            _mockRoleService.Setup(x => x.CreateRoleAsync(createRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.CreateRole(createRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Role with this name already exists");

            _mockRoleService.Verify(x => x.CreateRoleAsync(createRequest), Times.Once);
        }

        [Fact]
        public async Task UpdateRole_WithValidRequest_ShouldReturnOkWithUpdatedRole()
        {
            // Arrange
            var roleId = Guid.NewGuid().ToString();
            var updateRequest = new UpdateRoleRequest
            {
                Description = "Updated description"
            };

            var updatedRole = new RoleResponse
            {
                Id = roleId,
                Name = "Admin",
                Description = "Updated description",
                UpdatedAt = DateTime.UtcNow
            };

            var serviceResult = Result<RoleResponse>.Success(updatedRole);
            _mockRoleService.Setup(x => x.UpdateRoleAsync(roleId, updateRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.UpdateRole(roleId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<RoleResponse>>();

            var successResponse = okResult.Value as SuccessResponse<RoleResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.StatusCode.Should().Be(SuccessCodes.Updated);
            successResponse.Message.Should().Be("Role updated successfully");
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.Description.Should().Be("Updated description");

            _mockRoleService.Verify(x => x.UpdateRoleAsync(roleId, updateRequest), Times.Once);
        }

        [Fact]
        public async Task UpdateRole_WhenRoleNotFound_ShouldReturnBadRequest()
        {
            // Arrange
            var roleId = Guid.NewGuid().ToString();
            var updateRequest = new UpdateRoleRequest
            {
                Description = "Updated description"
            };

            var errorResponse = ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            var serviceResult = Result<RoleResponse>.Failure(errorResponse);
            _mockRoleService.Setup(x => x.UpdateRoleAsync(roleId, updateRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.UpdateRole(roleId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Role not found");

            _mockRoleService.Verify(x => x.UpdateRoleAsync(roleId, updateRequest), Times.Once);
        }

        [Fact]
        public async Task DeleteRole_WithValidId_ShouldReturnOkWithSuccessMessage()
        {
            // Arrange
            var roleId = Guid.NewGuid().ToString();
            var serviceResult = Result.Success();
            _mockRoleService.Setup(x => x.DeleteRoleAsync(roleId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.DeleteRole(roleId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<object>>();

            var successResponse = okResult.Value as SuccessResponse<object>;
            successResponse!.Success.Should().BeTrue();
            successResponse.StatusCode.Should().Be(SuccessCodes.Deleted);
            successResponse.Message.Should().Be("Role deleted successfully");

            _mockRoleService.Verify(x => x.DeleteRoleAsync(roleId), Times.Once);
        }

        [Fact]
        public async Task DeleteRole_WhenRoleNotFound_ShouldReturnBadRequest()
        {
            // Arrange
            var roleId = Guid.NewGuid().ToString();
            var errorResponse = ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            var serviceResult = Result.Failure(errorResponse);
            _mockRoleService.Setup(x => x.DeleteRoleAsync(roleId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _roleController.DeleteRole(roleId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Role not found");

            _mockRoleService.Verify(x => x.DeleteRoleAsync(roleId), Times.Once);
        }

        [Fact]
        public void Constructor_ShouldInitializeWithRoleService()
        {
            // Act & Assert
            var controller = new RoleController(_mockRoleService.Object);
            controller.Should().NotBeNull();
        }
    }
}
