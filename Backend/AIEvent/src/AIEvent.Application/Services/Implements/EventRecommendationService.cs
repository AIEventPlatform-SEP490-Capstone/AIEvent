using AIEvent.Application.Services.Interfaces;

namespace AIEvent.Application.Services.Implements
{
    public class EventRecommendationService : IEventRecommendationService
    {
        private readonly IVoyageEmbeddingService _voyageEmbeddingService;
        private readonly IPineconeVectorService _pineconeService;
        private readonly IOpenRouterLLMService _llmService;

        public EventRecommendationService(
            IVoyageEmbeddingService voyageEmbeddingService,
            IPineconeVectorService pineconeService,
            IOpenRouterLLMService llmService)
        {
            _voyageEmbeddingService = voyageEmbeddingService;
            _pineconeService = pineconeService;
            _llmService = llmService;
        }

        /// <summary>
        /// Gợi ý sự kiện dựa trên prompt người dùng bằng cách sinh embedding, tìm vector tương tự và sinh phản hồi tự nhiên.
        /// </summary>
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
    }
}
