using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Moq;
using MockQueryable.Moq;
using Microsoft.AspNetCore.Http.HttpResults;

namespace AIEvent.Application.Test.Services
{
    public class RuleRefundServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<IMapper> _mockMapper;
        private readonly IRuleRefundService _ruleService;
        public RuleRefundServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _ruleService = new RuleRefundService(_mockUnitOfWork.Object,
                                                    _mockTransactionHelper.Object,
                                                    _mockMapper.Object);
        }
        #region Create RuleRefund
        [Fact]
        public async Task UTCID01_CreateRuleAsync_RuleNameNull_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = null!,
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 1, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!); // Mock để tránh null ref
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!); // Mock để tránh null ref

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Rule name is required");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID02_CreateRuleAsync_RuleDescriptionNull_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = null!,
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 1, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Rule description is required");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID03_CreateRuleAsync_RuleRefundDetailsNull_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = null!
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("At least one rule detail is required");
        }

        [Fact]
        public async Task UTCID04_CreateRuleAsync_MinDaysNull_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = null, MaxDaysBeforeEvent = 1, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Min days before event is required");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID05_CreateRuleAsync_MaxDaysNull_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = null, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Max days before event is required");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID06_CreateRuleAsync_RefundPercentNull_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = null! }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Refund percent is required");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID07_CreateRuleAsync_RefundPercentBelowRange_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = -1 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Refund percent value from 0 to 100");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID08_CreateRuleAsync_RefundPercentAboveRange_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 101 }
            }
            };

            _mockMapper.Setup(m => m.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>()))
            .Returns(new RefundRule
            {
                RuleName = "MockRule",
                RuleDescription = "Mock Description",
                CreatedAt = DateTime.UtcNow,
                IsSystem = false
            });



            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                    .Returns<Func<Task<Result>>>(async action => await action());


            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Refund percent value from 0 to 100");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID09_CreateRuleAsync_MinDaysGreaterMaxDays_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 3, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("MinDays (3) cannot be greater than MaxDays (2)");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }
        [Fact]
        public async Task UTCID10_CreateRuleAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Never);
        }

        [Fact]
        public async Task UTCID11_CreateRuleAsync_UserInactive_ShouldReturnUnauthorized()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };
            var inactiveUser = new User { Id = Guid.NewGuid(), IsActive = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(inactiveUser.Id, true)).ReturnsAsync(inactiveUser);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(inactiveUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID12_CreateRuleAsync_UserDeleted_ShouldReturnUnauthorized()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };
            var deletedUser = new User { Id = Guid.NewGuid(), IsActive = true, DeletedAt = DateTime.UtcNow };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(deletedUser.Id, true)).ReturnsAsync(deletedUser);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(deletedUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID13_CreateRuleAsync_RoleNull_ShouldReturnNotFound()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((Role)null!);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID14_CreateRuleAsync_RoleDeleted_ShouldReturnNotFound()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var deletedRole = new Role { Id = validUser.RoleId, IsDeleted = true };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(deletedRole.Id, true)).ReturnsAsync(deletedRole);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID15_CreateRuleAsync_MappingNull_ShouldReturnInternalError()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var validRole = new Role { Id = validUser.RoleId, Name = "Organizer", IsDeleted = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(validRole.Id, true)).ReturnsAsync(validRole);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns((RefundRule)null!);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            result.Error!.Message.Should().Be("Failed to map refund rule");
        }

        [Fact]
        public async Task UTCID16_CreateRuleAsync_NonAdmin_Boundaries_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
        {
            new() { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 0, RefundPercent = 0 },
            new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 1, RefundPercent = 50 }
        }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var nonAdminRole = new Role { Id = validUser.RoleId, Name = "Organizer", IsDeleted = false };
            var refundRule = new RefundRule { Id = Guid.NewGuid(), RuleName = "abc", IsSystem = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(nonAdminRole.Id, true)).ReturnsAsync(nonAdminRole);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns(refundRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(refundRule)).Verifiable();
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            refundRule.IsSystem.Should().BeFalse();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(refundRule), Times.Once());
            _mockUnitOfWork.Verify(); // Kiểm tra tất cả các hành vi verifiable
        }

        [Fact]
        public async Task UTCID17_CreateRuleAsync_Admin_BoundaryEdges_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = int.MaxValue-1, RefundPercent = 0 },
                new() { MinDaysBeforeEvent = int.MinValue+1, MaxDaysBeforeEvent = 1, RefundPercent = 100 }
            }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var adminRole = new Role { Id = validUser.RoleId, Name = "Admin", IsDeleted = false };
            var refundRule = new RefundRule { Id = Guid.NewGuid(), RuleName = "abc", IsSystem = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(adminRole.Id, true)).ReturnsAsync(adminRole);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns(refundRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(refundRule));
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            refundRule.IsSystem.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(refundRule), Times.Once());
        }

        [Fact]
        public async Task UTCID18_CreateRuleAsync_BoundaryValueZero_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 0, RefundPercent = 0 }
            }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var adminRole = new Role { Id = validUser.RoleId, Name = "Admin", IsDeleted = false };
            var refundRule = new RefundRule { Id = Guid.NewGuid(), RuleName = "abc", IsSystem = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(adminRole.Id, true)).ReturnsAsync(adminRole);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns(refundRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(refundRule));
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            refundRule.IsSystem.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(refundRule), Times.Once());
        }

        [Fact]
        public async Task UTCID19_CreateRuleAsync_BoundaryValueHundred_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 1, RefundPercent = 100 }
            }
            };
            var validUser = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var adminRole = new Role { Id = validUser.RoleId, Name = "Admin", IsDeleted = false };
            var refundRule = new RefundRule { Id = Guid.NewGuid(), RuleName = "abc", IsSystem = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(validUser.Id, true)).ReturnsAsync(validUser);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(adminRole.Id, true)).ReturnsAsync(adminRole);
            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>())).Returns(refundRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(refundRule));
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(validUser.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            refundRule.IsSystem.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(refundRule), Times.Once());
        }
        #endregion

        #region Delete Rule
        [Fact]
        public async Task UTCID01_DeleteRuleAsync_EmptyUserId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var ruleId = Guid.NewGuid();

            // Act
            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID02_DeleteRuleAsync_EmptyRuleId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var ruleId = Guid.Empty;

            // Act
            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID03_DeleteRuleAsync_BothEmptyGuids_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var ruleId = Guid.Empty;

            // Act
            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID04_DeleteRuleAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var ruleId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID05_DeleteRuleAsync_RoleNull_ShouldReturnNotFound()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var ruleId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(user.RoleId, true)).ReturnsAsync((Role)null!);

            // Act
            var result = await _ruleService.DeleteRuleAsync(user.Id, ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID06_DeleteRuleAsync_RuleNull_ShouldReturnInvalidInput()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var ruleId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync((RefundRule)null!);

            // Act
            var result = await _ruleService.DeleteRuleAsync(user.Id, ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found or inactive");
        }

        [Fact]
        public async Task UTCID07_DeleteRuleAsync_RuleDeleted_ShouldReturnInvalidInput()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", DeletedAt = DateTime.UtcNow };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);

            // Act
            var result = await _ruleService.DeleteRuleAsync(user.Id, rule.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found or inactive");
        }

        [Fact]
        public async Task UTCID08_DeleteRuleAsync_NonAdminSystemRule_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", IsSystem = true };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);

            // Act
            var result = await _ruleService.DeleteRuleAsync(user.Id, rule.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("System rule cannot be modified by user");
        }

        [Fact]
        public async Task UTCID09_DeleteRuleAsync_NonAdminNotOwner_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", IsSystem = false, CreatedBy = Guid.NewGuid().ToString() };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);

            // Act
            var result = await _ruleService.DeleteRuleAsync(user.Id, rule.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("You can only modify your own rules");
        }

        [Fact]
        public async Task UTCID10_DeleteRuleAsync_AdminSuccess_ShouldDeleteAndSave()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", IsSystem = true, CreatedBy = admin.Id.ToString() };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.DeleteAsync(rule));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _ruleService.DeleteRuleAsync(admin.Id, rule.Id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.DeleteAsync(rule), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }
        #endregion

        #region Get RuleRefund
        [Fact]
        public async Task UTCID01_GetRuleRefundAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(userId, 1, 10);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID02_GetRuleRefundAsync_RoleNull_ShouldReturnNotFound()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(user.RoleId, true)).ReturnsAsync((Role)null!);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(user.Id, 1, 10);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID03_GetRuleRefundAsync_NonAdmin_FilterAndPaginate_ShouldReturnResults()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rules = new List<RefundRule>
            {
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-2), CreatedBy = user.Id.ToString(), IsSystem = false, RuleName = "A", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-1), CreatedBy = Guid.NewGuid().ToString(), IsSystem = true, RuleName = "B", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-3), CreatedBy = Guid.NewGuid().ToString(), IsSystem = false, RuleName = "C", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(user.Id, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.Items.Select(i => i.RuleName).Should().Contain(new[] { "A", "B" });
            result.Value!.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task UTCID04_GetRuleRefundAsync_Admin_ShouldReturnAll()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var rules = new List<RefundRule>
            {
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-2), CreatedBy = admin.Id.ToString(), IsSystem = true, RuleName = "A", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-1), CreatedBy = Guid.NewGuid().ToString(), IsSystem = false, RuleName = "B", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(admin.Id, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task UTCID05_GetRuleRefundAsync_PaginationFirstPage_ShouldReturnCorrectItems()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var rules = new List<RefundRule>
            {
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-3), CreatedBy = admin.Id.ToString(), IsSystem = true, RuleName = "A", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-2), CreatedBy = admin.Id.ToString(), IsSystem = false, RuleName = "B", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-1), CreatedBy = admin.Id.ToString(), IsSystem = true, RuleName = "C", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(admin.Id, 1, 2);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(2);
        }

        [Fact]
        public async Task UTCID06_GetRuleRefundAsync_PaginationSecondPage_ShouldReturnCorrectItems()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var rules = new List<RefundRule>
            {
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-3), CreatedBy = admin.Id.ToString(), IsSystem = true, RuleName = "A", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-2), CreatedBy = admin.Id.ToString(), IsSystem = false, RuleName = "B", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() },
                new RefundRule { Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddDays(-1), CreatedBy = admin.Id.ToString(), IsSystem = true, RuleName = "C", RuleDescription = "d", RefundRuleDetails = new List<RefundRuleDetail>() }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(admin.Id, 2, 2);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(2);
            result.Value!.PageSize.Should().Be(2);
        }

        [Fact]
        public async Task UTCID07_GetRuleRefundAsync_EmptyResult_ShouldReturnEmptyList()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var rules = new List<RefundRule>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(admin.Id, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
        }

        [Fact]
        public async Task UTCID08_GetRuleRefundAsync_NonAdminUserInactive_ShouldReturnUnauthorized()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = false, RoleId = Guid.NewGuid() };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(user.Id, 1, 10);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID09_GetRuleRefundAsync_NonAdminUserDeleted_ShouldReturnUnauthorized()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, DeletedAt = DateTime.UtcNow, RoleId = Guid.NewGuid() };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(user.Id, 1, 10);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }
        #endregion

        #region Update Rule
        [Fact]
        public async Task UTCID01_UpdateRuleAsync_EmptyUserId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var ruleId = Guid.NewGuid();
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleAsync(userId, ruleId, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID02_UpdateRuleAsync_EmptyRuleId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var ruleId = Guid.Empty;
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleAsync(userId, ruleId, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID03_UpdateRuleAsync_BothEmptyGuids_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var ruleId = Guid.Empty;
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleAsync(userId, ruleId, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID04_UpdateRuleAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var ruleId = Guid.NewGuid();
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _ruleService.UpdateRuleAsync(userId, ruleId, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID05_UpdateRuleAsync_RuleNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleAsync(user.Id, Guid.NewGuid(), new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found");
        }

        [Fact]
        public async Task UTCID06_UpdateRuleAsync_SystemRuleNonAdmin_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", IsSystem = true, CreatedBy = user.Id.ToString(), RefundRuleDetails = new List<RefundRuleDetail>() };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule> { rule }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleAsync(user.Id, rule.Id, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("System rule cannot be modified by user");
        }

        [Fact]
        public async Task UTCID07_UpdateRuleAsync_NonAdminNotOwner_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", IsSystem = false, CreatedBy = Guid.NewGuid().ToString(), RefundRuleDetails = new List<RefundRuleDetail>() };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule> { rule }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleAsync(user.Id, rule.Id, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("You can only modify your own rules");
        }

        [Fact]
        public async Task UTCID08_UpdateRuleAsync_AdminSuccess_ShouldUpdate()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", IsSystem = true, CreatedBy = admin.Id.ToString(), RefundRuleDetails = new List<RefundRuleDetail>() };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule> { rule }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.UpdateAsync(rule));

            // Act
            var result = await _ruleService.UpdateRuleAsync(admin.Id, rule.Id, new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.UpdateAsync(rule), Times.Once());
        }

        [Fact]
        public async Task UTCID09_UpdateRuleAsync_RoleNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync((Role)null!);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false)).Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleAsync(user.Id, Guid.NewGuid(), new UpdateRuleRefundRequest());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }
        #endregion

        #region Update Rule Detail
        [Fact]
        public async Task UTCID01_UpdateRuleDetailAsync_EmptyUserId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var detailId = Guid.NewGuid();
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(userId, detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID02_UpdateRuleDetailAsync_EmptyDetailId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var detailId = Guid.Empty;
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(userId, detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID03_UpdateRuleDetailAsync_BothEmptyGuids_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var detailId = Guid.Empty;
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(userId, detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID04_UpdateRuleDetailAsync_MinGreaterThanMax_ShouldReturnInvalidInput()
        {
            // Arrange
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 5, MaxDaysBeforeEvent = 1 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(Guid.NewGuid(), Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid rule detail: MinDays (5) cannot be greater than MaxDays (1)");
        }

        [Fact]
        public async Task UTCID05_UpdateRuleDetailAsync_ValidationFailure_ShouldReturnInvalidInput()
        {
            // Arrange
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 101 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(Guid.NewGuid(), Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Refund percent value from 0 to 100.");
        }

        [Fact]
        public async Task UTCID06_UpdateRuleDetailAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var detailId = Guid.NewGuid();
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(userId, detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID07_UpdateRuleDetailAsync_RoleNull_ShouldReturnNotFound()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var detailId = Guid.NewGuid();
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(user.RoleId, true)).ReturnsAsync((Role)null!);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(user.Id, detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID08_UpdateRuleDetailAsync_DetailNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var detailId = Guid.NewGuid();
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(admin.Id, detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule detail not found");
        }

        [Fact]
        public async Task UTCID09_UpdateRuleDetailAsync_NonAdmin_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var detail = new RefundRuleDetail { Id = Guid.NewGuid(), CreatedBy = Guid.NewGuid().ToString() };
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(user.Id, detail.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("You can only modify your own rules detail");
        }

        [Fact]
        public async Task UTCID010_UpdateRuleDetailAsync_AdminSuccess_ShouldUpdate()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var detail = new RefundRuleDetail { Id = Guid.NewGuid(), CreatedBy = admin.Id.ToString() };
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.UpdateAsync(detail));

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(admin.Id, detail.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.UpdateAsync(detail), Times.Once());
        }
        #endregion

        #region Delete Rule Detail
        [Fact]
        public async Task UTCID01_DeleteRuleDetailAsync_EmptyUserId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var detailId = Guid.NewGuid();

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(userId, detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID02_DeleteRuleDetailAsync_EmptyDetailId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var detailId = Guid.Empty;

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(userId, detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID03_DeleteRuleDetailAsync_BothEmptyGuids_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var detailId = Guid.Empty;

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(userId, detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID04_DeleteRuleDetailAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var detailId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(userId, detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID05_DeleteRuleDetailAsync_RoleNull_ShouldReturnNotFound()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var detailId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(user.RoleId, true)).ReturnsAsync((Role)null!);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(user.Id, detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID06_DeleteRuleDetailAsync_DetailNull_ShouldReturnInvalidInput()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Admin" };
            var detailId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(user.Id, detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule detail not found or inactive");
        }

        [Fact]
        public async Task UTCID07_DeleteRuleDetailAsync_DetailDeleted_ShouldReturnInvalidInput()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Admin" };
            var detail = new RefundRuleDetail { Id = Guid.NewGuid(), DeletedAt = DateTime.UtcNow };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(user.Id, detail.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule detail not found or inactive");
        }

        [Fact]
        public async Task UTCID08_DeleteRuleDetailAsync_NonAdmin_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var detail = new RefundRuleDetail { Id = Guid.NewGuid(), CreatedBy = Guid.NewGuid().ToString() };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(user.Id, detail.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("You can only modify your own rules detail");
        }

        [Fact]
        public async Task UTCID09_DeleteRuleDetailAsync_AdminSuccess_ShouldDeleteAndSave()
        {
            // Arrange
            var admin = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = admin.RoleId, Name = "Admin" };
            var detail = new RefundRuleDetail { Id = Guid.NewGuid(), CreatedBy = admin.Id.ToString() };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(admin.Id, true)).ReturnsAsync(admin);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.DeleteAsync(detail));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(admin.Id, detail.Id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.DeleteAsync(detail), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }
        #endregion

        #region Create Rule Detail
        [Fact]
        public async Task UTCID01_CreateRuleDetailAsync_EmptyUserId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var ruleId = Guid.NewGuid();
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(userId, ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID02_CreateRuleDetailAsync_EmptyRuleId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var ruleId = Guid.Empty;
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(userId, ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID03_CreateRuleDetailAsync_BothEmptyGuids_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var ruleId = Guid.Empty;
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(userId, ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UTCID04_CreateRuleDetailAsync_ValidationFailure_ShouldReturnInvalidInput()
        {
            // Arrange
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 101 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(Guid.NewGuid(), Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Refund percent value from 0 to 100.");
        }

        [Fact]
        public async Task UTCID05_CreateRuleDetailAsync_MinGreaterThanMax_ShouldReturnInvalidInput()
        {
            // Arrange
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 5, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(Guid.NewGuid(), Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid rule detail: MinDays (5) cannot be greater than MaxDays (1)");
        }

        [Fact]
        public async Task UTCID06_CreateRuleDetailAsync_RuleNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.NewGuid();
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(Guid.NewGuid(), ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found");
        }

        [Fact]
        public async Task UTCID07_CreateRuleDetailAsync_UserNull_ShouldReturnUnauthorized()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), true)).ReturnsAsync((User)null!);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(Guid.NewGuid(), rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID08_CreateRuleDetailAsync_UserInactive_ShouldReturnUnauthorized()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = false };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID09_CreateRuleDetailAsync_UserDeleted_ShouldReturnUnauthorized()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, DeletedAt = DateTime.UtcNow };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            result.Error!.Message.Should().Be("User not found or inactive");
        }

        [Fact]
        public async Task UTCID10_CreateRuleDetailAsync_RoleNull_ShouldReturnNotFound()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(user.RoleId, true)).ReturnsAsync((Role)null!);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            result.Error!.Message.Should().Be("Role not found");
        }

        [Fact]
        public async Task UTCID11_CreateRuleDetailAsync_NonAdmin_ShouldReturnPermissionDenied()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Organizer" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
            result.Error!.Message.Should().Be("System rule detail cannot be add by user");
        }

        [Fact]
        public async Task UTCID12_CreateRuleDetailAsync_AdminSuccess_ShouldAdd()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Admin" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.AddAsync(It.IsAny<RefundRuleDetail>()));

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.AddAsync(It.Is<RefundRuleDetail>(d => d.RefundRuleId == rule.Id && d.MinDaysBeforeEvent == 0 && d.MaxDaysBeforeEvent == 1 && d.RefundPercent == 50)), Times.Once());
        }

        [Fact]
        public async Task UTCID13_CreateRuleDetailAsync_BoundaryValueZero_ShouldAdd()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Admin" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 0, RefundPercent = 0 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.AddAsync(It.IsAny<RefundRuleDetail>()));

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.AddAsync(It.Is<RefundRuleDetail>(d => d.RefundRuleId == rule.Id && d.MinDaysBeforeEvent == 0 && d.MaxDaysBeforeEvent == 0 && d.RefundPercent == 0)), Times.Once());
        }

        [Fact]
        public async Task UTCID14_CreateRuleDetailAsync_BoundaryValueHundred_ShouldAdd()
        {
            // Arrange
            var user = new User { Id = Guid.NewGuid(), IsActive = true, RoleId = Guid.NewGuid() };
            var role = new Role { Id = user.RoleId, Name = "Admin" };
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 1, RefundPercent = 100 };
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true)).ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(user.Id, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.RoleRepository.GetByIdAsync(role.Id, true)).ReturnsAsync(role);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.AddAsync(It.IsAny<RefundRuleDetail>()));

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(user.Id, rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.AddAsync(It.Is<RefundRuleDetail>(d => d.RefundRuleId == rule.Id && d.MinDaysBeforeEvent == 1 && d.MaxDaysBeforeEvent == 1 && d.RefundPercent == 100)), Times.Once());
        }
        #endregion
    }
}
