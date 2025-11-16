using AIEvent.Application.DTOs.PineconeVector;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class EventEmbeddingService : IEventEmbeddingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPineconeVectorService _pineconeService;
        private readonly IVoyageEmbeddingService _voyageEmbeddingService;

        public EventEmbeddingService(
            IUnitOfWork unitOfWork,
            IPineconeVectorService pineconeService,
            IVoyageEmbeddingService voyageEmbeddingService)
        {
            _unitOfWork = unitOfWork;
            _pineconeService = pineconeService;
            _voyageEmbeddingService = voyageEmbeddingService;
        }

        public async Task EmbedAllEventsAsync()
        {
            var events = await _unitOfWork.EventRepository
                .Query()
                .Include(e => e.EventCategory)
                .Include(e => e.EventTags)
                    .ThenInclude(et => et.Tag)
                .Include(e => e.TicketTypes)
                .Where(e => e.Publish == true 
                    && e.Status == EventStatus.Approved 
                    && !e.IsDeleted)
                .ToListAsync();

            if (events.Count == 0)
            {
                Console.WriteLine("⚠️ Không có sự kiện nào để embed.");
                return;
            }

            var vectors = new List<PineconeVector>();

            foreach (var e in events)
            {
                // Lấy dữ liệu chính xác theo yêu cầu
                var categoryName = e.EventCategory?.CategoryName ?? "Không rõ";
                var tagNames = e.EventTags?.Select(et => et.Tag?.NameTag).Where(n => !string.IsNullOrWhiteSpace(n)).ToList() ?? [];
                var ticketInfos = e.TicketTypes?.Select(t => $"{t.TicketName}: {t.TicketPrice:N0} VND").ToList() ?? new List<string>();

                // Ghép nội dung text mô tả để gửi cho Embedding
                var content = $@"
                    Sự kiện: {e.Title}
                    Mô tả: {e.Description}
                    Danh mục: {categoryName}
                    Thẻ: {(tagNames.Count > 0 ? string.Join(", ", tagNames) : "Không có")}
                    Địa điểm: {e.LocationName ?? e.Address ?? "Không rõ"}
                    Quận/Huyện: {e.District ?? "Không rõ"}
                    Thời gian bắt đầu: {e.StartTime:dd/MM/yyyy HH:mm}
                    Thời gian kết thúc: {e.EndTime:dd/MM/yyyy HH:mm}
                    Các loại vé:
                    {(ticketInfos.Count > 0 ? string.Join("\n", ticketInfos) : "Không có vé")}
                    ";

                try
                {
                    var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(content);

                    //Đưa vào danh sách vector để upsert vào Pinecone
                    vectors.Add(new PineconeVector
                    {
                        Id = e.Id.ToString(),
                        Values = embedding,
                        Metadata = new Dictionary<string, object>
                        {
                            ["EventId"] = e.Id,
                            ["Title"] = e.Title,
                            ["Description"] = e.Description,
                            ["CategoryName"] = categoryName,
                            ["Tags"] = string.Join(", ", tagNames),
                            ["LocationName"] = e.LocationName ?? "",
                            ["District"] = e.District ?? "",
                            ["Address"] = e.Address ?? "",
                            ["StartTime"] = e.StartTime,
                            ["EndTime"] = e.EndTime,
                            ["Tickets"] = string.Join(", ", ticketInfos)
                        }
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Lỗi embed sự kiện {e.Title}: {ex.Message}");
                }
            }

            if (vectors.Any())
            {
                await _pineconeService.UpsertVectorAsync(vectors, isUser: false);
                Console.WriteLine($"✅ Đã embed {vectors.Count} sự kiện vào Pinecone thành công!");
            }
        }
    }
}
