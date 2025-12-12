using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class OpenRouterLLMService : IOpenRouterLLMService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public OpenRouterLLMService(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = config["AIProviders:OpenRouter:ApiKey"]!;
            _model = config["AIProviders:OpenRouter:Model"]!;
        }

        public async Task<string> GenerateTextAsync(string prompt)
        {
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "Bạn là một trợ lý AI gợi ý sự kiện thông minh, hỗ trợ gợi ý sự kiện cho người dùng." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.7
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            var json = await JsonDocument.ParseAsync(stream);
            var content = json.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return content ?? string.Empty;
        }

        public async Task<string> GenerateRAGResponseAsync(string query, List<string> contexts, List<(string prompt, string response)>? chatHistory = null)
        {
            var contextText = string.Join("\n---\n", contexts);

            var chatHistoryText = "";
            if (chatHistory != null && chatHistory.Any())
            {
                var historyItems = chatHistory.Select((h, index) =>
                    $@"Cuộc hội thoại {index + 1}:
            - Người dùng: {h.prompt}
            - Trợ lý: {h.response}").ToList();
                chatHistoryText = $@"
            Lịch sử hội thoại trước đó (để hiểu rõ hơn về sở thích và yêu cầu của người dùng theo lịch sử chat từ cũ nhất đến mới nhất):
            {string.Join("\n\n", historyItems)}
            ";
            }

            var prompt = $@"
            Người dùng hỏi: ""{query}"".

            {chatHistoryText}

            Bạn là trợ lý hội thoại thông minh. Hãy trả lời bằng giọng văn tự nhiên, gần gũi, dễ hiểu, giống như cách một người bình thường giải thích.

            Nhiệm vụ chính của bạn:
            - Trả lời dựa trên NGỮ CẢNH cung cấp bên dưới.
            - Luôn thân thiện, mềm mại, không mang giọng điệu máy móc.
            - Tuyệt đối không được tạo mới, suy diễn hay bổ sung thông tin ngoài ngữ cảnh.
            - Thể hiện sự linh hoạt theo đúng ý nghĩa thật sự của câu hỏi.
            - Nếu có lịch sử hội thoại, hãy dùng nó để hiểu mạch trò chuyện nhưng không được vượt khỏi dữ liệu ngữ cảnh.

            --- NGỮ CẢNH BẮT ĐẦU ---
            {contextText}
            --- NGỮ CẢNH KẾT THÚC ---

            Cách phản hồi theo tình huống:

            1) Nếu câu hỏi liên quan đến việc tìm hiểu hoặc lựa chọn sự kiện:
               - Xác định những sự kiện phù hợp nhất với câu hỏi.  
               - Nếu người dùng muốn 1, nhiều hoặc không chỉ rõ số lượng, hãy chọn theo mức độ liên quan.
               - Nếu không chắc người dùng muốn sự kiện nào → hỏi lại một cách nhẹ nhàng để xác nhận.  
               - Mỗi sự kiện được trình bày theo mẫu rõ ràng, tự nhiên:
                    - Tiêu đề: ...
                    - Địa điểm: ...
                    - Thời gian: ...
                    - Giá vé: ...
                    - Xem chi tiết: ...
               - Trước khi liệt kê, hãy mở đầu bằng vài câu giải thích lý do sự kiện phù hợp.

            2) Nếu câu hỏi không yêu cầu tìm sự kiện, nhưng có thể trả lời bằng dữ liệu trong ngữ cảnh:
               - Hãy giải thích tự nhiên dựa trên thông tin có trong ngữ cảnh.
               - Không liệt kê sự kiện nếu không cần thiết.
            3) Nếu câu hỏi không yêu cầu tìm kiếm sự kiện, hoặc không có dữ liệu trong ngữ cảnh hỗ trợ:
               - Giải thích nhẹ nhàng rằng bạn không tìm thấy thông tin phù hợp.
               - Đề nghị người dùng mô tả rõ hơn nếu họ muốn nhận gợi ý chính xác.

            4) Lịch sử hội thoại (nếu có) chỉ đóng vai trò giúp bạn hiểu người dùng thích gì hoặc đang tìm điều gì,
               nhưng bạn vẫn phải tuân thủ tuyệt đối thông tin trong ngữ cảnh.

            5) Nếu người dùng hỏi về trải nghiệm, lời khuyên, chuẩn bị, cảm nhận, hoặc các câu hỏi mang tính chủ quan
               mà ngữ cảnh không cung cấp dữ liệu cụ thể:
               - Hãy trả lời tự nhiên bằng cách đưa ra lời khuyên cụ thể về sự kiện, lịch sự và hữu ích.
               - KHÔNG tạo thông tin chi tiết về sự kiện nếu chúng không xuất hiện trong ngữ cảnh.

            Hãy bắt đầu trả lời ngay bây giờ.
            ";

            return await GenerateTextAsync(prompt);
        }

        public async Task<string> GenerateSessionNameAsync(string prompt)
        {
            var sessionNamePrompt = $@"
            Dựa vào câu hỏi sau đây của người dùng, hãy tạo một tiêu đề ngắn gọn (tối đa 50 ký tự) để đặt tên cho cuộc hội thoại này.
            Chỉ trả về tiêu đề, không có giải thích hay ký tự đặc biệt.

            Câu hỏi: ""{prompt}""
            ";

            var sessionName = await GenerateTextAsync(sessionNamePrompt);
             
            sessionName = sessionName.Trim();
            if (sessionName.Length > 50)
            {
                sessionName = sessionName.Substring(0, 50).Trim();
            }
             
            if (string.IsNullOrWhiteSpace(sessionName) || sessionName.Length < 3)
            {
                sessionName = prompt.Length > 50 ? prompt.Substring(0, 50) + "..." : prompt;
            }

            return sessionName;
        }

        public async Task<string> GenerateShortReasonAsync(string prompt)
        {
            var fullPrompt =
                $"Dựa trên thông tin dưới đây, hãy tạo một lý do tại sao event đó có gì phù hợp với thông tin người dùng NGẮN GỌN dưới 30 từ, súc tích, tự nhiên, không giải thích dài dòng.\n" +
                $"Ví dụ : Phù hợp với sở thích Âm nhạc, Gần vị trí của bạn, Phù hợp ngân sách,...\n" +
                $"Không được xuống dòng, không được ghi tiêu đề, không thêm các icon và các kí tự đặc biệt\n" +
                $"Chỉ trả về đúng 1 câu lý do.\n\n" +
                $"Thông tin: {prompt}";

            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "Bạn là AI chuyên gợi ý sự kiện." },
                    new { role = "user", content = fullPrompt }
                },
                temperature = 0.5,
                max_tokens = 40
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            var json = await JsonDocument.ParseAsync(stream);

            var content = json.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            var clean = content?
                .Replace("\n", " ")
                .Replace("\r", " ")
                .Trim();

            if (string.IsNullOrWhiteSpace(clean))
                clean = "Phù hợp sở thích và vị trí.";

            return clean;
        }

        public async Task<string> GenerateReasonFriendAsync(string prompt)
        {
            var fullPrompt =
                $"Dựa trên thông tin dưới đây, hãy tạo một lý do tại sao friend đó có gì phù hợp với thông tin user để kết bạn NGẮN GỌN dưới 30 từ, súc tích, tự nhiên, không giải thích dài dòng.\n" +
                $"Không được xuống dòng, không được ghi tiêu đề, không thêm các icon và các kí tự đặc biệt\n" +
                $"Chỉ trả về đúng 1 câu lý do.\n\n" +
                $"Thông tin: {prompt}";

            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "Bạn là AI chuyên gợi ý kết bạn" },
                    new { role = "user", content = fullPrompt }
                },
                temperature = 0.5,
                max_tokens = 40
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            var json = await JsonDocument.ParseAsync(stream);

            var content = json.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            var clean = content?
                .Replace("\n", " ")
                .Replace("\r", " ")
                .Trim();

            if (string.IsNullOrWhiteSpace(clean))
                clean = "Phù hợp sở thích";

            return clean;
        }
    }
}
