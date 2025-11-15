using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Helpers;
using AIEvent.Infrastructure.Hubs;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Enums; 

namespace AIEvent.Application.Services.Implements
{
    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IOneSignalService _oneSignalService;

        public NotificationService(IUnitOfWork unitOfWork, IHubContext<NotificationHub> hubContext, IOneSignalService oneSignalService)
        {
            _unitOfWork = unitOfWork;
            _hubContext = hubContext;
            _oneSignalService = oneSignalService;
        }

        public async Task<Result> CreateNotificationAsync(CreateNotificationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return ErrorResponse.FailureResult("Title is required", ErrorCodes.InvalidInput);

            if (string.IsNullOrWhiteSpace(request.Message))
                return ErrorResponse.FailureResult("Message is required", ErrorCodes.InvalidInput);

            var notification = new Notification
            {
                UserId = request.UserId!.Value,
                Title = request.Title,
                Message = request.Message,
                ImageUrl = request.ImageUrl,
                EventId = request.EventId,
                Type = request.Type,
                Channel = request.Channel,
                IsRead = false,
                ReadAt = null,
            };

            await _unitOfWork.NotificationRepository.AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            var response = new NotificationResponse
            {
                NotificationId = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                ImageUrl = notification.ImageUrl,
                Type = notification.Type,
                EventId = notification.EventId,
                IsRead = notification.IsRead,
                ReadAt = notification.ReadAt,
                CreatedTime = notification.CreatedAt
            };

            await _hubContext.Clients
                .User(request.UserId!.Value.ToString())
                .SendAsync("ReceiveNotification", response);

            return Result.Success();

        }

        public async Task<Result> CreateNotificationToAllAsync(CreateNotificationToAllRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return ErrorResponse.FailureResult("Title is required", ErrorCodes.InvalidInput);

            if (string.IsNullOrWhiteSpace(request.Message))
                return ErrorResponse.FailureResult("Message is required", ErrorCodes.InvalidInput);

            var userQuery = _unitOfWork.UserRepository.Query()
                    .Where(u => !u.IsDeleted);

            if (request.TargetRoles?.Any() == true)
                userQuery = userQuery.Where(ur => request.TargetRoles.Contains(ur.RoleId));

            var targetUserIds = await userQuery.Select(u => u.Id).ToListAsync();
            if (!targetUserIds.Any())
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            var notifications = targetUserIds.Select(userId => new Notification
            {
                UserId = userId,
                Title = request.Title,
                Message = request.Message,
                ImageUrl = request.ImageUrl,
                EventId = request.EventId,
                Type = request.Type,
                Channel = request.Channel,
                IsRead = false,
                ReadAt = null,
            }).ToList();

            await _unitOfWork.NotificationRepository.AddRangeAsync(notifications);
            await _unitOfWork.SaveChangesAsync();

            var response = notifications.Select(n => new NotificationResponse
            {
                NotificationId = n.Id,
                Title = n.Title,
                Message = n.Message,
                ImageUrl = n.ImageUrl,
                Type = n.Type,
                EventId = n.EventId,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedTime = n.CreatedAt
            }).ToList();

            var notificationMap = notifications.ToDictionary(n => n.UserId, n => new NotificationResponse
            {
                NotificationId = n.Id,
                Title = n.Title,
                Message = n.Message,
                ImageUrl = n.ImageUrl,
                Type = n.Type,
                EventId = n.EventId,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedTime = n.CreatedAt
            });

            var tasks = notificationMap.Select(kvp =>
                _hubContext.Clients.User(kvp.Key.ToString())
                    .SendAsync("ReceiveNotification", kvp.Value)
            );
            await Task.WhenAll(tasks);

            return Result.Success();
        }

