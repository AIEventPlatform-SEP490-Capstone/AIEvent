using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Friend;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore; 
using System.Text.Json;

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

            var userEmbePrompt = userPrompt + ". Lấy sự kiện có StartTime trong tương lai";
            var queryEmbedding = await _voyageEmbeddingService.GetEmbeddingAsync(userEmbePrompt);
             
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
                var eventUrl = eventId != null ? $"https://ai-event-alpha.vercel.app/event/{eventId}" : "#";
                return $@"
                    - {title ?? "Sự kiện"} ({category ?? "Không rõ danh mục"})
                      Địa điểm: {(location ?? address ?? "Không rõ")} - {district ?? ""}
                      Thời gian: {start ?? ""} → {end ?? ""}
                      Mô tả: {description ?? "Không có mô tả"}
                      Thẻ: {tags ?? "Không có"}
                      Vé: {tickets ?? "Không có thông tin vé"}
                      Link: {eventUrl}
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
                        Response = "Xin lỗi, tôi không thể tạo phản hồi lúc này. Vui lòng thử lại sau.",  
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

        public async Task<Result<BasePaginated<AiRecommendEventResponse>>> GetEventAIRecommendAsync(int pageNumber, int pageSize, Guid userId)
        {
            var user = await _unitOfWork.UserRepository
                .Query(false)
                .AsNoTracking()
                .Where(u => u.Id == userId && !u.IsDeleted && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Address,
                    u.District,
                    u.BudgetOption,
                    u.InterestedDistrictsJson,
                    u.UserInterestsJson
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(user.Address))
                parts.Add($"address {user.Address}");

            if (!string.IsNullOrWhiteSpace(user.District))
                parts.Add($"district {user.District}");

            if (!string.IsNullOrWhiteSpace(user.UserInterestsJson))
                parts.Add($"interests {user.UserInterestsJson}");

            if (!string.IsNullOrWhiteSpace(user.InterestedDistrictsJson))
                parts.Add($"interested districts {user.InterestedDistrictsJson}");

            parts.Add($"budget {user.BudgetOption}");

            var userDesc = string.Join(", ", parts);

            var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(userDesc);

            var aiResults = await _pineconeService.QuerySimilarAsync(
                embedding, isUser: false, topK: 6);

            var eventIds = aiResults
                .Select(r => Guid.TryParse(r.Id, out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();

            var query = _unitOfWork.EventRepository
                .Query(false)
                .Include(e => e.EventCategory)
                .Where(e => eventIds.Contains(e.Id)
                            && !e.IsDeleted
                            && e.Publish == true
                            && e.Status == EventStatus.Approved);

            var totalCount = await query.CountAsync();

            var events = await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new AiRecommendEventResponse
                {
                    EventId = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    EventCategoryName = e.EventCategory.CategoryName,
                    LocationName = e.LocationName,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
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
                    IsFavorite = e.FavoriteEvents.Any(f => f.UserId == userId),
                    ImgListEvent = string.IsNullOrWhiteSpace(e.ImgListEvent)
                    ? new List<string>()
                    : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            foreach (var ev in events)
            {
                var eventDesc =
                    $"{ev.Title}, {ev.Description}, giá vé {ev.TicketPrice}, " +
                    $"{ev.LocationName}, category {ev.EventCategoryName}";

                var prompt = $"User: {userDesc}. Event: {eventDesc}.";

                ev.Reason = await _llmService.GenerateShortReasonAsync(prompt);
            }

            return new BasePaginated<AiRecommendEventResponse>(events, totalCount, pageNumber, pageSize);
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

        public async Task<Result<BasePaginated<ListSearchFriend>>> GetFriendAIRecommendAsync(int pageNumber, int pageSize, Guid userId)
        {
            var user = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .Where(u => u.Id == userId && !u.IsDeleted && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.District,
                    u.BudgetOption,
                    u.InterestedDistrictsJson,
                    u.UserInterestsJson,
                    u.Occupation,
                    u.ProfessionalSkillsJson,
                    u.JobTitle,
                    u.CareerGoal,
                    u.ParticipationFrequency,
                    u.Experience,
                    u.FavoriteEventTypesJson,
                    u.LanguagesJson,
                    u.Introduction
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            List<string> Parse(string? json)
            {
                if (string.IsNullOrWhiteSpace(json))
                    return new List<string>();

                try
                {
                    return JsonSerializer.Deserialize<List<string>>(json!) ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            }

            var interests = Parse(user.UserInterestsJson);
            var districts = Parse(user.InterestedDistrictsJson);
            var events = Parse(user.FavoriteEventTypesJson);
            var skills = Parse(user.ProfessionalSkillsJson);
            var languages = Parse(user.LanguagesJson);

            var desc = new List<string>(15);

            if (!string.IsNullOrEmpty(user.District)) desc.Add($"Lives in {user.District}");
            if (interests.Any()) desc.Add($"Interests: {string.Join(", ", interests)}");
            if (events.Any()) desc.Add($"Events: {string.Join(", ", events)}");
            if (districts.Any()) desc.Add($"Explore: {string.Join(", ", districts)}");

            desc.Add($"Budget: {user.BudgetOption}");
            desc.Add($"Frequency: {user.ParticipationFrequency}");

            if (!string.IsNullOrEmpty(user.Occupation)) desc.Add($"Works as: {user.Occupation}");
            if (!string.IsNullOrEmpty(user.JobTitle)) desc.Add($"Job: {user.JobTitle}");
            if (!string.IsNullOrEmpty(user.CareerGoal)) desc.Add($"Goal: {user.CareerGoal}");
            if (skills.Any()) desc.Add($"Skills: {string.Join(", ", skills)}");
            if (languages.Any()) desc.Add($"Speaks: {string.Join(", ", languages)}");
            if (!string.IsNullOrEmpty(user.Introduction)) desc.Add($"About: {user.Introduction}");

            var descriptionText = desc.Count > 0
                ? string.Join(". ", desc)
                : "A user with flexible preferences.";

            var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(descriptionText);
            if (embedding == null || embedding.Length == 0)
                return ErrorResponse.FailureResult("Embedding failed", ErrorCodes.InternalServerError);

            var friendIds = await _unitOfWork.FriendshipRepository
                .Query()
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId) && f.Status == FriendshipStatus.Accepted && !f.IsDeleted)
                .Select(f => f.SenderId == userId ? f.ReceiverId.ToString() : f.SenderId.ToString())
                .ToListAsync();

            var pineconeResults = await _pineconeService.QuerySimilarFriendAsync(
                embedding, isUser: true, topK: 11, excludeIds: friendIds);

            var candidates = pineconeResults
                .Where(r => r.Id != userId.ToString())
                .Take(10)
                .ToList();

            if (!candidates.Any())
                return new BasePaginated<ListSearchFriend>([], 0, pageNumber, pageSize);

            var userIds = candidates
                .Select(r => Guid.TryParse(r.Id, out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();

            var idSet = new HashSet<Guid>(userIds);

            var users = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .Include(u => u.Role)
                .Where(u => idSet.Contains(u.Id) && !u.IsDeleted && u.IsActive && u.Role.Name == "User")
                .ToListAsync();

            var ordered = users
                .OrderBy(u => userIds.IndexOf(u.Id))
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new ListSearchFriend
                {
                    Id = u.Id,
                    FriendName = u.FullName!,
                    District = u.District ?? "",
                    Image = u.AvatarImgUrl ?? "",
                    InterestsJson = u.UserInterestsJson ?? "[]"
                })
                .ToList();

            foreach (var f in ordered)
            {
                var otherUser = users.First(u => u.Id == f.Id);

                var fDesc =
                    $"{otherUser.FullName}, " +
                    $"District: {otherUser.District}, " +
                    $"Interests: {otherUser.UserInterestsJson}, " +
                    $"Skills: {otherUser.ProfessionalSkillsJson}, " +
                    $"Job: {otherUser.JobTitle}, " +
                    $"CareerGoal: {otherUser.CareerGoal}, " +
                    $"Intro: {otherUser.Introduction}";

                var prompt = $"User: {descriptionText}. Friend: {fDesc}.";

                f.Reason = await _llmService.GenerateReasonFriendAsync(prompt);
            }

            return new BasePaginated<ListSearchFriend>(
                ordered,
                userIds.Count,
                pageNumber,
                pageSize
            );
        }


        public async Task<Result<BasePaginated<ListSearchFriend>>> GetFriendsByEventAsync(int pageNumber, int pageSize, Guid userId, string id)
        {
            var user = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .Where(u => u.Id == userId && !u.IsDeleted && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.District,
                    u.BudgetOption,
                    u.InterestedDistrictsJson,
                    u.UserInterestsJson,
                    u.Occupation,
                    u.ProfessionalSkillsJson,
                    u.JobTitle,
                    u.CareerGoal,
                    u.ParticipationFrequency,
                    u.Experience,
                    u.FavoriteEventTypesJson,
                    u.LanguagesJson,
                    u.Introduction
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            List<string> Parse(string? json)
            {
                if (string.IsNullOrWhiteSpace(json))
                    return new List<string>();

                try
                {
                    return JsonSerializer.Deserialize<List<string>>(json!) ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            }

            var interests = Parse(user.UserInterestsJson);
            var districts = Parse(user.InterestedDistrictsJson);
            var events = Parse(user.FavoriteEventTypesJson);
            var skills = Parse(user.ProfessionalSkillsJson);
            var languages = Parse(user.LanguagesJson);

            var desc = new List<string>(15);

            if (!string.IsNullOrEmpty(user.District)) desc.Add($"Lives in {user.District}");
            if (interests.Any()) desc.Add($"Interests: {string.Join(", ", interests)}");
            if (events.Any()) desc.Add($"Events: {string.Join(", ", events)}");
            if (districts.Any()) desc.Add($"Explore: {string.Join(", ", districts)}");

            desc.Add($"Budget: {user.BudgetOption}");
            desc.Add($"Frequency: {user.ParticipationFrequency}");

            if (!string.IsNullOrEmpty(user.Occupation)) desc.Add($"Works as: {user.Occupation}");
            if (!string.IsNullOrEmpty(user.JobTitle)) desc.Add($"Job: {user.JobTitle}");
            if (!string.IsNullOrEmpty(user.CareerGoal)) desc.Add($"Goal: {user.CareerGoal}");
            if (skills.Any()) desc.Add($"Skills: {string.Join(", ", skills)}");
            if (languages.Any()) desc.Add($"Speaks: {string.Join(", ", languages)}");
            if (!string.IsNullOrEmpty(user.Introduction)) desc.Add($"About: {user.Introduction}");

            var descriptionText = desc.Count > 0
                ? string.Join(". ", desc)
                : "A user with flexible preferences.";

            var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(descriptionText);
            if (embedding == null || embedding.Length == 0)
                return ErrorResponse.FailureResult("Embedding failed", ErrorCodes.InternalServerError);

            var friendIds = await _unitOfWork.FriendshipRepository.Query()
                .Where(f => (f.SenderId == userId || f.ReceiverId == userId)
                            && f.Status == FriendshipStatus.Accepted
                            && !f.IsDeleted)
                .Select(f => f.SenderId == userId ? f.ReceiverId.ToString() : f.SenderId.ToString())
                .ToListAsync();

            var friendSet = new HashSet<string>(friendIds);

            if (!Guid.TryParse(id, out var eventId))
                return ErrorResponse.FailureResult("Invalid ticket ID format", ErrorCodes.InvalidInput);
            var participantIds = await _unitOfWork.BookingRepository.Query()
                .Where(b => b.EventId == eventId && b.UserId != userId && b.Status == BookingStatus.Completed && b.PaymentStatus == PaymentStatus.Paid)
                .Select(b => b.UserId)
                .Distinct()         
                .ToListAsync();

            var candidateIds = participantIds
                .Where(id => !friendSet.Contains(id.ToString()))
                .Select(id => id.ToString()) 
                .ToList();
            if (!candidateIds.Any())
                return new BasePaginated<ListSearchFriend>(new List<ListSearchFriend>(), 0, pageNumber, pageSize);

            var pineconeResults = await _pineconeService.QuerySimilarFriendInEventAsync(
                embedding, isUser: true, topK: 11,
                includeIds: candidateIds,   
                excludeIds: friendIds       
            );

            var topCandidates = pineconeResults
                .Where(r => r.Id != userId.ToString())
                .Take(pageSize)
                .ToList();

            if (!topCandidates.Any())
                return new BasePaginated<ListSearchFriend>(new List<ListSearchFriend>(), 0, pageNumber, pageSize);

            var userIds = topCandidates
                .Select(r => Guid.TryParse(r.Id, out var g) ? g : Guid.Empty)
                .Where(g => g != Guid.Empty)
                .ToList();

            var users = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .Include(u => u.Role)
                .Where(u => userIds.Contains(u.Id) && !u.IsDeleted && u.IsActive && u.Role.Name == "User")
                .ToListAsync();

            var ordered = users
                .OrderBy(u => userIds.IndexOf(u.Id))
                .Select(u => new ListSearchFriend
                {
                    Id = u.Id,
                    FriendName = u.FullName!,
                    District = u.District ?? "",
                    Image = u.AvatarImgUrl ?? "",
                    InterestsJson = u.UserInterestsJson ?? "[]"
                })
                .ToList();

            foreach (var f in ordered)
            {
                var otherUser = users.First(u => u.Id == f.Id);
                var fDesc =
                    $"{otherUser.FullName}, " +
                    $"District: {otherUser.District}, " +
                    $"Interests: {otherUser.UserInterestsJson}, " +
                    $"Skills: {otherUser.ProfessionalSkillsJson}, " +
                    $"Job: {otherUser.JobTitle}, " +
                    $"CareerGoal: {otherUser.CareerGoal}, " +
                    $"Intro: {otherUser.Introduction}";

                var prompt = $"User: {descriptionText}. Friend: {fDesc}.";
                f.Reason = await _llmService.GenerateReasonFriendAsync(prompt);
            }

            return new BasePaginated<ListSearchFriend>(
                ordered,
                userIds.Count,
                pageNumber,
                pageSize
            );
        }

    }
}
