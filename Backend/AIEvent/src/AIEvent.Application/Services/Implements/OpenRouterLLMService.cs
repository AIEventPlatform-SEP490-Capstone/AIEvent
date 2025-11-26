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
            Lịch sử hội thoại trước đó (để hiểu rõ hơn về sở thích và yêu cầu của người dùng):
            {string.Join("\n\n", historyItems)}
            ";
            }

            var prompt = $@"
            Người dùng hỏi: ""{query}"".
            {chatHistoryText}
            Dưới đây là danh sách sự kiện liên quan (ngữ cảnh). Bạn chỉ được sử dụng thông tin trong danh sách này:
            {contextText}
            Hãy lựa chọn **một hoặc nhiều sự kiện phù hợp nhất** với yêu cầu người dùng.
            Đối với mỗi sự kiện được chọn, trả về theo định dạng sau:
            1) Mở đầu bằng **một câu tự nhiên** giải thích lý do sự kiện này phù hợp.
            2) Sau đó là **form chuẩn**:

            - **Địa điểm:** [Địa điểm tổ chức]
            - **Thời gian:** [dd/MM/yyyy HH:mm → dd/MM/yyyy HH:mm]
            - **Giá vé:** [Miễn phí hoặc giá vé]

            3) Kết thúc bằng:
              Xem chi tiết: [link đã có trong context]

            Nếu có nhiều sự kiện phù hợp, hãy trình bày theo từng mục tách biệt.
            Không được tự tạo hoặc suy diễn bất kỳ thông tin nào ngoài context.
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

    }
}