        public async Task<Result> DeleteIsReadNotificationsAsync(Guid userId)
        {
            var unreadNotifications = await _unitOfWork.NotificationRepository
                                                    .Query()
                                                    .Where(n => n.UserId == userId && n.IsRead && !n.IsDeleted)
                                                    .ToListAsync();
            if (!unreadNotifications.Any())
                return ErrorResponse.FailureResult("Notification not found", ErrorCodes.NotFound);

            foreach (var notification in unreadNotifications)
            {
                await _unitOfWork.NotificationRepository.DeleteAsync(notification);
            }

            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<BasePaginated<NotificationResponse>>> GetNotificationsByUserIdAsync(Guid userId, int pageNumber = 1, int pageSize = 5)
        {
            IQueryable<Notification> notifications = _unitOfWork.NotificationRepository
                                                        .Query()
                                                        .AsNoTracking()
                                                        .Where(n => n.UserId == userId && !n.IsDeleted);

            int totalCount = await notifications.CountAsync();

            var result = await notifications
                .OrderByDescending(n => n.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new NotificationResponse
                {
                    NotificationId = n.Id,
                    ImageUrl = n.ImageUrl,  
                    IsRead = n.IsRead,
                    Type = n.Type,
                    Message = n.Message,
                    ReadAt = n.ReadAt,
                    Title = n.Title,
                    EventId = n.EventId,
                    CreatedTime = n.CreatedAt
                })
                .ToListAsync();

            return new BasePaginated<NotificationResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> MarkAllAsReadAsync(Guid userId)
        {
            var notifications = await _unitOfWork.NotificationRepository
                                        .Query()
                                        .Where(n => n.UserId == userId && !n.IsRead)
                                        .ToListAsync();
            if (!notifications.Any())
                return ErrorResponse.FailureResult("Notification not found", ErrorCodes.NotFound);
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow; 
            }

            await _unitOfWork.NotificationRepository.UpdateRangeAsync(notifications); 
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result> MarkAsReadAsync(Guid notificationId)
        {
            var notification = await _unitOfWork.NotificationRepository
                                        .Query()
                                        .FirstOrDefaultAsync(n => n.Id == notificationId && !n.IsRead);
            if (notification == null)
                return ErrorResponse.FailureResult("Notification not found", ErrorCodes.NotFound);

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _unitOfWork.NotificationRepository.UpdateAsync(notification);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result> SendEventReminderAsync()
        {
            var upcomingEvents = await _unitOfWork.EventRepository
                                        .Query()
                                        .Where(e => !e.IsDeleted
                                                    && e.Status == Domain.Enums.EventStatus.Approved
                                                    && e.StartTime > DateTime.UtcNow
                                                    && e.StartTime <= DateTime.UtcNow.AddHours(3))
                                        .Include(e => e.Bookings)
                                        .ToListAsync();
            if (!upcomingEvents.Any())
                return ErrorResponse.FailureResult("Upcoming events not found", ErrorCodes.NotFound);

            var eventIds = upcomingEvents.Select(e => e.Id).ToList();
            var sentNotifications = await _unitOfWork.NotificationRepository
                                            .Query()
                                            .AsNoTracking()
                                            .Where(n => n.EventId.HasValue
                                                     && eventIds.Contains(n.EventId.Value)
                                                     && n.Type == NotificationType.EventReminder)
                                            .Select(n => new { EventId = n.EventId!.Value, n.UserId })
                                            .ToListAsync();

            var sentLookup = sentNotifications
                                .Select(x => $"{x.EventId}_{x.UserId}")
                                .ToHashSet();

            var allUserIds = upcomingEvents
                            .SelectMany(e => e.Bookings.Select(b => b.UserId))
                            .Distinct()
                            .ToList();
             
            var userNotificationPrefs = await _unitOfWork.UserRepository
                .Query()
                .Where(u => allUserIds.Contains(u.Id) && !u.IsDeleted)
                .Select(u => new { u.Id, u.IsPushNotificationEnabled })
                .ToDictionaryAsync(x => x.Id, x => x.IsPushNotificationEnabled);

            foreach (var ev in upcomingEvents)
            {
                if (!ev.Bookings.Any())
                    continue;

                var firstImage = !string.IsNullOrEmpty(ev.ImgListEvent) 
                    ? ev.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() 
                    : string.Empty;

                foreach (var booking in ev.Bookings)
                {
                    if(booking.Status != BookingStatus.Completed)
                        continue;

                    var key = $"{ev.Id}_{booking.UserId}";
                    if (sentLookup.Contains(key)) continue;

                    if (!userNotificationPrefs.TryGetValue(booking.UserId, out var enabled) || enabled != true)
                        continue;

                    var dto = new PushNotificationRequest
                    {
                        UserId = booking.UserId,
                        Title = $"Sắp diễn ra: {ev.Title}",
                        Content = $"Sự kiện {ev.Title} sẽ diễn ra vào {ev.StartTime:HH:mm dd/MM/yyyy}",
                        EventId = ev.Id,
                        ImageUrl = firstImage,
                        Type = NotificationType.EventReminder,
                        Channel = NotificationChannel.Push
                    };

                    await _oneSignalService.SendNotificationAsync(dto);
                }
            }
            return Result.Success();
        }

    }
}
