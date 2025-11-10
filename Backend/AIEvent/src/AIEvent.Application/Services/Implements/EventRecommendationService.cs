using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
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

        public async Task<string> RecommendEventsAsync(string userPrompt, int topK = 5)
        {
            if (string.IsNullOrWhiteSpace(userPrompt))
                throw new ArgumentException("Prompt không được để trống.");

            // 1️⃣ Sinh embedding cho câu hỏi người dùng bằng Google Gemini
            var queryEmbedding = await _voyageEmbeddingService.GetEmbeddingAsync(userPrompt);

            // 2️⃣ Tìm các sự kiện tương tự trong Pinecone
            var results = await _pineconeService.QuerySimilarAsync(queryEmbedding, topK);

            if (results == null || !results.Any())
                return "Xin lỗi, hiện tại tôi chưa tìm thấy sự kiện nào phù hợp với yêu cầu của bạn.";

            // 3️⃣ Chuẩn bị context từ metadata trong Pinecone (phù hợp với EventEmbeddingService)
            var contexts = results.Select(r =>
            {
                var meta = r.Metadata ?? new Dictionary<string, object>();

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

                return $@"
                    - {title ?? "Sự kiện"} ({category ?? "Không rõ danh mục"})
                      Địa điểm: {(location ?? address ?? "Không rõ")} - {district ?? ""}
                      Thời gian: {start ?? ""} → {end ?? ""}
                      Mô tả: {description ?? "Không có mô tả"}
                      Thẻ: {tags ?? "Không có"}
                      Vé: {tickets ?? "Không có thông tin vé"}
                    ";
            }).ToList();

            // 4️⃣ Gọi mô hình LLM OpenRouter để tạo phản hồi tự nhiên
            var response = await _llmService.GenerateRAGResponseAsync(userPrompt, contexts);

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

            var aiResults = await _pineconeService.QuerySimilarAsync(embedding, topK: 10);

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

    }
}
