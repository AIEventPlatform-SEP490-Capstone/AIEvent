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
using Microsoft.Extensions.Logging;
using AIEvent.Domain.Enums;
using MimeKit;
using System.Text; 

namespace AIEvent.Application.Services.Implements
{
    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHubContext<NotificationHub> _hubContext; 
        private readonly IEmailService _emailService; 

        public NotificationService(IUnitOfWork unitOfWork, IHubContext<NotificationHub> hubContext, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _hubContext = hubContext;
            _emailService = emailService;
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
                EventInvitationId = request.EventInvitationId,
                OrganizerProfileId = request.OrganizerProfileId,
                Type = request.Type, 
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
                OrganizerProfileId = notification.OrganizerProfileId,
                EventInvitationId = notification.EventInvitationId,
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
                EventInvitationId = request.EventInvitationId,
                OrganizerProfileId = request.OrganizerProfileId,
                Type = request.Type, 
                IsRead = false,
                ReadAt = null,
            }).ToList();

            await _unitOfWork.NotificationRepository.AddRangeAsync(notifications);
            await _unitOfWork.SaveChangesAsync();

            var notificationMap = notifications.ToDictionary(n => n.UserId, n => new NotificationResponse
            {
                NotificationId = n.Id,
                Title = n.Title,
                Message = n.Message,
                ImageUrl = n.ImageUrl,
                Type = n.Type,
                OrganizerProfileId = n.OrganizerProfileId,
                EventInvitationId = n.EventInvitationId,
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

        public async Task<Result<BasePaginated<NotificationResponse>>> GetNotificationsByUserIdAsync(Guid userId, bool? isRead = false, int pageNumber = 1, int pageSize = 5)
        {
            IQueryable<Notification> notifications = _unitOfWork.NotificationRepository
                                                        .Query()
                                                        .AsNoTracking()
                                                        .Where(n => n.UserId == userId && !n.IsDeleted);
            if (isRead.HasValue)
                notifications = notifications.Where(n => n.IsRead == isRead.Value);

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
                    CreatedTime = n.CreatedAt,
                    EventInvitationId = n.EventInvitationId,
                    OrganizerProfileId = n.OrganizerProfileId,
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

        public async Task<Result> SendEventBookingReminderAsync()
        {
             var allSettings = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted)
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();

                if (!allSettings.Any())
                    return ErrorResponse.FailureResult("SystemSetting not found", ErrorCodes.NotFound);

            var bookingsToNotify = await _unitOfWork.BookingRepository
                        .Query()
                        .Where(b => !b.IsDeleted
                                    && b.IsNotification == false
                                    && b.Status == BookingStatus.Completed
                                    && b.Event.Status == EventStatus.Approved
                                    && !b.Event.IsDeleted
                                    && b.Event.StartTime > DateTime.UtcNow)
                        .Include(b => b.Event)
                        .Include(b => b.User)
                        .ToListAsync();

                if (!bookingsToNotify.Any())
                    return ErrorResponse.FailureResult("Upcoming events not found", ErrorCodes.NotFound);

            var settingCache = new Dictionary<string, SystemSetting>();
                var bookingsToUpdate = new List<Booking>(); 

                foreach (var booking in bookingsToNotify)
                {
                    var eventItem = booking.Event;
                    var user = booking.User;
                    if (user == null || user.IsDeleted)
                        continue;

                var key = $"{eventItem.SaleStartTime:yyyy-MM}";
                    if (!settingCache.TryGetValue(key, out var setting))
                    {
                        setting = allSettings
                            .FirstOrDefault(s => s.UpdatedAt!.Value.Year == eventItem.SaleStartTime!.Value.Year &&
                                                 s.UpdatedAt!.Value.Month == eventItem.SaleStartTime!.Value.Month)
                            ?? allSettings.First();

                        settingCache[key] = setting;
                    }

                    var reminderHours = setting.EventReminderHours > 0 ? setting.EventReminderHours : 3;

                    if (eventItem.StartTime <= DateTime.UtcNow.AddHours(reminderHours))
                    {
                        var firstImage = !string.IsNullOrEmpty(eventItem.ImgListEvent)
                            ? eventItem.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                            : string.Empty;
                     
                        await CreateNotificationAsync(new CreateNotificationRequest
                        {
                            UserId = booking.UserId,
                            Title = $"Sắp diễn ra: {eventItem.Title}",
                            Message = $"Sự kiện {eventItem.Title} sẽ diễn ra vào {eventItem.StartTime.AddHours(7):HH:mm dd/MM/yyyy}",
                            Type = NotificationType.EventReminder,
                            EventId = eventItem.Id,
                            ImageUrl = firstImage
                        }); 
 
                        if (user.IsEmailNotificationEnabled == true && !string.IsNullOrEmpty(user.Email))
                        {
                            var sb = new StringBuilder();

                            if (!string.IsNullOrEmpty(firstImage))
                                sb.AppendLine($"<img src='{firstImage}' style='width:100%;max-width:600px;border-radius:8px;margin-bottom:20px;'/>");

                            sb.AppendLine($"<p>Xin chào {user.FullName ?? user.Email},</p>")
                              .AppendLine($"<p>Sự kiện <strong>{eventItem.Title}</strong> sẽ diễn ra vào <strong>{eventItem.StartTime.AddHours(7):HH:mm dd/MM/yyyy}</strong>.</p>")
                              .AppendLine("<p>Đừng quên tham gia sự kiện nhé!</p>")
                              .AppendLine($"<p><a href=\"https://aievent.vercel.app/event/{eventItem.Id}\">Xem chi tiết sự kiện</a></p>")
                              .AppendLine("<p>Trân trọng,<br/>AIEvent Team</p>");

                            await _emailService.SendEmailAsync(user.Email, new MimeMessage
                            {
                                Subject = $"Nhắc nhở: {eventItem.Title} sắp diễn ra",
                                Body = new TextPart("html") { Text = sb.ToString() }
                            });
                         }

                        booking.IsNotification = true;
                        bookingsToUpdate.Add(booking);
                    }
                }

                if (bookingsToUpdate.Any())
                {
                    await _unitOfWork.BookingRepository.UpdateRangeAsync(bookingsToUpdate);
                    await _unitOfWork.SaveChangesAsync();
                }

                return Result.Success(); 
        }

    public async Task<Result> SendFavoriteEventTicketSaleNotificationAsync()
        { 
            var now = DateTime.UtcNow;
                var oneHourFromNow = now.AddHours(1);

                var eventsToNotify = await _unitOfWork.EventRepository
                    .Query()
                    .Where(e => !e.IsDeleted
                                && e.Status == EventStatus.Approved
                                && e.SaleStartTime.HasValue
                                && e.SaleStartTime.Value > now
                                && e.SaleStartTime.Value <= oneHourFromNow
                                && e.FavoriteEvents.Any())
                    .Include(e => e.FavoriteEvents)
                        .ThenInclude(fe => fe.User)
                    .ToListAsync();

                if (!eventsToNotify.Any())
                    return ErrorResponse.FailureResult("Favorite Event not found", ErrorCodes.NotFound);

            foreach (var eventItem in eventsToNotify)
                {
                    var firstImage = !string.IsNullOrEmpty(eventItem.ImgListEvent)
                        ? eventItem.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                        : string.Empty;

                    var favoriteUsers = eventItem.FavoriteEvents
                        .Where(fe => fe.User != null && !fe.User.IsDeleted && fe.User.IsActive)
                        .GroupBy(fe => fe.UserId)
                        .Select(g => g.First().User)
                        .ToList();
 
                    foreach (var user in favoriteUsers)
                    { 
                        var existingNotification = await _unitOfWork.NotificationRepository
                            .Query()
                            .AnyAsync(n => n.UserId == user.Id
                                        && n.EventId == eventItem.Id
                                        && n.Type == NotificationType.TicketSaleReminder
                                        && !n.IsDeleted);

                        if (existingNotification)
                            continue;

                    var notificationRequest = new CreateNotificationRequest
                        {
                            UserId = user.Id,
                            Title = $"Sắp mở bán vé: {eventItem.Title}",
                            Message = $"Sự kiện {eventItem.Title} sẽ mở bán vé vào {eventItem.SaleStartTime!.Value.AddHours(7):HH:mm dd/MM/yyyy}. Đừng bỏ lỡ cơ hội!",
                            Type = NotificationType.TicketSaleReminder,
                            EventId = eventItem.Id,
                            ImageUrl = firstImage
                        };

                        await CreateNotificationAsync(notificationRequest); 

                        if (user.IsEmailNotificationEnabled == true && !string.IsNullOrEmpty(user.Email))
                        {
                            var sb = new StringBuilder();
                            if (!string.IsNullOrEmpty(firstImage))
                                sb.AppendLine($"<img src='{firstImage}' alt='Event' style='width:100%;max-width:600px;border-radius:8px;margin-bottom:20px;'/>");

                            sb.AppendLine($"<p>Xin chào {user.FullName ?? user.Email},</p>")
                              .AppendLine($"<p>Sự kiện <strong>{eventItem.Title}</strong> sẽ mở bán vé vào <strong>{eventItem.SaleStartTime.Value.AddHours(7):HH:mm dd/MM/yyyy}</strong>.</p>")
                              .AppendLine("<p>Đừng bỏ lỡ cơ hội sở hữu vé cho sự kiện yêu thích của bạn!</p>")
                              .AppendLine($"<p><a href=\"https://aievent.vercel.app/event/{eventItem.Id}\">Xem chi tiết và đặt vé ngay</a></p>")
                              .AppendLine("<p>Trân trọng,<br/>AIEvent Team</p>");

                            var message = new MimeMessage
                            {
                                Subject = $"Thông báo: {eventItem.Title} sắp mở bán vé",
                                Body = new TextPart("html") { Text = sb.ToString() }
                            };

                            await _emailService.SendEmailAsync(user.Email, message);
                        }
                    }
                }

                return Result.Success();
        }
    }
}

