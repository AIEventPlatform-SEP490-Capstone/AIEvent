using AIEvent.Application.Constants;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using MockQueryable.EntityFrameworkCore;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class EventRecommendationServiceTests
    {
        // Test constants
        private static readonly Guid TestUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid TestSessionId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid TestSessionId2 = Guid.Parse("33333333-3333-3333-3333-333333333333");

        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IVoyageEmbeddingService> _mockVoyageEmbeddingService;
        private readonly Mock<IPineconeVectorService> _mockPineconeService;
        private readonly Mock<IOpenRouterLLMService> _mockLlmService;
        private readonly Mock<IMongoRepository<ChatLog>> _mockChatLogRepository;
        private readonly IEventRecommendationService _eventRecommendationService;

        public EventRecommendationServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockVoyageEmbeddingService = new Mock<IVoyageEmbeddingService>();
            _mockPineconeService = new Mock<IPineconeVectorService>();
            _mockLlmService = new Mock<IOpenRouterLLMService>();
            _mockChatLogRepository = new Mock<IMongoRepository<ChatLog>>();

            _mockUnitOfWork.Setup(x => x.ChatLogRepository).Returns(_mockChatLogRepository.Object);

            _eventRecommendationService = new EventRecommendationService(
                _mockVoyageEmbeddingService.Object,
                _mockPineconeService.Object,
                _mockLlmService.Object,
                _mockUnitOfWork.Object);
        }

        #region DeleteSessionAsync Tests

        // UTCID01: Valid request with existing session - Success
        [Fact]
        public async Task UTCID01_DeleteSessionAsync_WithExistingSession_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (userId and sessionId exist, session has chat logs)
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = sessionId,
                    Prompt = "Test prompt",
                    Response = "Test response",
                    SessionName = "Test Session",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);
            _mockChatLogRepository.Setup(x => x.DeleteManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(1);

            // Act
            var result = await _eventRecommendationService.DeleteSessionAsync(userId, sessionId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockChatLogRepository.Verify(x => x.DeleteManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()), Times.Once);
        }

        // UTCID02: Session not found - Failure
        [Fact]
        public async Task UTCID02_DeleteSessionAsync_WithNonExistentSession_ShouldReturnFailure()
        {
            // Arrange - EP: Valid input but session doesn't exist
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var chatLogs = new List<ChatLog>();

            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.DeleteSessionAsync(userId, sessionId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Session not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockChatLogRepository.Verify(x => x.DeleteManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()), Times.Never);
        }

        // UTCID03: DeleteManyAsync returns 0 - Failure
        [Fact]
        public async Task UTCID03_DeleteSessionAsync_WhenDeleteFails_ShouldReturnFailure()
        {
            // Arrange - EP: Valid input but delete operation fails
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = sessionId,
                    Prompt = "Test prompt",
                    Response = "Test response",
                    SessionName = "Test Session",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);
            _mockChatLogRepository.Setup(x => x.DeleteManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(0);

            // Act
            var result = await _eventRecommendationService.DeleteSessionAsync(userId, sessionId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Failed to delete session");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
        }

        #endregion

        #region GetSessionsAsync Tests

        // UTCID01: Valid request with default parameters - Success
        [Fact]
        public async Task UTCID01_GetSessionsAsync_WithDefaultParameters_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (default pagination)
            var userId = TestUserId;
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = TestSessionId,
                    SessionName = "Session 1",
                    Prompt = "Prompt 1",
                    Response = "Response 1",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new ChatLog
                {
                    Id = "chat2",
                    UserId = userId,
                    Session = TestSessionId,
                    SessionName = "Session 1",
                    Prompt = "Prompt 2",
                    Response = "Response 2",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new ChatLog
                {
                    Id = "chat3",
                    UserId = userId,
                    Session = TestSessionId2,
                    SessionName = "Session 2",
                    Prompt = "Prompt 3",
                    Response = "Response 3",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.GetSessionsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.Items.First().SessionId.Should().Be(TestSessionId2); // Most recent first
            result.Value!.Items.First().MessageCount.Should().Be(1);
            result.Value!.Items.Last().MessageCount.Should().Be(2);
        }

        // UTCID02: Valid request with pagination - Success
        [Fact]
        public async Task UTCID02_GetSessionsAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pagination)
            var userId = TestUserId;
            var pageNumber = 1;
            var pageSize = 1;
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = TestSessionId,
                    SessionName = "Session 1",
                    Prompt = "Prompt 1",
                    Response = "Response 1",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new ChatLog
                {
                    Id = "chat2",
                    UserId = userId,
                    Session = TestSessionId2,
                    SessionName = "Session 2",
                    Prompt = "Prompt 2",
                    Response = "Response 2",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.GetSessionsAsync(userId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(pageNumber);
            result.Value!.PageSize.Should().Be(pageSize);
        }

        // UTCID03: No sessions found - Success (empty list)
        [Fact]
        public async Task UTCID03_GetSessionsAsync_WithNoSessions_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but no sessions exist
            var userId = TestUserId;
            var chatLogs = new List<ChatLog>();

            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.GetSessionsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
        }

        #endregion

        #region GetChatHistoryAsync Tests

        // UTCID01: Valid request with sessionId - Success
        [Fact]
        public async Task UTCID01_GetChatHistoryAsync_WithSessionId_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (sessionId provided)
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = sessionId,
                    SessionName = "Test Session",
                    Prompt = "Prompt 1",
                    Response = "Response 1",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new ChatLog
                {
                    Id = "chat2",
                    UserId = userId,
                    Session = sessionId,
                    SessionName = "Test Session",
                    Prompt = "Prompt 2",
                    Response = "Response 2",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockChatLogRepository.Setup(x => x.CountAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(2);
            _mockChatLogRepository.Setup(x => x.FindPagedAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, object>>>(),
                It.IsAny<bool>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.GetChatHistoryAsync(userId, sessionId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
        }

        // UTCID02: Valid request without sessionId - Success (empty list)
        [Fact]
        public async Task UTCID02_GetChatHistoryAsync_WithoutSessionId_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but sessionId is null
            var userId = TestUserId;

            // Act
            var result = await _eventRecommendationService.GetChatHistoryAsync(userId, null);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
            _mockChatLogRepository.Verify(x => x.CountAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()), Times.Never);
        }

        // UTCID03: Valid request with pagination - Success
        [Fact]
        public async Task UTCID03_GetChatHistoryAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pagination)
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var pageNumber = 1;
            var pageSize = 1;
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = sessionId,
                    SessionName = "Test Session",
                    Prompt = "Prompt 1",
                    Response = "Response 1",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockChatLogRepository.Setup(x => x.CountAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(2);
            _mockChatLogRepository.Setup(x => x.FindPagedAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, object>>>(),
                It.IsAny<bool>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.GetChatHistoryAsync(userId, sessionId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(pageNumber);
            result.Value!.PageSize.Should().Be(pageSize);
        }

        // UTCID04: No chat history found - Success (empty list)
        [Fact]
        public async Task UTCID04_GetChatHistoryAsync_WithNoHistory_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but no chat history exists
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var chatLogs = new List<ChatLog>();

            _mockChatLogRepository.Setup(x => x.CountAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(0);
            _mockChatLogRepository.Setup(x => x.FindPagedAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, object>>>(),
                It.IsAny<bool>()))
                .ReturnsAsync(chatLogs);

            // Act
            var result = await _eventRecommendationService.GetChatHistoryAsync(userId, sessionId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
        }

        #endregion

        #region RecommendEventsAsync Tests

        // UTCID01: Valid request with userPrompt - Success
        [Fact]
        public async Task UTCID01_RecommendEventsAsync_WithValidPrompt_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (userPrompt provided)
            var userPrompt = "Tìm sự kiện âm nhạc ở Hà Nội";
            var embedding = new float[] { 0.1f, 0.2f, 0.3f };
            var pineconeResults = new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
            {
                (Guid.NewGuid().ToString(), 0.9, new Dictionary<string, object>
                {
                    { "EventId", Guid.NewGuid().ToString() },
                    { "Title", "Music Event" },
                    { "Description", "A great music event" },
                    { "CategoryName", "Music" },
                    { "LocationName", "Hà Nội" }
                })
            };
            var llmResponse = "Tôi tìm thấy một sự kiện âm nhạc phù hợp với bạn...";

            _mockVoyageEmbeddingService.Setup(x => x.GetEmbeddingAsync(userPrompt))
                .ReturnsAsync(embedding);
            _mockPineconeService.Setup(x => x.QuerySimilarAsync(embedding, false, 5))
                .ReturnsAsync(pineconeResults);
            _mockLlmService.Setup(x => x.GenerateRAGResponseAsync(
                userPrompt,
                It.IsAny<List<string>>(),
                It.IsAny<List<(string, string)>?>()))
                .ReturnsAsync(llmResponse);

            // Act
            var result = await _eventRecommendationService.RecommendEventsAsync(userPrompt);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().Be(llmResponse);
            _mockVoyageEmbeddingService.Verify(x => x.GetEmbeddingAsync(userPrompt), Times.Once);
            _mockPineconeService.Verify(x => x.QuerySimilarAsync(embedding, false, 5), Times.Once);
        }

        // UTCID02: Empty userPrompt - Should throw ArgumentException
        [Fact]
        public async Task UTCID02_RecommendEventsAsync_WithEmptyPrompt_ShouldThrowArgumentException()
        {
            // Arrange - BV: Empty prompt
            var userPrompt = "";

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _eventRecommendationService.RecommendEventsAsync(userPrompt));
        }

        // UTCID03: Null userPrompt - Should throw ArgumentException
        [Fact]
        public async Task UTCID03_RecommendEventsAsync_WithNullPrompt_ShouldThrowArgumentException()
        {
            // Arrange - BV: Null prompt
            string? userPrompt = null;

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _eventRecommendationService.RecommendEventsAsync(userPrompt!));
        }

        // UTCID04: No events found - Should return default message
        [Fact]
        public async Task UTCID04_RecommendEventsAsync_WithNoEventsFound_ShouldReturnDefaultMessage()
        {
            // Arrange - EP: Valid input but no events found
            var userPrompt = "Tìm sự kiện âm nhạc ở Hà Nội";
            var embedding = new float[] { 0.1f, 0.2f, 0.3f };
            List<(string Id, double Score, Dictionary<string, object>? Metadata)>? pineconeResults = null;

            _mockVoyageEmbeddingService.Setup(x => x.GetEmbeddingAsync(userPrompt))
                .ReturnsAsync(embedding);
            _mockPineconeService.Setup(x => x.QuerySimilarAsync(embedding, false, 5))
                .ReturnsAsync(pineconeResults);

            // Act
            var result = await _eventRecommendationService.RecommendEventsAsync(userPrompt);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().Contain("Xin lỗi, hiện tại tôi chưa tìm thấy sự kiện nào phù hợp");
        }

        // UTCID05: Valid request with userId and sessionId - Success
        [Fact]
        public async Task UTCID05_RecommendEventsAsync_WithUserIdAndSessionId_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (userId and sessionId provided)
            var userPrompt = "Tìm sự kiện";
            var userId = TestUserId;
            var sessionId = TestSessionId;
            var embedding = new float[] { 0.1f, 0.2f, 0.3f };
            var pineconeResults = new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
            {
                (Guid.NewGuid().ToString(), 0.9, new Dictionary<string, object>
                {
                    { "EventId", Guid.NewGuid().ToString() },
                    { "Title", "Test Event" }
                })
            };
            var llmResponse = "Test response";
            var chatLogs = new List<ChatLog>
            {
                new ChatLog
                {
                    Id = "chat1",
                    UserId = userId,
                    Session = sessionId,
                    Prompt = "Previous prompt",
                    Response = "Previous response",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _mockVoyageEmbeddingService.Setup(x => x.GetEmbeddingAsync(userPrompt))
                .ReturnsAsync(embedding);
            _mockPineconeService.Setup(x => x.QuerySimilarAsync(embedding, false, 5))
                .ReturnsAsync(pineconeResults);
            _mockChatLogRepository.Setup(x => x.FindPagedAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, object>>>(),
                It.IsAny<bool>()))
                .ReturnsAsync(chatLogs);
            _mockChatLogRepository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ChatLog, bool>>>()))
                .ReturnsAsync(chatLogs);
            _mockChatLogRepository.Setup(x => x.AddAsync(It.IsAny<ChatLog>()))
                .ReturnsAsync((ChatLog c) => c);
            _mockChatLogRepository.Setup(x => x.UpdateAsync(It.IsAny<ChatLog>()))
                .ReturnsAsync((ChatLog c) => c);
            _mockLlmService.Setup(x => x.GenerateRAGResponseAsync(
                userPrompt,
                It.IsAny<List<string>>(),
                It.IsAny<List<(string, string)>?>()))
                .ReturnsAsync(llmResponse);

            // Act
            var result = await _eventRecommendationService.RecommendEventsAsync(userPrompt, userId, sessionId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().Be(llmResponse);
            _mockChatLogRepository.Verify(x => x.AddAsync(It.IsAny<ChatLog>()), Times.Once);
            _mockChatLogRepository.Verify(x => x.UpdateAsync(It.IsAny<ChatLog>()), Times.Once);
        }

        // UTCID06: LLM returns empty response - Should return default message
        [Fact]
        public async Task UTCID06_RecommendEventsAsync_WhenLlmReturnsEmpty_ShouldReturnDefaultMessage()
        {
            // Arrange - EP: Valid input but LLM returns empty response
            var userPrompt = "Tìm sự kiện";
            var embedding = new float[] { 0.1f, 0.2f, 0.3f };
            var pineconeResults = new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
            {
                (Guid.NewGuid().ToString(), 0.9, new Dictionary<string, object>())
            };
            var llmResponse = "";

            _mockVoyageEmbeddingService.Setup(x => x.GetEmbeddingAsync(userPrompt))
                .ReturnsAsync(embedding);
            _mockPineconeService.Setup(x => x.QuerySimilarAsync(embedding, false, 5))
                .ReturnsAsync(pineconeResults);
            _mockLlmService.Setup(x => x.GenerateRAGResponseAsync(
                userPrompt,
                It.IsAny<List<string>>(),
                It.IsAny<List<(string, string)>?>()))
                .ReturnsAsync(llmResponse);

            // Act
            var result = await _eventRecommendationService.RecommendEventsAsync(userPrompt);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().Contain("Xin lỗi, tôi không thể tạo phản hồi lúc này");
        }

        // UTCID08: Valid request with new session (no sessionId) - Success
        [Fact]
        public async Task UTCID08_RecommendEventsAsync_WithNewSession_ShouldCreateNewSession()
        {
            // Arrange - EP: Valid input (userId provided but no sessionId)
            var userPrompt = "Tìm sự kiện";
            var userId = TestUserId;
            var embedding = new float[] { 0.1f, 0.2f, 0.3f };
            var pineconeResults = new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
            {
                (Guid.NewGuid().ToString(), 0.9, new Dictionary<string, object>())
            };
            var llmResponse = "Test response";
            var sessionName = "New Session";

            _mockVoyageEmbeddingService.Setup(x => x.GetEmbeddingAsync(userPrompt))
                .ReturnsAsync(embedding);
            _mockPineconeService.Setup(x => x.QuerySimilarAsync(embedding, false, 5))
                .ReturnsAsync(pineconeResults);
            _mockLlmService.Setup(x => x.GenerateSessionNameAsync(userPrompt))
                .ReturnsAsync(sessionName);
            _mockLlmService.Setup(x => x.GenerateRAGResponseAsync(
                userPrompt,
                It.IsAny<List<string>>(),
                It.IsAny<List<(string, string)>?>()))
                .ReturnsAsync(llmResponse);
            _mockChatLogRepository.Setup(x => x.AddAsync(It.IsAny<ChatLog>()))
                .ReturnsAsync((ChatLog c) => c);
            _mockChatLogRepository.Setup(x => x.UpdateAsync(It.IsAny<ChatLog>()))
                .ReturnsAsync((ChatLog c) => c);

            // Act
            var result = await _eventRecommendationService.RecommendEventsAsync(userPrompt, userId, null);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockLlmService.Verify(x => x.GenerateSessionNameAsync(userPrompt), Times.Once);
            _mockChatLogRepository.Verify(x => x.AddAsync(It.IsAny<ChatLog>()), Times.Once);
        }

        #endregion

        #region GetEventAIRecommendAsync Tesst
        [Fact]
        public async Task UTCID01_GetEventAIRecommend_UserNotFound_ShouldReturnError()
        {
            // Arrange
            var nonExistentUserId = TestUserId;

            var emptyUserList = new List<User>().AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(emptyUserList);

            // Act
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(
                pageNumber: 1,
                pageSize: 10,
                userId: nonExistentUserId
            );

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("User not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _mockUnitOfWork.Verify(u => u.UserRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID02_GetEventAIRecommend_PineconeValidId_ShouldIncludeEventId()
        {
            // Arrange
            var user = new User
            {
                Id = TestUserId,
                IsActive = true,
                IsDeleted = false,
                Address = "Hanoi",
                District = "Ba Dinh",
                UserInterestsJson = "[\"Music\"]",
                InterestedDistrictsJson = "[\"Cau Giay\"]",
                BudgetOption = BudgetOption.Flexible,
            };
            var userList = new List<User> { user }.AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            _mockVoyageEmbeddingService
                .Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });


            var validGuid = Guid.NewGuid().ToString();
            _mockPineconeService
                .Setup(p => p.QuerySimilarAsync(It.IsAny<float[]>(), false, 6))
                .ReturnsAsync(new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
                {
                    (validGuid, 0.9, null)
                });

            var eventEntity = new Event
            {
                Id = Guid.Parse(validGuid),
                Title = "Event 1",
                Description = "Desc",
                EventCategory = new EventCategory { CategoryName = "Cat" },
                LocationName = "Loc",
                Status = EventStatus.Approved,
                Publish = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                TicketTypes = new List<TicketType> // Thêm phần này
                {
                    new TicketType 
                    { 
                        TicketPrice = 100 ,
                        TicketName = "test",
                        TicketQuantity = 1 ,
                    }
                },
                FavoriteEvents = new List<FavoriteEvent>() 
            };
            var eventList = new List<Event> { eventEntity }.AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false))
                .Returns(eventList);

            _mockLlmService.Setup(l => l.GenerateShortReasonAsync(It.IsAny<string>()))
                .ReturnsAsync("Reason");

            // Act
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(1, 10, TestUserId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Single(result.Value!.Items);
            Assert.Equal(eventEntity.Id, result.Value!.Items.First().EventId);
            Assert.Equal("Reason", result.Value!.Items.First().Reason);
        }


        [Fact]
        public async Task UTCID03_GetEventAIRecommend_EventValid_ShouldBeIncluded()
        {
            // Arrange
            var userList = new List<User>
            {
                new User
                {
                    Id = TestUserId,
                    IsActive = true,
                    IsDeleted = false,
                    BudgetOption = BudgetOption.Flexible
                }
            }.AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            _mockVoyageEmbeddingService.Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });

            var validGuid = Guid.NewGuid().ToString();
            _mockPineconeService.Setup(p => p.QuerySimilarAsync(It.IsAny<float[]>(), false, 6))
                .ReturnsAsync(new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
                {
            (validGuid, 0.9, null)
                });

            // Event hợp lệ
            var eventEntity = new Event
            {
                Id = Guid.Parse(validGuid),
                Description = "Desc",
                CreatedAt = DateTime.UtcNow,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                Title = "Event Valid",
                EventCategory = new EventCategory { CategoryName = "Cat" },
                Status = EventStatus.Approved,
                Publish = true,
                IsDeleted = false,
                TicketTypes = new List<TicketType> 
                {
                    new TicketType
                    {
                        TicketPrice = 100 ,
                        TicketName = "test",
                        TicketQuantity = 1 ,
                    }
                },
                FavoriteEvents = new List<FavoriteEvent>()
            };
            var eventList = new List<Event> { eventEntity }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false)).Returns(eventList);

            _mockLlmService.Setup(l => l.GenerateShortReasonAsync(It.IsAny<string>()))
                .ReturnsAsync("Reason");

            // Act
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(1, 10, TestUserId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Single(result.Value!.Items);
            Assert.Equal(eventEntity.Id, result.Value!.Items.First().EventId);
        }


        [Fact]
        public async Task UTCID04_GetEventAIRecommend_EventInvalid_ShouldBeExcluded()
        {
            // Arrange
            var userList = new List<User>
            {
                new User { Id = TestUserId, IsActive = true, IsDeleted = false, BudgetOption = BudgetOption.Flexible }
            }.AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false)).Returns(userList);
            _mockVoyageEmbeddingService.Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });

            var validGuid = Guid.NewGuid().ToString();
            _mockPineconeService.Setup(p => p.QuerySimilarAsync(It.IsAny<float[]>(), false, 6))
                .ReturnsAsync(new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
                {
            (validGuid, 0.9, null)
                });

            var eventEntity = new Event
            {
                Id = Guid.Parse(validGuid),
                Title = "Event Invalid",
                Description = "Desc",
                CreatedAt = DateTime.UtcNow,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                EventCategory = new EventCategory { CategoryName = "Cat" },
                Status = EventStatus.PendingApproval,
                Publish = false,
                IsDeleted = true,
                TicketTypes = new List<TicketType>
                {
                    new TicketType { TicketPrice = 50, TicketName = "test", TicketQuantity = 1 }
                },
                FavoriteEvents = new List<FavoriteEvent>()
            };
            var eventList = new List<Event> { eventEntity }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false)).Returns(eventList);

            _mockLlmService.Setup(l => l.GenerateShortReasonAsync(It.IsAny<string>()))
                .ReturnsAsync("Reason");

            // Act
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(1, 10, TestUserId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Empty(result.Value!.Items); 
        }


        [Fact]
        public async Task UTCID05_GetEventAIRecommend_EventIdsEmpty_ShouldReturnEmptyList()
        {
            // Arrange
            var userList = new List<User>
            {
                new User { Id = TestUserId, IsActive = true, IsDeleted = false, BudgetOption = BudgetOption.Flexible }
            }.AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false)).Returns(userList);
            _mockVoyageEmbeddingService.Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });

            _mockPineconeService.Setup(p => p.QuerySimilarAsync(It.IsAny<float[]>(), false, 6))
                .ReturnsAsync(new List<(string Id, double Score, Dictionary<string, object>? Metadata)>());

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Event",
                Description = "Desc",
                CreatedAt = DateTime.UtcNow,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                EventCategory = new EventCategory { CategoryName = "Cat" },
                Status = EventStatus.Approved,
                Publish = true,
                IsDeleted = false,
                TicketTypes = new List<TicketType> { new TicketType { TicketPrice = 50, TicketName = "test", TicketQuantity = 1 } },
                FavoriteEvents = new List<FavoriteEvent>()
            };
            var eventList = new List<Event> { eventEntity }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.EventRepository.Query(false)).Returns(eventList);

            _mockLlmService.Setup(l => l.GenerateShortReasonAsync(It.IsAny<string>()))
                .ReturnsAsync("Reason");

            // Act
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(1, 10, TestUserId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Empty(result.Value!.Items);
        }
        #endregion

        #region
        [Fact]
        public async Task UTCID01_GetFriendsByEvent_UserNotFound_ShouldReturnError()
        {
            // Arrange
            var emptyUserList = new List<User>().AsQueryable().BuildMock();

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(emptyUserList);

            var randomUserId = Guid.NewGuid();
            var someEventId = Guid.NewGuid().ToString();

            // Act
            var result = await _eventRecommendationService.GetFriendsByEventAsync(1, 10, randomUserId, someEventId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("User not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);
        }


        [Fact]
        public async Task UTCID02_GetFriendsByEvent_JSONNullOrMalformed_ShouldBuildDescriptionCorrectly()
        {
            // Arrange
            var user = new User
            {
                Id = TestUserId,
                IsActive = true,
                IsDeleted = false,
                District = null,                  // null district
                UserInterestsJson = null,         // null JSON
                InterestedDistrictsJson = "",     // empty JSON
                FavoriteEventTypesJson = "[malformed]", // malformed JSON
                ProfessionalSkillsJson = null,
                LanguagesJson = "",
                Occupation = null,
                JobTitle = null,
                CareerGoal = null,
                Introduction = null
            };

            var userList = new List<User> { user }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            // Mock embedding service trả về vector hợp lệ để luồng tiếp tục
            _mockVoyageEmbeddingService
                .Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });

            // Mock FriendshipRepository trả về rỗng
            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(new List<Friendship>().AsQueryable().BuildMock());

            // Mock BookingRepository trả về rỗng
            _mockUnitOfWork.Setup(u => u.BookingRepository.Query(false))
                .Returns(new List<Booking>().AsQueryable().BuildMock());

            // Act
            var result = await _eventRecommendationService.GetFriendsByEventAsync(1, 10, TestUserId, Guid.NewGuid().ToString());

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Empty(result.Value!.Items);

            // Kiểm tra rằng descriptionText mặc định được dùng khi không có info
            _mockVoyageEmbeddingService.Verify(v => v.GetEmbeddingAsync(
                It.Is<string>(s => s == "A user with flexible preferences.")), Times.Once);
        }


        [Fact]
        public async Task UTCID03_GetFriendsByEvent_EmbeddingNull_ShouldReturnError()
        {
            // Arrange
            var user = new User
            {
                Id = TestUserId,
                IsActive = true,
                IsDeleted = false,
                District = "Ba Dinh",
                UserInterestsJson = "[\"Music\"]",
                InterestedDistrictsJson = "[\"Cau Giay\"]",
                FavoriteEventTypesJson = "[\"Concert\"]",
                ProfessionalSkillsJson = "[\"Singing\"]",
                LanguagesJson = "[\"English\"]",
                Occupation = "Singer",
                JobTitle = "Lead Vocal",
                CareerGoal = "Become famous",
                Introduction = "Hello world!"
            };

            var userList = new List<User> { user }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            _mockVoyageEmbeddingService
                .Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync((float[]?)null);

            var eventId = Guid.NewGuid().ToString();

            // Act
            var result = await _eventRecommendationService.GetFriendsByEventAsync(1, 10, TestUserId, eventId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Embedding failed", result.Error!.Message);
            Assert.Equal(ErrorCodes.InternalServerError, result.Error.StatusCode);
        }


        [Fact]
        public async Task UTCID04_GetFriendsByEvent_InvalidEventId_ShouldReturnError()
        {
            // Arrange
            var user = new User
            {
                Id = TestUserId,
                IsActive = true,
                IsDeleted = false,
                District = "Ba Dinh",
                UserInterestsJson = "[\"Music\"]",
                InterestedDistrictsJson = "[\"Cau Giay\"]",
                FavoriteEventTypesJson = "[\"Concert\"]",
                ProfessionalSkillsJson = "[\"Singing\"]",
                LanguagesJson = "[\"English\"]",
                Occupation = "Singer",
                JobTitle = "Lead Vocal",
                CareerGoal = "Become famous",
                Introduction = "Hello world!"
            };

            var userList = new List<User> { user }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false))
                .Returns(userList);

            _mockVoyageEmbeddingService
                .Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });

            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(new List<Friendship>().AsQueryable().BuildMock());

            _mockUnitOfWork.Setup(u => u.BookingRepository.Query(false))
                .Returns(new List<Booking>().AsQueryable().BuildMock());

            var invalidEventId = "not-a-guid";

            // Act
            var result = await _eventRecommendationService.GetFriendsByEventAsync(1, 10, TestUserId, invalidEventId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal("Invalid ticket ID format", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
        }


        [Fact]
        public async Task UTCID05_GetFriendsByEvent_AllValid_ShouldReturnBasePaginatedWithReason()
        {
            // Arrange
            var user = new User
            {
                Id = TestUserId,
                IsActive = true,
                IsDeleted = false,
                District = "Ba Dinh",
                UserInterestsJson = "[\"Music\"]",
                InterestedDistrictsJson = "[\"Cau Giay\"]",
                FavoriteEventTypesJson = "[\"Concert\"]",
                ProfessionalSkillsJson = "[\"Singing\"]",
                LanguagesJson = "[\"English\"]",
                Occupation = "Singer",
                JobTitle = "Lead Vocal",
                CareerGoal = "Become famous",
                Introduction = "Hello world!"
            };

            var participant1 = Guid.NewGuid();
            var participant2 = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var participantUser1 = new User
            {
                Id = participant1,
                FullName = "Alice",
                District = "Cau Giay",
                UserInterestsJson = "[\"Music\"]",
                IsActive = true,
                IsDeleted = false,
                Role = new Role { Name = "User" }
            };
            var participantUser2 = new User
            {
                Id = participant2,
                FullName = "Bob",
                District = "Ba Dinh",
                UserInterestsJson = "[\"Concert\"]",
                IsActive = true,
                IsDeleted = false,
                Role = new Role { Name = "User" }
            };

            // EF async mock
            var allUsers = new List<User> { user, participantUser1, participantUser2 }
                .AsQueryable()
                .BuildMock()
                .BuildMockDbSet()
                .Object;

            _mockUnitOfWork.Setup(u => u.UserRepository.Query(false)).Returns(allUsers);

            // Mock embedding
            _mockVoyageEmbeddingService.Setup(v => v.GetEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new float[] { 0.1f, 0.2f });

            // No friends yet
            _mockUnitOfWork.Setup(u => u.FriendshipRepository.Query(false))
                .Returns(new List<Friendship>().AsQueryable().BuildMock().BuildMockDbSet().Object);

            // Bookings
            _mockUnitOfWork.Setup(u => u.BookingRepository.Query(false))
                .Returns(new List<Booking>
                {
            new Booking { EventId = eventId, UserId = participant1, Status = BookingStatus.Completed, PaymentStatus = PaymentStatus.Paid },
            new Booking { EventId = eventId, UserId = participant2, Status = BookingStatus.Completed, PaymentStatus = PaymentStatus.Paid }
                }.AsQueryable().BuildMock().BuildMockDbSet().Object);

            _mockPineconeService.Setup(p => p.QuerySimilarFriendInEventAsync(
                It.IsAny<float[]>(),
                true,
                6,
                It.IsAny<List<string>>(),
                It.IsAny<List<string>>()
            )).ReturnsAsync(new List<(string Id, double Score, Dictionary<string, object>? Metadata)>
            {
                (participant1.ToString(), 0.9, null),
                (participant2.ToString(), 0.8, null)
            });

            // Mock LLM
            _mockLlmService.Setup(l => l.GenerateReasonFriendAsync(It.IsAny<string>()))
                .ReturnsAsync("Matched based on interests");

            // Act
            var result = await _eventRecommendationService.GetFriendsByEventAsync(1, 10, TestUserId, eventId.ToString());

            // Assert
            Assert.True(result.IsSuccess, result.Error?.Message);
            Assert.NotNull(result.Value);
            Assert.Equal(2, result.Value!.Items.Count);
            Assert.Contains(result.Value.Items, f => f.FriendName == "Alice" && f.Reason == "Matched based on interests");
            Assert.Contains(result.Value.Items, f => f.FriendName == "Bob" && f.Reason == "Matched based on interests");
        }
        #endregion
    }
}

