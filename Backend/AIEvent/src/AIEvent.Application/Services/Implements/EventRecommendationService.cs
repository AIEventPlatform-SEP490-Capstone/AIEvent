using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class EventRecommendationService : IEventRecommendationService
    {
        private readonly IVoyageEmbeddingService _voyageEmbeddingService;
        private readonly IPineconeVectorService _pineconeService;
        private readonly IOpenRouterLLMService _llmService;
        private readonly IUnitOfWork _unitOfWork;

        public EventRecommendationService(
            IVoyageEmbeddingService voyageEmbeddingService,
            IPineconeVectorService pineconeService,
            IOpenRouterLLMService llmService,
            IUnitOfWork unitOfWork)
        {
            _voyageEmbeddingService = voyageEmbeddingService;
            _pineconeService = pineconeService;
            _llmService = llmService;
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<string>> RecommendEventsAsync(string userPrompt, Guid? userId = null, Guid? sessionId = null, int topK = 5)
        {
            if (string.IsNullOrWhiteSpace(userPrompt))
                throw new ArgumentException("Prompt không được để trống.");
             
            List<(string prompt, string response)>? chatHistory = null;
             
            if (sessionId.HasValue && userId.HasValue)
            {
                try
                {
                    var recentChats = await _unitOfWork.ChatLogRepository.FindPagedAsync(
                        c => c.UserId == userId.Value && c.Session == sessionId.Value,
                        0,
                        5,
                        c => c.CreatedAt,
                        sortDescending: true);

                    if (recentChats.Any())
                    { 
                        var chatList = recentChats.ToList();
                        chatList.Reverse();
                        chatHistory = chatList
                            .Select(c => (c.Prompt, c.Response))
                            .ToList();
                    }
                }
                catch
                { 
                    chatHistory = null;
                }
            }
             
            var queryEmbedding = await _voyageEmbeddingService.GetEmbeddingAsync(userPrompt);
             
            var results = await _pineconeService.QuerySimilarAsync(queryEmbedding, isUser: false, topK);

            if (results == null || !results.Any())
                return "Xin lỗi, hiện tại tôi chưa tìm thấy sự kiện nào phù hợp với yêu cầu của bạn.";

            var contexts = results.Select(r =>
            {
                var meta = r.Metadata ?? new Dictionary<string, object>();
                meta.TryGetValue("EventId", out var eventId);
                meta.TryGetValue("Title", out var title);
                meta.TryGetValue("Description", out var description);
                meta.TryGetValue("CategoryName", out var category);
                meta.TryGetValue("Tags", out var tags);
                meta.TryGetValue("LocationName", out var location);
                meta.TryGetValue("District", out var district);
                meta.TryGetValue("Address", out var address);
                meta.TryGetValue("StartTime", out var start);
                meta.TryGetValue("EndTime", out var end);
                meta.TryGetValue("Tickets", out var tickets);
                var eventUrl = eventId != null ? $"http://localhost:5173/event/{eventId}" : "#";
                return $@"
                    - {title ?? "Sự kiện"} ({category ?? "Không rõ danh mục"})
                      Địa điểm: {(location ?? address ?? "Không rõ")} - {district ?? ""}
                      Thời gian: {start ?? ""} → {end ?? ""}
                      Mô tả: {description ?? "Không có mô tả"}
                      Thẻ: {tags ?? "Không có"}
                      Vé: {tickets ?? "Không có thông tin vé"}
                      Xem chi tiết: {eventUrl}
                    ";
            }).ToList();
             
            ChatLog? chatLog = null;
            if (userId.HasValue)
            { 
                Guid finalSessionId;
                string sessionName;

                if (sessionId.HasValue)
                { 
                    finalSessionId = sessionId.Value;
                     
                    try
                    {
                        var existingSession = await _unitOfWork.ChatLogRepository.FindAsync(
                            c => c.UserId == userId.Value && c.Session == sessionId.Value);
                        var existingChat = existingSession.FirstOrDefault();
                        sessionName = existingChat?.SessionName ?? (userPrompt.Length > 50 ? userPrompt.Substring(0, 50) + "..." : userPrompt);
                    }
                    catch
                    { 
                        sessionName = userPrompt.Length > 50 ? userPrompt.Substring(0, 50) + "..." : userPrompt;
                    }
                }
                else
                { 
                    finalSessionId = Guid.NewGuid();
                     
                    try
                    {
                        sessionName = await _llmService.GenerateSessionNameAsync(userPrompt);
                        if (string.IsNullOrWhiteSpace(sessionName))
                        {
                            sessionName = userPrompt.Length > 50 ? userPrompt.Substring(0, 50) + "..." : userPrompt;
                        }
                    }
                    catch 
                    {  
                        sessionName = userPrompt.Length > 50 ? userPrompt.Substring(0, 50) + "..." : userPrompt;
                    }
                }

                try
                { 
                    chatLog = new ChatLog
                    {
                        UserId = userId.Value,
                        Prompt = userPrompt,
                        Response = "",  
                        Session = finalSessionId,
                        SessionName = sessionName,
                        CreatedAt = DateTime.UtcNow
                    };
                    chatLog = await _unitOfWork.ChatLogRepository.AddAsync(chatLog);
                }
                catch (Exception ex)
                { 
                    Console.WriteLine($"Error saving chat log (prompt): {ex.Message}");
                }
            }

            var response = await _llmService.GenerateRAGResponseAsync(userPrompt, contexts, chatHistory);
            
            if (string.IsNullOrWhiteSpace(response))
                response = "Xin lỗi, tôi không thể tạo phản hồi lúc này. Vui lòng thử lại sau.";
 
            if (chatLog != null && !string.IsNullOrEmpty(chatLog.Id))
            {
                try
                {
                    chatLog.Response = response;
                    await _unitOfWork.ChatLogRepository.UpdateAsync(chatLog);
                }
                catch (Exception ex)
                { 
                    Console.WriteLine($"Error updating chat log (response): {ex.Message}");
                }
            }

            return response;
        }

        public async Task<Result<BasePaginated<EventsResponse>>> GetEventAIRecommendAsync(int pageNumber, int pageSize, Guid userId)
        {
            var user = await _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .Where(u => u.Id == userId && !u.IsDeleted && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Address,
                    u.District,
                    u.BudgetOption,
                    u.InterestedDistrictsJson,
                    u.UserInterestsJson,
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);
            }

            var userDescription = new List<string>();

            if (!string.IsNullOrEmpty(user.Address))
                userDescription.Add($"Address: {user.Address}");

            if (!string.IsNullOrEmpty(user.District))
                userDescription.Add($"District: {user.District}");

            if (!string.IsNullOrEmpty(user.UserInterestsJson))
                userDescription.Add($"Interests: {user.UserInterestsJson}");

            if (!string.IsNullOrEmpty(user.InterestedDistrictsJson))
                userDescription.Add($"InterestedDistricts: {user.InterestedDistrictsJson}");

            userDescription.Add($"Budget: {user.BudgetOption}");

            var descriptionText = string.Join(", ", userDescription);

            var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(descriptionText);

            var aiResults = await _pineconeService.QuerySimilarAsync(embedding, isUser: false, topK: 10);

            var eventIds = aiResults
                .Select(r => Guid.TryParse(r.Id, out var guid) ? guid : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();

            var events = _unitOfWork.EventRepository
                .Query()
                .Where(e => eventIds.Contains(e.Id) && e.IsDeleted == false && e.Publish == true && e.Status == EventStatus.Approved)
                .AsQueryable();

            int totalCount = await events.CountAsync();

            var result = await events
                .OrderByDescending(e => e.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsResponse
                {
                    EventId = e.Id,
                    EventCategoryName = e.EventCategory.CategoryName,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    Description = e.Description,
                    TicketPricingType = e.TicketPricingType,
                    TotalTickets = e.TotalTickets,
                    SoldQuantity = e.SoldQuantity,
                    LocationName = e.LocationName,
                    Publish = e.Publish,
                    AverageRating = e.AverageRating,
                    TotalRatings = e.TotalRatings,
                    Status = e.Status,
                    Tags = e.EventTags.Select(t => new TagResponse
                    {
                        TagId = t.TagId.ToString(),
                        TagName = t.Tag.NameTag
                    }).ToList(),
                    TicketPrice = e.TicketTypes != null
                        ? e.TicketTypes.Min(t => t.TicketPrice)
                        : 0,
                    IsFavorite = userId != Guid.Empty && e.FavoriteEvents.Any(fe => fe.UserId == userId),
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<EventsResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<ChatLogResponse>>> GetChatHistoryAsync(Guid userId, Guid? sessionId = null, int pageNumber = 1, int pageSize = 10)
        {
            if (!sessionId.HasValue)
            {
                return new BasePaginated<ChatLogResponse>(new List<ChatLogResponse>(), 0, pageNumber, pageSize);
            }

            long totalCount = await _unitOfWork.ChatLogRepository.CountAsync(
                c => c.UserId == userId && c.Session == sessionId.Value);
            
            var chatLogs = await _unitOfWork.ChatLogRepository.FindPagedAsync(
                c => c.UserId == userId && c.Session == sessionId.Value,
                (pageNumber - 1) * pageSize,
                pageSize,
                c => c.CreatedAt,
                sortDescending: true);

            var result = chatLogs.Select(c => new ChatLogResponse
            {
                Id = c.Id,
                Prompt = c.Prompt,
                Response = c.Response,
                Session = c.Session,
                SessionName = c.SessionName,
                CreatedAt = c.CreatedAt
            }).ToList();

            return new BasePaginated<ChatLogResponse>(result, (int)totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<SessionResponse>>> GetSessionsAsync(Guid userId, int pageNumber = 1, int pageSize = 10)
        { 
            var allChatLogs = await _unitOfWork.ChatLogRepository.FindAsync(c => c.UserId == userId);
             
            var groupedSessions = allChatLogs
                .GroupBy(c => new { c.Session, c.SessionName })
                .Select(g => new SessionResponse
                {
                    SessionId = g.Key.Session,
                    SessionName = g.Key.SessionName,
                    CreatedAt = g.Min(c => c.CreatedAt),
                    LastMessageAt = g.Max(c => c.CreatedAt),
                    MessageCount = g.Count()
                })
                .OrderByDescending(s => s.LastMessageAt)
                .ToList();

            int totalCount = groupedSessions.Count;
            var result = groupedSessions
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new BasePaginated<SessionResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> DeleteSessionAsync(Guid userId, Guid sessionId)
        { 
            var chatLogs = await _unitOfWork.ChatLogRepository.FindAsync(
                c => c.UserId == userId && c.Session == sessionId);

            if (!chatLogs.Any())
                return ErrorResponse.FailureResult("Session not found", ErrorCodes.NotFound);
 
            var deletedCount = await _unitOfWork.ChatLogRepository.DeleteManyAsync(
                c => c.UserId == userId && c.Session == sessionId);

            if (deletedCount == 0)
                return ErrorResponse.FailureResult("Failed to delete session", ErrorCodes.InternalServerError);

            return Result.Success();
        }


    }
}
