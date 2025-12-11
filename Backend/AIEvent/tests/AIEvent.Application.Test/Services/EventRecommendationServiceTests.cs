using AIEvent.Application.Constants;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
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
    }
}

