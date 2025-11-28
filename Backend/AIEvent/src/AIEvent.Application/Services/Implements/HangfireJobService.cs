using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.DTOs.PineconeVector;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MimeKit; 
using System.Text;
using System.Text.Json;

namespace AIEvent.Application.Services.Implements
{
    public class HangfireJobService : IHangfireJobService
    {
        private readonly IPdfService _pdfService;
        private readonly IEmailService _emailService;
        private readonly ILogger<HangfireJobService> _logger;
        private readonly IUnitOfWork _unitOfWork; 
        private readonly ITransactionHelper _transactionHelper;
        private readonly INotificationService _notificationService;
        private readonly IVoyageEmbeddingService _voyageEmbeddingService;
        private readonly IPineconeVectorService _pineconeVectorService;
        private readonly IQrCodeService _qrCodeService;
        private readonly ITicketSignatureService _ticketSignatureService;

        public HangfireJobService(
        IPdfService pdfService,
        IEmailService emailService,
        ILogger<HangfireJobService> logger,
        IUnitOfWork unitOfWork, 
        ITransactionHelper transactionHelper,
        INotificationService notificationService,
        IVoyageEmbeddingService voyageEmbeddingService,
        IPineconeVectorService pineconeVectorService,
        IQrCodeService qrCodeService,
        ITicketSignatureService ticketSignatureService)
        {
            _pdfService = pdfService;
            _emailService = emailService;
            _logger = logger;
            _unitOfWork = unitOfWork; 
            _transactionHelper = transactionHelper;
            _notificationService = notificationService;
            _pineconeVectorService = pineconeVectorService;
            _voyageEmbeddingService = voyageEmbeddingService;
            _qrCodeService = qrCodeService;
            _ticketSignatureService = ticketSignatureService;
        }

        // send ticket to email
        public async Task EnqueueSendTicketEmailJobAsync(SendEmailJobRequest request)
        {
            BackgroundJob.Enqueue(() => GenerateAndSendTicketEmailAsync(request));
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateAndSendTicketEmailAsync(SendEmailJobRequest request)
        {
            try
            {
                _logger.LogInformation("Starting ticket email generation for {UserEmail} ({EventTitle}), {TicketCount} tickets", 
                    request.Email, request.EventTitle, request.Tickets.Count);

                // Tải ảnh event nếu có URL
                byte[]? eventImageBytes = null;
                var firstTicket = request.Tickets.FirstOrDefault();
                if (firstTicket != null && !string.IsNullOrEmpty(firstTicket.EventImageUrl))
                {
                    _logger.LogInformation("Downloading event image from {ImageUrl}", firstTicket.EventImageUrl);
                    eventImageBytes = await DownloadImageAsync(firstTicket.EventImageUrl);
                    
                    if (eventImageBytes != null)
                        _logger.LogInformation("Event image downloaded successfully, size: {Size} bytes", eventImageBytes.Length);
                    else
                        _logger.LogWarning("Failed to download event image, will proceed without image");
                }
                else
                {
                    _logger.LogWarning("No event image URL provided");
                }

                var qrContents = new Dictionary<string, string>(request.Tickets.Count);
                foreach (var ticket in request.Tickets)
                {
                    var signature = _ticketSignatureService.CreateSignature(ticket.TicketCode);
                    qrContents[ticket.TicketCode] = $"{ticket.TicketCode}.{signature}";
                }

                var qrBytesDict = _qrCodeService.GenerateQrBytes(qrContents.Values.ToList());

                foreach (var ticket in request.Tickets)
                {
                    ticket.EventImageBytes = eventImageBytes;

                    var contentKey = qrContents[ticket.TicketCode];
                    if (qrBytesDict.TryGetValue(contentKey, out var qrBytes))
                    {
                        ticket.QrBytes = qrBytes;
                    }
                }

                // Sinh file PDF
                _logger.LogInformation("Generating PDF for {TicketCount} tickets", request.Tickets.Count);
                var pdfBytes = await _pdfService.GenerateTicketsPdfAsync(request.Tickets, request.EventTitle, request.FullName, request.Email);
                _logger.LogInformation("PDF generated successfully, size: {Size} bytes", pdfBytes.Length);

                // Gửi email
                _logger.LogInformation("Sending email to {UserEmail}", request.Email);
                await _emailService.SendTicketsEmailAsync(
                    request.Email,
                    $"Your Tickets from AIEvent - {request.EventTitle}",
                    null!,
                    pdfBytes,
                    $"{request.FullName}-AIEvent",
                    request.EventTitle,
                    request.FullName,
                    request.OrganizerName,
                    request.OrganizerPhone,
                    request.OrganizerEmail,
                    request.StartTime,
                    request.EndTime
                );

                _logger.LogInformation("Successfully sent ticket email to {UserEmail} for event '{EventTitle}'", 
                    request.Email, request.EventTitle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending ticket email for {UserEmail} ({EventTitle}). Error: {ErrorMessage}", 
                    request.Email, request.EventTitle, ex.Message);
                throw;
            }
        }

        private async Task<byte[]?> DownloadImageAsync(string imageUrl)
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(10);
                var response = await httpClient.GetAsync(imageUrl);
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsByteArrayAsync();
                }
                else
                {
                    _logger.LogWarning("Failed to download image from {ImageUrl}: Status {StatusCode}", imageUrl, response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error downloading image from {ImageUrl}", imageUrl);
            }
            return null;
        }


