
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
        public async Task CreateRuleAsync_WithValidRequestWithRoleAdmin_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new CreateRuleRefundRequest
            {
                RuleName = "Test Rule",
                RuleDescription = "Test Description",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
        {
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 1,
                MaxDaysBeforeEvent = 7,
                RefundPercent = 50,
                Note = "50% refund for 1-7 days"
            },
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 8,
                MaxDaysBeforeEvent = 30,
                RefundPercent = 80,
                Note = "80% refund for 8-30 days"
            }
        }
            };

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var mappedRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = request.RuleName,
                RuleDescription = request.RuleDescription,
                IsSystem = true,
                RefundRuleDetails = request.RuleRefundDetails.Select(d => new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = d.MinDaysBeforeEvent,
                    MaxDaysBeforeEvent = d.MaxDaysBeforeEvent,
                    RefundPercent = d.RefundPercent,
                    Note = d.Note
                }).ToList()
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            _mockMapper.Setup(x => x.Map<RefundRule>(request)).Returns(mappedRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(mappedRule));

            var result = await _ruleService.CreateRuleAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockMapper.Verify(x => x.Map<RefundRule>(request), Times.Once);
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Once);
        }

        [Fact]
        public async Task CreateRuleAsync_WithValidRequestWithRoleOrganizer_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new CreateRuleRefundRequest
            {
                RuleName = "Test Rule",
                RuleDescription = "Test Description",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
        {
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 1,
                MaxDaysBeforeEvent = 7,
                RefundPercent = 50,
                Note = "50% refund for 1-7 days"
            }
        }
            };

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var mappedRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = request.RuleName,
                RuleDescription = request.RuleDescription,
                IsSystem = false,
                RefundRuleDetails = request.RuleRefundDetails.Select(d => new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = d.MinDaysBeforeEvent,
                    MaxDaysBeforeEvent = d.MaxDaysBeforeEvent,
                    RefundPercent = d.RefundPercent,
                    Note = d.Note
                }).ToList()
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            _mockMapper.Setup(x => x.Map<RefundRule>(request)).Returns(mappedRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(mappedRule));

            var result = await _ruleService.CreateRuleAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            _mockMapper.Verify(x => x.Map<RefundRule>(request), Times.Once);
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Once);
        }

        [Fact]
        public async Task CreateRuleAsync_WhenUserInActive_ShouldReturnUnauthorizedFailure()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new CreateRuleRefundRequest
            {
                RuleName = "Test Rule",
                RuleDescription = "Test Description",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
        {
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 1,
                MaxDaysBeforeEvent = 7,
                RefundPercent = 50,
                Note = "50% refund for 1-7 days"
            },
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 8,
                MaxDaysBeforeEvent = 30,
                RefundPercent = 80,
                Note = "80% refund for 8-30 days"
            }
        }
            };

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = false
            };

            var mappedRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = request.RuleName,
                RuleDescription = request.RuleDescription,
                IsSystem = false,
                RefundRuleDetails = request.RuleRefundDetails.Select(d => new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = d.MinDaysBeforeEvent,
                    MaxDaysBeforeEvent = d.MaxDaysBeforeEvent,
                    RefundPercent = d.RefundPercent,
                    Note = d.Note
                }).ToList()
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            var result = await _ruleService.CreateRuleAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task CreateRuleAsync_WhenMapperReturnsNull_ShouldReturnFailure()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var request = new CreateRuleRefundRequest
            {
                RuleName = "Test Rule",
                RuleDescription = "Test Description",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
        {
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 1,
                MaxDaysBeforeEvent = 7,
                RefundPercent = 50,
                Note = "50% refund for 1-7 days"
            },
            new RuleRefundDetailRequest
            {
                MinDaysBeforeEvent = 8,
                MaxDaysBeforeEvent = 30,
                RefundPercent = 80,
                Note = "80% refund for 8-30 days"
            }
        }
            };

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            _mockMapper.Setup(x => x.Map<RefundRule>(request)).Returns((RefundRule?)null!);

            var result = await _ruleService.CreateRuleAsync(userId, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to map refund rule");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);

        }
        #endregion

        #region Delete Rule
        [Fact]
        public async Task DeleteRuleAsync_WithValidRequestWithRoleAdmin_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var ruleId = Guid.Parse("11111111-1111-1111-1111-111111111111"); ;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var systemRule = new RefundRule
            {
                Id = ruleId,
                RuleName = "System Rule",
                RuleDescription = "System Description",
                IsSystem = true,
                CreatedBy = "admin-user-id",
                DeletedAt = null,
            };
            var roles = new List<string> { "Admin" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync(systemRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.DeleteAsync(systemRule));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.DeleteAsync(It.IsAny<RefundRule>()), Times.Once);
        }


        [Fact]
        public async Task DeleteRuleAsync_WithValidRequestWithRoleOrganizer_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var ruleId = Guid.Parse("11111111-1111-1111-1111-111111111111"); ;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var systemRule = new RefundRule
            {
                Id = ruleId,
                RuleName = "System Rule",
                RuleDescription = "System Description",
                IsSystem = false,
                CreatedBy = userId.ToString(),
                DeletedAt = null,
            };
            var roles = new List<string> { "Admin", "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync(systemRule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.DeleteAsync(systemRule));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.DeleteAsync(It.IsAny<RefundRule>()), Times.Once);
        }



        [Fact]
        public async Task DeleteRuleAsync_WithInValidUser_ShouldReturnFailure()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var ruleId = Guid.Parse("11111111-1111-1111-1111-111111111111"); ;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var systemRule = new RefundRule
            {
                Id = ruleId,
                RuleName = "System Rule",
                RuleDescription = "System Description",
                IsSystem = false,
                CreatedBy = userId.ToString(),
                DeletedAt = null,
            };
            var roles = new List<string> { "Admin", "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task DeleteRuleAsync_WithInValidRule_ShouldReturnFailure()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var ruleId = Guid.Parse("11111111-1111-1111-1111-111111111111"); ;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var systemRule = new RefundRule
            {
                Id = ruleId,
                RuleName = "System Rule",
                RuleDescription = "System Description",
                IsSystem = false,
                CreatedBy = userId.ToString(),
                DeletedAt = new DateTimeOffset(2025, 10, 26, 10, 30, 0, TimeSpan.Zero),
            };

            var roles = new List<string> { "Admin", "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync(systemRule);

            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Rule not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task DeleteRuleAsync_WithUserDeleteRuleSystems_ShouldReturnFailure()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var ruleId = Guid.Parse("11111111-1111-1111-1111-111111111111"); ;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var systemRule = new RefundRule
            {
                Id = ruleId,
                RuleName = "System Rule",
                RuleDescription = "System Description",
                IsSystem = true,
                CreatedBy = userId.ToString(),
            };

            var roles = new List<string> { "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
              .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync(systemRule);

            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("System rule cannot be modified by user");
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
        }

        [Fact]
        public async Task DeleteRuleAsync_WithUserDeleteDiffirentRuleOur_ShouldReturnFailure()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId2 = Guid.Parse("22222222-2222-2222-2222-222222222AAA");
            var ruleId = Guid.Parse("11111111-1111-1111-1111-111111111111"); ;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                IsActive = true
            };

            var systemRule = new RefundRule
            {
                Id = ruleId,
                RuleName = "System Rule",
                RuleDescription = "System Description",
                IsSystem = false,
                CreatedBy = userId2.ToString(),
            };

            var roles = new List<string> { "Organizer" };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
              .Returns<Func<Task<Result>>>(func => func());
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true)).ReturnsAsync(systemRule);

            var result = await _ruleService.DeleteRuleAsync(userId, ruleId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You can only modify your own rules");
            result.Error!.StatusCode.Should().Be(ErrorCodes.PermissionDenied);
        }
        #endregion
    }
}
