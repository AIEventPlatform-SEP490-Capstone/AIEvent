using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.Notification; 
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

        public HangfireJobService(
        IPdfService pdfService,
        IEmailService emailService,
        ILogger<HangfireJobService> logger,
        IUnitOfWork unitOfWork, 
        ITransactionHelper transactionHelper,
        INotificationService notificationService,
        IVoyageEmbeddingService voyageEmbeddingService,
        IPineconeVectorService pineconeVectorService)
        {
            _pdfService = pdfService;
            _emailService = emailService;
            _logger = logger;
            _unitOfWork = unitOfWork; 
            _transactionHelper = transactionHelper;
            _notificationService = notificationService;
            _pineconeVectorService = pineconeVectorService;
            _voyageEmbeddingService = voyageEmbeddingService;
        }

        // send ticket to email
        public async Task EnqueueSendTicketEmailJobAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets)
        {
            BackgroundJob.Enqueue(() => GenerateAndSendTicketEmailAsync(userEmail, userFullName, eventTitle, tickets));
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateAndSendTicketEmailAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets)
        {
            try
            {
                // Sinh file PDF
                var pdfBytes = await _pdfService.GenerateTicketsPdfAsync(tickets, eventTitle, userFullName, userEmail);

                // Gửi email
                await _emailService.SendTicketsEmailAsync(
                    userEmail,
                    $"Your Tickets from AIEvent - {eventTitle}",
                    null!,
                    pdfBytes,
                    $"{userFullName}-AIEvent",
                    eventTitle
                );

                _logger.LogInformation("Sent ticket email for {UserEmail} ({EventTitle})", userEmail, eventTitle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending ticket email for {UserEmail} ({EventTitle})", userEmail, eventTitle);
                throw;
            }
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
                                Channel = NotificationChannel.InApp,
                                EventId = eventId
                            };

                            notificationTasks.Add(_notificationService.CreateNotificationAsync(notificationRequest));
                        }
                    }

                    await Task.WhenAll(notificationTasks);
                    _logger.LogInformation("Sent refund notifications to {UserCount} users for cancelled event {EventId}", bookingsForNotification.Count, eventId);
                }

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
              .AppendLine($"<p><a href=\"https/events/{request.EventId}\">Xem sự kiện</a></p>")
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
              .AppendLine($"<p><a href=\"https/events/{request.EventId}\">Xem sự kiện</a></p>")
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

                var metadata = new Dictionary<string, object>
                {
                    ["UserId"] = user.Id.ToString(),
                    ["FullName"] = user.FullName ?? "",
                    ["Occupation"] = user.Occupation ?? "",
                    ["JobTitle"] = user.JobTitle ?? "",
                    ["CareerGoal"] = user.CareerGoal ?? "",
                    ["District"] = user.District ?? "",
                    ["BudgetOption"] = user.BudgetOption.ToString(),
                    ["ParticipationFrequency"] = user.ParticipationFrequency.ToString(),
                    ["ExperienceLevel"] = user.Experience?.ToString() ?? "",
                    ["Interests"] = user.UserInterestsJson ?? "[]",
                    ["FavoriteEventTypes"] = user.FavoriteEventTypesJson ?? "[]",
                    ["Skills"] = user.ProfessionalSkillsJson ?? "[]",
                    ["Languages"] = user.LanguagesJson ?? "[]",
                    ["Introduction"] = user.Introduction ?? "",
                };

                await _pineconeVectorService.UpsertVectorAsync(user.Id.ToString(), embedding, metadata);

                _logger.LogInformation("✅ Embedding stored successfully for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generating embedding for user {UserId}", userId);
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
                return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }

    }
} 