        public async Task EnqueueCancelEventJobAsync(Guid eventId, string reasonCancel)
        {
            BackgroundJob.Enqueue(() => ProcessCancelEventJobAsync(eventId, reasonCancel));
            await Task.CompletedTask;
        }


        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessCancelEventJobAsync(Guid eventId, string reasonCancel)
        {
            try
            {
                _logger.LogInformation("Starting cancellation job for event {EventId}", eventId);

                var existingEvent = await _unitOfWork.EventRepository
                    .Query()
                    .Include(e => e.Bookings)
                        .ThenInclude(b => b.User)
                        .ThenInclude(u => u.Wallet)
                    .Include(e => e.Bookings)
                        .ThenInclude(b => b.BookingItems)
                        .ThenInclude(bi => bi.Tickets)
                        .ThenInclude(bi => bi.TicketType)
                    .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

                if (existingEvent == null)
                {
                    _logger.LogWarning("Event not found: {EventId}", eventId);
                    return;
                }

                var hasBookings = existingEvent.Bookings
                    .Where(b => b.Status == BookingStatus.Completed)
                    .ToList();
 
                var eventTitle = existingEvent.Title;
                var bookingsForNotification = hasBookings.Select(b => new { b.UserId, b.TotalAmount }).ToList();

                await _transactionHelper.ExecuteInTransactionAsync(async () =>
                {
                    if (!hasBookings.Any())
                    {
                        await _unitOfWork.EventRepository.DeleteAsync(existingEvent);
                        _logger.LogInformation("Deleted event {EventId} without bookings.", eventId);
                        return Result.Success();
                    }

                    var walletTransactions = new List<WalletTransaction>();
                    var paymentTransactions = new List<PaymentTransaction>();
                    var bookingsToUpdate = new List<Booking>();
                    var walletsToUpdate = new List<Wallet>();
                    var ticketsToUpdate = new List<Ticket>();
                    var ticketTypeQuantityMap = new Dictionary<Guid, int>(); 
                    int totalTicketsToRevert = 0;

                    foreach (var booking in hasBookings)
                    {
                        foreach (var bookingItem in booking.BookingItems)
                        {
                            foreach (var ticket in bookingItem.Tickets)
                            {
                                if (ticket.Status != TicketStatus.Cancelled && ticket.Status != TicketStatus.Used)
                                {
                                    ticket.Status = TicketStatus.Cancelled;
                                    ticketsToUpdate.Add(ticket);
                                }
                            }

                            if (!ticketTypeQuantityMap.ContainsKey(bookingItem.TicketTypeId))
                                ticketTypeQuantityMap[bookingItem.TicketTypeId] = 0;
                            
                            ticketTypeQuantityMap[bookingItem.TicketTypeId] += bookingItem.Quantity;
                            totalTicketsToRevert += bookingItem.Quantity;
                        }

                        if (booking.TotalAmount <= 0)
                        {
                            booking.Status = BookingStatus.Cancelled;
                            bookingsToUpdate.Add(booking);
                            continue;
                        }

                        var userWallet = booking.User.Wallet;
                        if (userWallet == null)
                            throw new Exception($"Wallet not found for user {booking.User.FullName}");

                        if (existingEvent.TotalAmount < booking.TotalAmount)
                            throw new Exception($"Event wallet has insufficient balance to refund {booking.TotalAmount}");

                        paymentTransactions.Add(new PaymentTransaction
                        {
                            BookingId = booking.Id,
                            UserId = booking.UserId,
                            Amount = booking.TotalAmount,
                            PaymentMethod = PaymentMethod.Wallet,
                            Status = TransactionStatus.Success,
                            Description = $"Hoàn tiền do hủy sự kiện '{existingEvent.Title}'. Lý do: {reasonCancel} cho người dùng {booking.User.FullName ?? booking.User.Email}",
                            TransactionType = TransactionType.Refund,
                            CompletedAt = DateTime.UtcNow
                        });

                        walletTransactions.Add(new WalletTransaction
                        {
                            WalletId = userWallet.Id,
                            Amount = booking.TotalAmount,
                            BalanceBefore = userWallet.Balance,
                            BalanceAfter = userWallet.Balance + booking.TotalAmount,
                            Type = TransactionType.Refund,
                            Direction = TransactionDirection.In,
                            ReferenceId = booking.Id,
                            ReferenceType = ReferenceType.Refund,
                            Status = TransactionStatus.Success,
                            Description = $"Hoàn tiền do hủy sự kiện '{existingEvent.Title}'. Lý do: {reasonCancel}"
                        });

                        userWallet.Balance += booking.TotalAmount;
                        existingEvent.TotalAmount -= booking.TotalAmount;

                        if (!walletsToUpdate.Any(w => w.Id == userWallet.Id))
                            walletsToUpdate.Add(userWallet);

                        booking.Status = BookingStatus.Cancelled;
                        bookingsToUpdate.Add(booking);
                    }
                     
                    var ticketTypeIds = ticketTypeQuantityMap.Keys.ToList();
                    var ticketTypesToUpdate = await _unitOfWork.TicketTypeRepository
                        .Query()
                        .Where(tt => ticketTypeIds.Contains(tt.Id))
                        .ToListAsync();

                    var ticketTypesUpdated = new List<TicketType>();

                    foreach (var ticketType in ticketTypesToUpdate)
                    {
                        if (ticketTypeQuantityMap.TryGetValue(ticketType.Id, out var quantity))
                        {
                            if (ticketType.SoldQuantity >= quantity)
                            {
                                ticketType.RemainingQuantity += quantity;
                                ticketType.SoldQuantity -= quantity;
                                ticketType.SetUpdated(null);
                                ticketTypesUpdated.Add(ticketType);
                            }
                            else
                                _logger.LogWarning("Cannot revert ticket quantities for TicketType {TicketTypeId}: SoldQuantity ({SoldQty}) < quantity to revert ({Quantity})",
                                        ticketType.Id, ticketType.SoldQuantity, quantity);
                        }
                    }

                    if (ticketTypesUpdated.Any())
                        await _unitOfWork.TicketTypeRepository.UpdateRangeAsync(ticketTypesUpdated);

                    if (totalTicketsToRevert > 0)
                    {
                        if (existingEvent.SoldQuantity >= totalTicketsToRevert)
                        {
                            existingEvent.RemainingTickets += totalTicketsToRevert;
                            existingEvent.SoldQuantity -= totalTicketsToRevert;
                        }
                        else
                            _logger.LogWarning("Cannot revert ticket quantities for Event {EventId}: SoldQuantity ({SoldQty}) < quantity to revert ({Quantity})",
                                    eventId, existingEvent.SoldQuantity, totalTicketsToRevert);
                    }

                    await _unitOfWork.PaymentTransactionRepository.AddRangeAsync(paymentTransactions);
                    await _unitOfWork.WalletTransactionRepository.AddRangeAsync(walletTransactions);
                    await _unitOfWork.WalletRepository.UpdateRangeAsync(walletsToUpdate);
                    await _unitOfWork.BookingRepository.UpdateRangeAsync(bookingsToUpdate);
                    if (ticketsToUpdate.Any())
                        await _unitOfWork.TicketRepository.UpdateRangeAsync(ticketsToUpdate);

                    existingEvent.ReasonCancel = reasonCancel;
                    existingEvent.Status = EventStatus.Cancelled;
                    existingEvent.Publish = false;
                    await _unitOfWork.EventRepository.UpdateAsync(existingEvent);
                    _logger.LogInformation("Refunds, ticket cancellations, and quantity reversions processed for event {EventId}. Cancelled {TicketCount} tickets, reverted {TotalTickets} ticket quantities", 
                        eventId, ticketsToUpdate.Count, totalTicketsToRevert);
                    return Result.Success();
                });
 
                if (bookingsForNotification.Any())
                {
                    var notificationTasks = new List<Task>();
                    foreach (var bookingInfo in bookingsForNotification)
                    {
                        if (bookingInfo.UserId != Guid.Empty)
                        {
                            var notificationRequest = new CreateNotificationRequest
                            {
                                UserId = bookingInfo.UserId,
                                Title = "Sự kiện đã bị hủy - Hoàn tiền",
                                Message = $"Sự kiện <strong>{eventTitle}</strong> đã bị hủy.{(string.IsNullOrEmpty(reasonCancel) ? "" : $" Lý do: {reasonCancel}")} Số tiền <strong>{bookingInfo.TotalAmount:N0} VNĐ</strong> đã được hoàn vào ví của bạn.",
                                Type = NotificationType.Refund, 
                                EventId = eventId
                            };

                            notificationTasks.Add(_notificationService.CreateNotificationAsync(notificationRequest));
                        }
                    }

                    await Task.WhenAll(notificationTasks);
                    _logger.LogInformation("Sent refund notifications to {UserCount} users for cancelled event {EventId}", bookingsForNotification.Count, eventId);
                }

                await _pineconeVectorService.DeleteVectorAsync(eventId.ToString(), isUser: false);

                _logger.LogInformation("Deleted vector event {EventId}", eventId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing cancel event {EventId}", eventId);
                throw;
            }
        }

        public async Task EnqueueInviteEmail(InviteFriendEmail request)
        {
            BackgroundJob.Enqueue(() => ProcessInviteEmailAsync(request));
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessInviteEmailAsync(InviteFriendEmail request)
        {
            var sb = new StringBuilder();
            if (!string.IsNullOrEmpty(request.EventFirstImage))
                sb.AppendLine($"<img src='{request.EventFirstImage}' alt='Event' style='width:100%;max-width:600px;border-radius:8px;margin-bottom:20px;'/>");

            sb.AppendLine($"<p>Xin chào {request.InvitedUserFullName},</p>")
              .AppendLine($"<p>Bạn được <strong>{request.InviterFullName}</strong> mời tham gia sự kiện <b>{request.EventTitle}</b>.</p>")
              .AppendLine($"<p><em>\"{request.Message}\"</em></p>")
              .AppendLine("<p>Nhấn để xem chi tiết:</p>")
              .AppendLine($"<p><a href=\"https://ai-event-alpha.vercel.app/event/{request.EventId}\">Xem sự kiện</a></p>")
              .AppendLine("<p>Trân trọng,<br/>AIEvent Team</p>");

            var message = new MimeMessage
            {
                Subject = $"Mời tham gia: {request.EventTitle}",
                Body = new TextPart("html") { Text = sb.ToString() }
            };

            await _emailService.SendEmailAsync(request.InvitedUserEmail!, message);
        }

        public async Task EnqueueConfirmEmail(ConfirmInvitationEmail request) 
        {
            BackgroundJob.Enqueue(() => ProcessConfirmEmailInvationAsync(request));
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessConfirmEmailInvationAsync(ConfirmInvitationEmail request)
        {
            var action = request.Status == ConfirmStatus.Approved ? "chấp nhận" : "từ chối";

            var sb = new StringBuilder();

            if (!string.IsNullOrEmpty(request.EventFirstImage))
                sb.AppendLine($"<img src='{request.EventFirstImage}' alt='Event' style='width:100%;max-width:600px;border-radius:8px;margin-bottom:20px;'/>");

            sb.AppendLine($"<p>Xin chào {request.InviterFullName},</p>")
              .AppendLine($"<p><strong>{request.InvitedUserFullName}</strong> đã <strong>{action}</strong> lời mời tham gia sự kiện <b>{request.EventTitle}</b>.</p>")
              .AppendLine($"<p><em>\"{request.Message}\"</em></p>")
              .AppendLine($"<p><a href=\"https://ai-event-alpha.vercel.app/event/{request.EventId}\">Xem sự kiện</a></p>")
              .AppendLine("<p>Trân trọng,<br/>AIEvent Team</p>");

            var message = new MimeMessage
            {
                Subject = $"[Cập nhật] {request.InvitedUserFullName} đã {action} lời mời",
                Body = new TextPart("html") { Text = sb.ToString() }
            };

            await _emailService.SendEmailAsync(request.InviterEmail!, message);
        }

        //Embedding user
        public async Task EnqueueUserEmbeddingJobAsync(Guid userId)
        {
            BackgroundJob.Enqueue(() => GenerateAndStoreUserEmbeddingAsync(userId));
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateAndStoreUserEmbeddingAsync(Guid userId)
        {
            try
            {
                var user = await _unitOfWork.UserRepository.Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning("UserEmbeddingJob: User {UserId} not found.", userId);
                    return;
                }

                var description = BuildUserProfileText(user);

                var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(description);

                var interests = ParseJsonList(user.UserInterestsJson);
                var favoriteEvents = ParseJsonList(user.FavoriteEventTypesJson);
                var skills = ParseJsonList(user.ProfessionalSkillsJson);

                var metadata = new Dictionary<string, object>
                {
                    ["FullName"] = user.FullName ?? "",
                    ["Occupation"] = user.Occupation ?? "",
                    ["JobTitle"] = user.JobTitle ?? "",
                    ["CareerGoal"] = user.CareerGoal ?? "",
                    ["District"] = user.District ?? "",
                    ["BudgetOption"] = user.BudgetOption.ToString(),
                    ["ParticipationFrequency"] = user.ParticipationFrequency.ToString(),
                    ["ExperienceLevel"] = user.Experience?.ToString() ?? "",
                    ["Interests"] = interests,
                    ["FavoriteEventTypes"] = favoriteEvents,
                    ["Skills"] = skills,
                    ["Languages"] = user.LanguagesJson ?? "[]",
                    ["Introduction"] = user.Introduction ?? "",
                };

                await _pineconeVectorService.UpsertVectorAsync(user.Id.ToString(), embedding, isUser: true, metadata);

                _logger.LogInformation("Embedding stored successfully for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating embedding for user {UserId}", userId);
                throw;
            }
        }

        private string BuildUserProfileText(User user)
        {
            var interests = ParseJsonList(user.UserInterestsJson);
            var favoriteEvents = ParseJsonList(user.FavoriteEventTypesJson);
            var skills = ParseJsonList(user.ProfessionalSkillsJson);

            return $@"
                User Profile:
                - Name: {user.FullName}
                - Occupation: {user.Occupation}
                - Job Title: {user.JobTitle}
                - Career Goal: {user.CareerGoal}
                - Address: {user.Address}, {user.District}
                - Budget Option: {user.BudgetOption}
                - Participation Frequency: {user.ParticipationFrequency}
                - Interests: {string.Join(", ", interests)}
                - Favorite Event Types: {string.Join(", ", favoriteEvents)}
                - Skills: {string.Join(", ", skills)}
                - Introduction: {user.Introduction}
                - Experience Level: {user.Experience}
                ";
        }

        private static List<string> ParseJsonList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();

            try
            {
                var objList = JsonSerializer.Deserialize<List<UserInterest>>(json);
                if (objList == null)
                    return new List<string>();

                return objList
                    .Where(i => !string.IsNullOrWhiteSpace(i.InterestName))
                    .Select(i => i.InterestName!.Trim())
                    .Distinct()
                    .ToList();
            }
            catch
            {
                return new List<string>();
            }
        }


        // embedding new event
        public async Task EnqueueEmbedNewEventJobAsync(Guid eventId)
        {
            BackgroundJob.Enqueue(() => EmbedNewEventAsync(eventId));
            await Task.CompletedTask;
        }

        public async Task EmbedNewEventAsync(Guid eventId)
        {
            var eventEntity = await _unitOfWork.EventRepository
                .Query()
                .AsNoTracking()
                .Include(e => e.EventCategory)
                .Include(e => e.EventTags)
                .Include(e => e.TicketTypes)
                .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted && e.Status == EventStatus.Approved);

            if (eventEntity == null)
            {
                _logger.LogWarning("EventEmbeddingJob: Event {EventId} not found.", eventId);
                return;
            }

            var categoryName = eventEntity.EventCategory?.CategoryName ?? "Không rõ";
            var tagNames = eventEntity.EventTags?.Select(et => et.Tag?.NameTag).Where(n => !string.IsNullOrWhiteSpace(n)).ToList() ?? new();
            var ticketInfos = eventEntity.TicketTypes?.Select(t => $"{t.TicketName}: {t.TicketPrice:N0} VND").ToList() ?? new();

            var content = $@"
                Sự kiện: {eventEntity.Title}
                Mô tả: {eventEntity.Description}
                Danh mục: {categoryName}
                Thẻ: {(tagNames.Count > 0 ? string.Join(", ", tagNames) : "Không có")}
                Địa điểm: {eventEntity.LocationName ?? eventEntity.Address ?? "Không rõ"}
                Quận/Huyện: {eventEntity.District ?? "Không rõ"}
                Thời gian bắt đầu: {eventEntity.StartTime:dd/MM/yyyy HH:mm}
                Thời gian kết thúc: {eventEntity.EndTime:dd/MM/yyyy HH:mm}
                Các loại vé:
                {(ticketInfos.Count > 0 ? string.Join("\n", ticketInfos) : "Không có vé")}
            ";

            try
            {
                var embedding = await _voyageEmbeddingService.GetEmbeddingAsync(content);

                var vector = new PineconeVector
                {
                    Id = eventEntity.Id.ToString(),
                    Values = embedding,
                    Metadata = new Dictionary<string, object>
                    {
                        ["EventId"] = eventEntity.Id.ToString(),
                        ["Title"] = eventEntity.Title,
                        ["Description"] = eventEntity.Description,
                        ["CategoryName"] = categoryName,
                        ["Tags"] = string.Join(", ", tagNames),
                        ["LocationName"] = eventEntity.LocationName ?? "",
                        ["District"] = eventEntity.District ?? "",
                        ["Address"] = eventEntity.Address ?? "",
                        ["StartTime"] = eventEntity.StartTime,
                        ["EndTime"] = eventEntity.EndTime,
                        ["Tickets"] = string.Join(", ", ticketInfos)
                    }
                };

                await _pineconeVectorService.UpsertVectorAsync(new[] { vector }, isUser: false);

                _logger.LogInformation("Embedding stored successfully for Event {EventId}", eventEntity.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating embedding for event {EventId}", eventEntity.Id);
            }
        }
    }
} 
