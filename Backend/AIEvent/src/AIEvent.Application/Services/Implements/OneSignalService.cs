using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities; 
using AIEvent.Infrastructure.Repositories.Interfaces; 
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace AIEvent.Application.Services.Implements
{
    public class OneSignalService : IOneSignalService
    {
        private readonly HttpClient _httpClient;
        private readonly IUnitOfWork _unitOfWork;
        private readonly string _appId;
        private readonly string _apiKey;

        public OneSignalService(HttpClient httpClient, IConfiguration config, IUnitOfWork unitOfWork)
        {
            _httpClient = httpClient;
            _appId = config["OneSignal:AppId"] ?? throw new ArgumentNullException("App id oneSignal not found");
            _apiKey = config["OneSignal:RestApiKey"] ?? throw new ArgumentNullException("Rest apiKey OneSignal not found");
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<bool>> SendNotificationAsync(PushNotificationRequest dto)
        {
            if(dto.UserId == null)
                return ErrorResponse.FailureResult("UserId not valid", ErrorCodes.InvalidInput);

            var deviceToken = await _unitOfWork.UserRepository
                                    .Query()
                                    .Where(u => u.Id == dto.UserId && !u.IsDeleted)
                                    .Select(u => u.DeviceToken)
                                    .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(deviceToken))
                return ErrorResponse.FailureResult("Device token not found", ErrorCodes.InvalidInput);

            var payload = new
            {
                app_id = _appId,
                included_segments = new[] { "Subscribed Users" },
                headings = new { en = dto.Title },
                contents = new { en = dto.Content },
                include_player_ids = new[] { deviceToken },
                include_external_user_ids = new[] { dto.UserId.ToString() },
                big_picture = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://onesignal.com/api/v1/notifications");
            request.Headers.Add("Authorization", $"Basic {_apiKey}");
            request.Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );
            try
            {
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return ErrorResponse.FailureResult($"OneSignal send notification fail: {(int)response.StatusCode} - {errorContent}");
                }

                var notification = new Notification
                {
                    UserId = dto.UserId.Value,
                    Title = dto.Title,
                    Message = dto.Content,
                    ImageUrl = dto.ImageUrl,
                    EventId = dto.EventId,
                    Type = dto.Type,
                    Channel = dto.Channel,
                    IsRead = false,
                    ReadAt = null,
                };

                await _unitOfWork.NotificationRepository.AddAsync(notification);
                await _unitOfWork.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error send notificatiob to OneSignal: {ex.Message}");
            }
        }
    }
}
