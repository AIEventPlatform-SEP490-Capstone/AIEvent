using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using Moq;
using MockQueryable.Moq; 

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
        public async Task CreateRuleAsync_NullRuleName_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = null!,
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                    new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Rule name is required");
        }

        [Fact]
        public async Task CreateRuleAsync_NullRuleDescription_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = null!,
                RuleRefundDetails = new List<RuleRefundDetailRequest>
            {
                    new() { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 }
            }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Rule description is required");
        }

        [Fact]
        public async Task CreateRuleAsync_NullRuleDetails_ShouldReturnValidationFailure()
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

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task CreateRuleAsync_NullMinDaysBeforeEvent_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
                {
                    new RuleRefundDetailRequest
                    {
                        MinDaysBeforeEvent = null,
                        MaxDaysBeforeEvent = 1,
                        RefundPercent = 50
                    }
                }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Min days before event is required");
        }

        [Fact]
        public async Task CreateRuleAsync_NullMaxDaysBeforeEvent_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
                {
                    new RuleRefundDetailRequest
                    {
                        MinDaysBeforeEvent = 1,
                        MaxDaysBeforeEvent = null,
                        RefundPercent = 50
                    }
                }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Max days before event is required");
        }

        [Fact]
        public async Task CreateRuleAsync_NullRefundPercent_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
                {
                    new RuleRefundDetailRequest
                    {
                        MinDaysBeforeEvent = 1,
                        MaxDaysBeforeEvent = 2,
                        RefundPercent = null
                    }
                }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Refund percent is required");
        }

        [Fact]
        public async Task CreateRuleAsync_NullRefundPercentInValid_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
                {
                    new RuleRefundDetailRequest
                    {
                        MinDaysBeforeEvent = 1,
                        MaxDaysBeforeEvent = 2,
                        RefundPercent = -1
                    }
                }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Refund percent value from 0 to 100.");
        }

        [Fact]
        public async Task CreateRuleAsync_NullRefundPercentThan100_ShouldReturnValidationFailure()
        {
            // Arrange
            var request = new CreateRuleRefundRequest
            {
                RuleName = "name",
                RuleDescription = "desc",
                RuleRefundDetails = new List<RuleRefundDetailRequest>
                {
                    new RuleRefundDetailRequest
                    {
                        MinDaysBeforeEvent = 1,
                        MaxDaysBeforeEvent = 2,
                        RefundPercent = 101
                    }
                }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Refund percent value from 0 to 100.");
        }


        [Fact]
        public async Task CreateRuleAsync_MinDaysGreaterThanMaxDays_ShouldReturnValidationFailure()
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

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("MinDays (3) cannot be greater than MaxDays (2)");
        }

        [Fact]
        public async Task CreateRuleAsync_MappingNull_ShouldReturnInternalError()
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

            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>()))
                .Returns((RefundRule)null!);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            result.Error!.Message.Should().Be("Failed to map refund rule");
        }

        [Fact]
        public async Task CreateRuleAsync_ValidRequest_ShouldSucceed()
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

            var refundRule = new RefundRule 
            {
                RuleName = "name",
                RuleDescription = "desc"
            };

            _mockMapper.Setup(x => x.Map<RefundRule>(It.IsAny<CreateRuleRefundRequest>()))
                .Returns(refundRule);
            
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()));
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _ruleService.CreateRuleAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.AddAsync(It.IsAny<RefundRule>()), Times.Once);
        }

        
        #endregion

        #region Delete Rule
        [Fact]
        public async Task DeleteRuleAsync_EmptyRuleId_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.Empty;

            // Act
            var result = await _ruleService.DeleteRuleAsync(ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task DeleteRuleAsync_RuleNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true))
                .ReturnsAsync((RefundRule)null!);

            // Act
            var result = await _ruleService.DeleteRuleAsync(ruleId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found or inactive");
        }

        [Fact]
        public async Task DeleteRuleAsync_RuleDeleted_ShouldReturnInvalidInput()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo", DeletedAt = DateTime.UtcNow };
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true))
                .ReturnsAsync(rule);

            // Act
            var result = await _ruleService.DeleteRuleAsync(rule.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found or inactive");
        }

        [Fact]
        public async Task DeleteRuleAsync_ValidRule_ShouldSucceed()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true))
                .ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.DeleteAsync(rule));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _ruleService.DeleteRuleAsync(rule.Id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.DeleteAsync(rule), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }
        #endregion

        #region Get RuleRefund
        [Fact]
        public async Task GetRuleRefundAsync_Pagination_ShouldReturnResults()
        {
            // Arrange
            var rules = new List<RefundRule>
            {
                new RefundRule { Id = Guid.NewGuid(), RuleName = "A", RuleDescription = "d", CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new RefundRule { Id = Guid.NewGuid(), RuleName = "B", RuleDescription = "d", CreatedAt = DateTime.UtcNow.AddDays(-1) }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false))
                .Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task GetRuleRefundAsync_EmptyResult_ShouldReturnEmptyList()
        {
            // Arrange
            var rules = new List<RefundRule>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false))
                .Returns(rules.Object);

            // Act
            var result = await _ruleService.GetRuleRefundAsync(1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
        }
        #endregion

        #region Update Rule
        [Fact]
        public async Task UpdateRuleAsync_EmptyRuleId_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.Empty;
            var request = new UpdateRuleRefundRequest();
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleAsync(ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UpdateRuleAsync_RuleNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.NewGuid();
            var request = new UpdateRuleRefundRequest();
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false))
                .Returns(new List<RefundRule>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleAsync(ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found");
        }

        [Fact]
        public async Task UpdateRuleAsync_ValidRule_ShouldSucceed()
        {
            // Arrange
            var rule = new RefundRule 
            { 
                Id = Guid.NewGuid(), 
                RuleName = "ruleDemo",
                RefundRuleDetails = new List<RefundRuleDetail>()
            };
            var request = new UpdateRuleRefundRequest { RuleName = "Updated" };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            
            var mockQueryable = new List<RefundRule> { rule }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.Query(false))
                .Returns(mockQueryable.Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.UpdateAsync(rule));
            
            _mockMapper.Setup(x => x.Map(It.IsAny<UpdateRuleRefundRequest>(), It.IsAny<RefundRule>()))
                .Returns<UpdateRuleRefundRequest, RefundRule>((req, r) => r);

            // Act
            var result = await _ruleService.UpdateRuleAsync(rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleRepository.UpdateAsync(rule), Times.Once);
        }
        #endregion

        #region Update Rule Detail
        [Fact]
        public async Task UpdateRuleDetailAsync_EmptyDetailId_ShouldReturnInvalidInput()
        {
            // Arrange
            var detailId = Guid.Empty;
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task UpdateRuleDetailAsync_MinDaysGreaterThanMaxDays_ShouldReturnInvalidInput()
        {
            // Arrange
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 5, MaxDaysBeforeEvent = 1 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("MinDays (5) cannot be greater than MaxDays (1)");
        }

        [Fact]
        public async Task UpdateRuleDetailAsync_DetailNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var detailId = Guid.NewGuid();
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(detailId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule detail not found");
        }

        [Fact]
        public async Task UpdateRuleDetailAsync_ValidDetail_ShouldSucceed()
        {
            // Arrange
            var detail = new RefundRuleDetail { Id = Guid.NewGuid() };
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.UpdateAsync(detail));
            
            _mockMapper.Setup(x => x.Map(It.IsAny<UpdateRuleRefundDetailRequest>(), It.IsAny<RefundRuleDetail>()))
                .Returns<UpdateRuleRefundDetailRequest, RefundRuleDetail>((req, d) => d);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(detail.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.UpdateAsync(detail), Times.Once);
        }

        [Fact]
        public async Task UpdateRuleDetailAsync_InValidPercent_ShouldSucceed()
        {
            // Arrange
            var detail = new RefundRuleDetail { Id = Guid.NewGuid() };
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 101 };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.UpdateAsync(detail));

            _mockMapper.Setup(x => x.Map(It.IsAny<UpdateRuleRefundDetailRequest>(), It.IsAny<RefundRuleDetail>()))
                .Returns<UpdateRuleRefundDetailRequest, RefundRuleDetail>((req, d) => d);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(detail.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UpdateRuleDetailAsync_InValidNegativePercent_ShouldSucceed()
        {
            // Arrange
            var detail = new RefundRuleDetail { Id = Guid.NewGuid() };
            var request = new UpdateRuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = -1 };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.UpdateAsync(detail));

            _mockMapper.Setup(x => x.Map(It.IsAny<UpdateRuleRefundDetailRequest>(), It.IsAny<RefundRuleDetail>()))
                .Returns<UpdateRuleRefundDetailRequest, RefundRuleDetail>((req, d) => d);

            // Act
            var result = await _ruleService.UpdateRuleDetailAsync(detail.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion

        #region Delete Rule Detail
        [Fact]
        public async Task DeleteRuleDetailAsync_EmptyDetailId_ShouldReturnInvalidInput()
        {
            // Arrange
            var detailId = Guid.Empty;

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task DeleteRuleDetailAsync_DetailNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var detailId = Guid.NewGuid();
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(detailId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule detail not found or inactive");
        }

        [Fact]
        public async Task DeleteRuleDetailAsync_DetailDeleted_ShouldReturnInvalidInput()
        {
            // Arrange
            var detail = new RefundRuleDetail { Id = Guid.NewGuid(), DeletedAt = DateTime.UtcNow };
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(detail.Id);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule detail not found or inactive");
        }

        [Fact]
        public async Task DeleteRuleDetailAsync_ValidDetail_ShouldSucceed()
        {
            // Arrange
            var detail = new RefundRuleDetail { Id = Guid.NewGuid() };
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.Query(false))
                .Returns(new List<RefundRuleDetail> { detail }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.DeleteAsync(detail));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _ruleService.DeleteRuleDetailAsync(detail.Id);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.DeleteAsync(detail), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }
        #endregion

        #region Create Rule Detail
        [Fact]
        public async Task CreateRuleDetailAsync_EmptyRuleId_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.Empty;
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 1, MaxDaysBeforeEvent = 2, RefundPercent = 50 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Invalid input");
        }

        [Fact]
        public async Task CreateRuleDetailAsync_MinDaysGreaterThanMaxDays_ShouldReturnInvalidInput()
        {
            // Arrange
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 5, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(Guid.NewGuid(), request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("MinDays (5) cannot be greater than MaxDays (1)");
        }

        [Fact]
        public async Task CreateRuleDetailAsync_RuleNotFound_ShouldReturnInvalidInput()
        {
            // Arrange
            var ruleId = Guid.NewGuid();
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(ruleId, true))
                .ReturnsAsync((RefundRule)null!);

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(ruleId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Be("Rule not found");
        }

        [Fact]
        public async Task CreateRuleDetailAsync_ValidRequest_ShouldSucceed()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());
            
            _mockUnitOfWork.Setup(x => x.RefundRuleRepository.GetByIdAsync(rule.Id, true))
                .ReturnsAsync(rule);
            _mockUnitOfWork.Setup(x => x.RefundRuleDetailRepository.AddAsync(It.IsAny<RefundRuleDetail>()));

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RefundRuleDetailRepository.AddAsync(It.Is<RefundRuleDetail>(
                d => d.RefundRuleId == rule.Id && 
                     d.MinDaysBeforeEvent == 0 && 
                     d.MaxDaysBeforeEvent == 1 && 
                     d.RefundPercent == 50)), Times.Once);
        }

        [Fact]
        public async Task CreateRuleDetailAsync_InvalidRefundPercent_ShouldReturnValidationFailure()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = 150 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Refund percent value from 0 to 100");
        }

        [Fact]
        public async Task CreateRuleDetailAsync_NullRefundPercent_ShouldReturnValidationFailure()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = 1, RefundPercent = null };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Refund percent is required");
        }

        [Fact]
        public async Task CreateRuleDetailAsync_NullMinDays_ShouldReturnValidationFailure()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = null, MaxDaysBeforeEvent = 1, RefundPercent = 50 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Min days before event is required");
        }

        [Fact]
        public async Task CreateRuleDetailAsync_NullMaxDays_ShouldReturnValidationFailure()
        {
            // Arrange
            var rule = new RefundRule { Id = Guid.NewGuid(), RuleName = "ruleDemo" };
            var request = new RuleRefundDetailRequest { MinDaysBeforeEvent = 0, MaxDaysBeforeEvent = null, RefundPercent = 50 };
            
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(f => f());

            // Act
            var result = await _ruleService.CreateRuleDetailAsync(rule.Id, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().Contain("Max days before event is required");
        }
        #endregion
    }
}