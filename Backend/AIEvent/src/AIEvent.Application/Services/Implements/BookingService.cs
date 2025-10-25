using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class BookingService : IBookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IQrCodeService _qrCodeService;
        private readonly ITicketTokenService _ticketTokenService;
        private readonly IPdfService _pdfService;
        private readonly IEmailService _emailService;

        public BookingService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IQrCodeService qrCodeService,
            ITicketTokenService ticketTokenService, IPdfService pdfService, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _qrCodeService = qrCodeService;
            _ticketTokenService = ticketTokenService;
            _pdfService = pdfService;
            _emailService = emailService;

        }

        public async Task<Result> CreateBookingAsync(Guid userId, CreateBookingRequest request)
        {
            var user = await _unitOfWork.UserRepository.Query()
                .AsNoTracking()
                .Select(u => new { u.Id, u.FullName, u.Email, u.IsDeleted, u.IsActive })
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);
            if (user == null)
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

            var eventEntity = await _unitOfWork.EventRepository
                .Query()
                .Include(u => u.OrganizerProfile)
                .FirstOrDefaultAsync(e => e.Id == request.EventId && !e.IsDeleted
                                          && e.RequireApproval == ConfirmStatus.Approve && e.Publish == true);
            if (eventEntity == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            if (DateTime.UtcNow >= eventEntity.EndTime)
                return ErrorResponse.FailureResult("The event has ended", ErrorCodes.InvalidInput);

            var ticketTypeIds = request.TicketTypeRequests.Select(x => x.TicketTypeId).Distinct().ToList();
            var ticketTypes = await _unitOfWork.TicketDetailRepository.Query()
                .Where(t => ticketTypeIds.Contains(t.Id))
                .ToDictionaryAsync(x => x.Id);
            if (ticketTypes.Count != ticketTypeIds.Count)
                return ErrorResponse.FailureResult("One or more ticket types are invalid", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                // Create Booking 
                var booking = new Booking
                {
                    UserId = userId,
                    EventId = request.EventId,
                    Status = BookingStatus.Pending,
                    PaymentStatus = PaymentStatus.Unpaid,
                    PaymentMethod = PaymentMethod.Wallet,
                    TotalAmount = 0m,
                };
                await _unitOfWork.BookingRepository.AddAsync(booking);

                decimal totalAmount = 0m;
                var bookingItems = new List<BookingItem>();
                var tickets = new List<Ticket>();
                var ticketTypesToUpdate = new List<TicketDetail>();

                foreach (var item in request.TicketTypeRequests)
                {
                    if (!ticketTypes.TryGetValue(item.TicketTypeId, out var ticketType))
                        return ErrorResponse.FailureResult("Invalid ticket type", ErrorCodes.InvalidInput);

                    if (ticketType.RemainingQuantity < item.Quantity)
                        return ErrorResponse.FailureResult($"Not enough tickets for type {ticketType.TicketName}", ErrorCodes.InvalidInput);

                    var itemTotal = ticketType.TicketPrice * item.Quantity;

                    var bookingItem = new BookingItem
                    {
                        BookingId = booking.Id,
                        TicketTypeId = ticketType.Id,
                        Quantity = item.Quantity,
                        UnitPrice = ticketType.TicketPrice,
                        TotalPrice = itemTotal
                    };
                    bookingItems.Add(bookingItem);

                    totalAmount += itemTotal;

                    // Batch create tickets
                    tickets.AddRange(Enumerable.Range(0, item.Quantity).Select(i => new Ticket
                    {
                        UserId = userId,
                        BookingItemId = bookingItem.Id,
                        TicketTypeId = ticketType.Id,
                        TicketCode = Guid.NewGuid().ToString("N")[..10].ToUpper(),
                        Status = TicketStatus.Valid,
                        EventName = eventEntity.Title,
                        StartTime = eventEntity.StartTime,
                        EndTime = eventEntity.EndTime,
                        Address = eventEntity.Address,
                        Price = bookingItem.UnitPrice,
                        QrCodeUrl = string.Empty,
                    }));

                    ticketType.RemainingQuantity -= item.Quantity;
                    ticketType.SoldQuantity += item.Quantity;
                    ticketType.SetUpdated(userId.ToString());
                    ticketTypesToUpdate.Add(ticketType);
                }

                // Update event quantities once
                eventEntity.RemainingTickets -= tickets.Count;
                eventEntity.SoldQuantity += tickets.Count;

                // Batch updates
                await _unitOfWork.TicketDetailRepository.UpdateRangeAsync(ticketTypesToUpdate);
                await _unitOfWork.EventRepository.UpdateAsync(eventEntity);
                await _unitOfWork.BookingItemRepository.AddRangeAsync(bookingItems);
                await _unitOfWork.TicketRepository.AddRangeAsync(tickets);
                await _unitOfWork.SaveChangesAsync();

                // Payment handling 
                if (totalAmount > 0)
                {
                    var walletUserIds = new[] { userId, eventEntity.OrganizerProfile!.UserId };
                    var wallets = await _unitOfWork.WalletRepository.Query()
                        .Where(w => walletUserIds.Contains(w.UserId) && !w.IsDeleted)
                        .ToListAsync();

                    var walletUser = wallets.FirstOrDefault(w => w.UserId == userId);
                    var walletOrg = wallets.FirstOrDefault(w => w.UserId == eventEntity.OrganizerProfile!.UserId);


                    if (walletUser == null)
                        return ErrorResponse.FailureResult("Wallet user not found", ErrorCodes.NotFound);

                    if (eventEntity.OrganizerProfile?.UserId == null)
                        return ErrorResponse.FailureResult("Organizer not found", ErrorCodes.NotFound);

                    if (walletOrg == null)
                        return ErrorResponse.FailureResult("Wallet organizer not found", ErrorCodes.NotFound);

                    if (walletUser.Balance < totalAmount)
                        return ErrorResponse.FailureResult("Not enough money in wallet", ErrorCodes.InvalidInput);

                    PaymentTransaction payment = new()
                    {
                        BookingId = booking.Id,
                        UserId = userId,
                        Amount = totalAmount,
                        PaymentMethod = PaymentMethod.Wallet,
                        Status = TransactionStatus.Success,
                        Description = $"Thanh toán vé sự kiện '{eventEntity.Title}'",
                        CompletedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.PaymentTransactionRepository.AddAsync(payment);

                    var walletTrans = new List<WalletTransaction>
                    {
                        new()
                        {
                            WalletId = walletUser.Id,
                            Amount = totalAmount,
                            BalanceBefore = walletUser.Balance,
                            BalanceAfter = walletUser.Balance - totalAmount,
                            Type = TransactionType.Payment,
                            Direction = TransactionDirection.Out,
                            ReferenceId = payment.Id,
                            ReferenceType = ReferenceType.Booking,
                            Status = TransactionStatus.Success,
                            Description = $"Thanh toán vé sự kiện '{eventEntity.Title}'"
                        },
                        new()
                        {
                            WalletId = walletOrg.Id,
                            Amount = totalAmount,
                            BalanceBefore = walletOrg.Balance,
                            BalanceAfter = walletOrg.Balance + totalAmount,
                            Type = TransactionType.Payment,
                            Direction = TransactionDirection.In,
                            ReferenceId = payment.Id,
                            ReferenceType = ReferenceType.Booking,
                            Status = TransactionStatus.Success,
                            Description = $"{user.FullName} thanh toán vé sự kiện '{eventEntity.Title}'",
                        }
                    };
                    await _unitOfWork.WalletTransactionRepository.AddRangeAsync(walletTrans);

                    walletUser.Balance -= totalAmount;
                    walletOrg.Balance += totalAmount;
                    await _unitOfWork.WalletRepository.UpdateRangeAsync(new[] { walletUser, walletOrg });
                }
                else
                {
                    booking.PaymentStatus = PaymentStatus.Paid;
                }

                // Update booking
                booking.TotalAmount = totalAmount;
                booking.PaymentStatus = PaymentStatus.Paid;
                await _unitOfWork.BookingRepository.UpdateAsync(booking);

                // Generate QR contents and bytes
                var qrContents = tickets.Select(t => _ticketTokenService.CreateTicketToken(t.Id)).ToList();
                var qrResult = await _qrCodeService.GenerateQrBytesAndUrlsAsync(qrContents);

                // Update tickets with QrCodeUrl
                for (int i = 0; i < tickets.Count; i++)
                {
                    tickets[i].QrCodeUrl = qrResult.Urls[qrContents[i]];
                }
                await _unitOfWork.TicketRepository.UpdateRangeAsync(tickets);
                await _unitOfWork.SaveChangesAsync();

                // Prepare ticket data for PDF/email
                var ticketData = tickets.Select(t => new TicketForPdf
                {
                    TicketCode = t.TicketCode,
                    EventName = t.EventName,
                    CustomerName = user.FullName!,
                    TicketType = ticketTypes[t.TicketTypeId].TicketName,
                    Price = t.Price,
                    QrUrl = t.QrCodeUrl, 
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                    Address = t.Address!,
                    QrBytes = qrResult.Bytes[qrContents[tickets.IndexOf(t)]] 
                }).ToList();

                // Generate PDF with bytes
                var pdfBytes = await _pdfService.GenerateTicketsPdfAsync(ticketData, eventEntity.Title, user.FullName!, user.Email!);

                // Send email
                await _emailService.SendTicketsEmailAsync(
                    user.Email!,
                    $"Your Tickets from AIEvent - {eventEntity.Title}",
                    null!,
                    pdfBytes,
                    $"{user.FullName}-AIEvent",
                    eventEntity.Title
                );

                return Result.Success();
            });
        }


        public async Task<Result<BasePaginated<TicketResponse>>> GetListTicketAsync(int pageNumber, int pageSize, Guid userId, string? title,
                                                                                    DateTime? startTime, DateTime? endTime, TicketStatus? status)
        {
            var query = _unitOfWork.TicketRepository
                .Query()
                .AsNoTracking()
                .Include(t => t.TicketType)
                    .ThenInclude(tt => tt.Event)
                .Where(t => !t.DeletedAt.HasValue && t.UserId == userId);

            if (!string.IsNullOrWhiteSpace(title))
                query = query.Where(t => t.EventName.Contains(title));

            if (status.HasValue)
                query = query.Where(t => t.Status == status);

            if (startTime.HasValue)
                query = query.Where(t => t.StartTime >= startTime.Value);

            if (endTime.HasValue)
                query = query.Where(t => t.EndTime <= endTime.Value);

            var totalCount = await query.CountAsync();

            var pageData = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.Id,
                    t.EventName,
                    t.Address,
                    t.StartTime,
                    t.EndTime,
                    t.Status,
                    ImgListEvent = t.TicketType.Event.ImgListEvent
                })
                .ToListAsync();

            var result = pageData.Select(p => new TicketResponse
            {
                TicketId = p.Id,
                EventName = p.EventName,
                Address = p.Address!,
                StartTime = p.StartTime,
                EndTime = p.EndTime,
                Status = p.Status,
                EventImage = ParseFirstImageFromJson(p.ImgListEvent)
            }).ToList();

            return new BasePaginated<TicketResponse>(result, totalCount, pageNumber, pageSize);
        }

        private string? ParseFirstImageFromJson(string? imgListJson)
        {
            if (string.IsNullOrWhiteSpace(imgListJson))
                return null;

            try
            {
                var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(imgListJson);
                return list?.FirstOrDefault();
            }
            catch
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(imgListJson);
                    if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                        return doc.RootElement[0].GetString();
                }
                catch { }
            }
            return null;
        }


        public async Task<Result<QrResponse>> GetQrCodeAsync(Guid userId, string id)
        {
            if (!Guid.TryParse(id, out var ticketId))
                return ErrorResponse.FailureResult("Invalid ticket ID format", ErrorCodes.InvalidInput);

            var qrCodeUrl = await _unitOfWork.TicketRepository
                .Query()
                .AsNoTracking()
                .Where(t => t.Id == ticketId && t.UserId == userId && !t.IsDeleted)
                .Select(t => t.QrCodeUrl)
                .FirstOrDefaultAsync();

            if (qrCodeUrl == null)
            {
                return ErrorResponse.FailureResult("Ticket not found", ErrorCodes.NotFound);
            }

            return Result<QrResponse>.Success(new QrResponse { QrCode = qrCodeUrl });
        }

        public async Task<Result> RefundTicketAsync(Guid userId, string id)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (!Guid.TryParse(id, out var ticketId))
                    return ErrorResponse.FailureResult("Invalid ticket ID format", ErrorCodes.InvalidInput);

                var ticketData = await _unitOfWork.TicketRepository.Query()
                    .Include(t => t.User)
                    .Include(t => t.TicketType)
                        .ThenInclude(tt => tt.RefundRule!)
                            .ThenInclude(r => r.RefundRuleDetails)
                    .Include(t => t.TicketType.Event)
                        .ThenInclude(e => e.OrganizerProfile)
                    .Include(t => t.BookingItem)
                    .AsTracking()
                    .FirstOrDefaultAsync(t =>
                        t.Id == ticketId &&
                        t.UserId == userId &&
                        !t.IsDeleted &&
                        !t.TicketType.Event.IsDeleted);

                if (ticketData == null)
                    return ErrorResponse.FailureResult("Ticket not found", ErrorCodes.NotFound);

                var ticket = ticketData;
                var ticketType = ticket.TicketType;
                var eventEntity = ticketType.Event;
                var refundRule = ticketType.RefundRule;
                var now = DateTime.UtcNow;

                if (eventEntity.StartTime <= now)
                    return ErrorResponse.FailureResult("Cannot refund after event has started", ErrorCodes.InternalServerError);

                ticket.Status = TicketStatus.Refunded;

                ticketType.RemainingQuantity++;
                ticketType.SoldQuantity--;
                ticketType.SetUpdated(userId.ToString());
                eventEntity.RemainingTickets++;
                eventEntity.SoldQuantity--;

                decimal refundPrice = 0;
                decimal refundPercent = 0;

                if (refundRule != null && refundRule.RefundRuleDetails?.Any() == true)
                {
                    var refundDetail = refundRule.RefundRuleDetails
                        .FirstOrDefault(d =>
                            now >= eventEntity.StartTime.AddDays(-d.MaxDaysBeforeEvent!.Value) &&
                            now < eventEntity.StartTime.AddDays(-d.MinDaysBeforeEvent!.Value));


                    if (refundDetail == null)
                        return ErrorResponse.FailureResult("Refund rule not applicable for this time", ErrorCodes.InvalidInput);

                    refundPercent = refundDetail.RefundPercent ?? 0;
                    refundPrice = ticket.Price * refundPercent / 100;

                    var wallets = await _unitOfWork.WalletRepository.Query()
                        .Where(w =>
                            (w.UserId == userId || w.UserId == eventEntity.OrganizerProfile!.UserId)
                            && !w.IsDeleted)
                        .ToListAsync();

                    var userWallet = wallets.FirstOrDefault(w => w.UserId == userId);
                    var organizerWallet = wallets.FirstOrDefault(w => w.UserId == eventEntity.OrganizerProfile!.UserId);

                    if (userWallet == null || organizerWallet == null)
                        return ErrorResponse.FailureResult("Wallet not found", ErrorCodes.NotFound);

                    var paymentTransaction = new PaymentTransaction
                    {
                        UserId = userId,
                        BookingId = ticket.BookingItem.BookingId,
                        Amount = refundPrice,
                        PaymentMethod = PaymentMethod.Wallet,
                        Description = $"Hoàn {refundPercent}% tiền vé sự kiện '{eventEntity.Title}'",
                        CompletedAt = now,
                        Status = TransactionStatus.Success,
                    };

                    var walletTransactionUser = new WalletTransaction
                    {
                        WalletId = userWallet.Id,
                        Type = TransactionType.Refund,
                        Amount = refundPrice,
                        BalanceBefore = userWallet.Balance,
                        BalanceAfter = userWallet.Balance + refundPrice,
                        Status = TransactionStatus.Success,
                        Description = $"Hoàn {refundPercent}% tiền vé '{eventEntity.Title}'",
                        ReferenceId = paymentTransaction.Id,
                        ReferenceType = ReferenceType.Refund,
                        Direction = TransactionDirection.In,
                    };

                    var walletTransactionOrg = new WalletTransaction
                    {
                        WalletId = organizerWallet.Id,
                        Type = TransactionType.Refund,
                        Amount = refundPrice,
                        BalanceBefore = organizerWallet.Balance,
                        BalanceAfter = organizerWallet.Balance - refundPrice,
                        Status = TransactionStatus.Success,
                        Description = $"Hoàn {refundPercent}% tiền vé '{eventEntity.Title}' cho {ticket.User!.FullName}",
                        ReferenceId = paymentTransaction.Id,
                        ReferenceType = ReferenceType.Refund,
                        Direction = TransactionDirection.Out,
                    };

                    userWallet.Balance += refundPrice;
                    organizerWallet.Balance -= refundPrice;

                    await _unitOfWork.PaymentTransactionRepository.AddAsync(paymentTransaction);
                    await _unitOfWork.WalletTransactionRepository.AddRangeAsync(new[] { walletTransactionUser, walletTransactionOrg });
                }

                return Result.Success();
            });
        }
    }
}
