using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
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
        private readonly ITicketSignatureService _ticketSignatureService;
        private readonly IHangfireJobService _hangfireJobService;

        public BookingService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IQrCodeService qrCodeService,
            ITicketSignatureService ticketSignatureService,  IHangfireJobService hangfireJobService)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _qrCodeService = qrCodeService;
            _ticketSignatureService = ticketSignatureService;
            _hangfireJobService = hangfireJobService;
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
                                          && e.RequireApproval == ConfirmEventStatus.Approve && e.Publish == true);
            if (eventEntity == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            if (eventEntity.OrganizerProfile?.UserId == null)
                return ErrorResponse.FailureResult("Organizer not found", ErrorCodes.NotFound);

            if (DateTime.UtcNow > eventEntity.SaleEndTime || DateTime.UtcNow < eventEntity.SaleStartTime)
                return ErrorResponse.FailureResult("Ticket sales period has passed or not yet come", ErrorCodes.InvalidInput);

            var ticketTypeIds = request.TicketTypeRequests.Select(x => x.TicketTypeId).Distinct().ToList();
            var ticketTypes = await _unitOfWork.TicketTypeRepository.Query()
                .Where(t => ticketTypeIds.Contains(t.Id))
                .ToDictionaryAsync(x => x.Id);
            if (ticketTypes.Count != ticketTypeIds.Count)
                return ErrorResponse.FailureResult("One or more ticket types are invalid", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
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
                int totalTicketsCount = 0;
                var bookingItems = new List<BookingItem>();
                var tickets = new List<Ticket>();

                foreach (var item in request.TicketTypeRequests)
                {
                    if (!ticketTypes.TryGetValue(item.TicketTypeId, out var ticketType))
                        return ErrorResponse.FailureResult("Invalid ticket type", ErrorCodes.InvalidInput);

                    if (item.Quantity <= 0)
                        return ErrorResponse.FailureResult("Quantity must be greater than 0", ErrorCodes.InvalidInput);

                    var rows = await _unitOfWork.ExecuteSqlRawAsync(
                    @"UPDATE TicketTypes
                      SET RemainingQuantity = RemainingQuantity - {0},
                          SoldQuantity = SoldQuantity + {0},
                          UpdatedAt = GETUTCDATE(),
                          UpdatedBy = {2}
                      WHERE Id = {1} AND RemainingQuantity >= {0}",
                    item.Quantity, item.TicketTypeId, userId.ToString());

                    if (rows == 0)
                    {
                        return ErrorResponse.FailureResult($"Not enough tickets for type {ticketType.TicketName}", ErrorCodes.InvalidInput);
                    }

                    var itemTotal = ticketType.TicketPrice * item.Quantity;
                    totalAmount += itemTotal;
                    totalTicketsCount += item.Quantity;

                    var bookingItem = new BookingItem
                    {
                        BookingId = booking.Id,
                        TicketTypeId = ticketType.Id,
                        Quantity = item.Quantity,
                        UnitPrice = ticketType.TicketPrice,
                        TotalPrice = itemTotal
                    };
                    bookingItems.Add(bookingItem);

                    tickets.AddRange(Enumerable.Range(0, item.Quantity).Select(i => new Ticket
                    {
                        UserId = userId,
                        BookingItemId = bookingItem.Id,
                        TicketTypeId = ticketType.Id,
                        TicketCode = $"EVT{DateTime.UtcNow:yy}{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                        Status = TicketStatus.Valid,
                        EventName = eventEntity.Title,
                        StartTime = eventEntity.StartTime,
                        EndTime = eventEntity.EndTime,
                        Address = eventEntity.Address,
                        Price = bookingItem.UnitPrice,
                        QrCodeUrl = string.Empty,
                    }));
                }

                var eventRows = await _unitOfWork.ExecuteSqlRawAsync(
                @"UPDATE Events
                  SET RemainingTickets = RemainingTickets - {0},
                      SoldQuantity = SoldQuantity + {0},
                      TotalAmount = TotalAmount + {1},
                      UpdatedAt = GETUTCDATE(),
                      UpdatedBy = {3}
                  WHERE Id = {2} AND RemainingTickets >= {0}",
                totalTicketsCount, totalAmount, eventEntity.Id, userId.ToString());

                if (eventRows == 0)
                {
                    return ErrorResponse.FailureResult("Not enough tickets for the event", ErrorCodes.InvalidInput);
                }

                await _unitOfWork.BookingItemRepository.AddRangeAsync(bookingItems);

                var qrContents = tickets.Select(t =>
                {
                    var signature = _ticketSignatureService.CreateSignature(t.TicketCode);
                    return $"{t.TicketCode}|{signature}";
                }).ToList();
                var qrResult = await _qrCodeService.GenerateQrBytesAndUrlsAsync(qrContents);

                for (int i = 0; i < tickets.Count; i++)
                {
                    tickets[i].QrCodeUrl = qrResult.Urls[qrContents[i]];
                }
                await _unitOfWork.TicketRepository.AddRangeAsync(tickets);

                booking.TotalAmount = totalAmount;

                await _unitOfWork.SaveChangesAsync();

                if (totalAmount > 0)
                {
                    var walletUser = await _unitOfWork.WalletRepository.Query()
                        .FirstOrDefaultAsync(w => w.UserId == userId && !w.IsDeleted);

                    if (walletUser == null)
                        return ErrorResponse.FailureResult("Wallet user not found", ErrorCodes.NotFound);

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
                        TransactionType = TransactionType.Payment,
                        CompletedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.PaymentTransactionRepository.AddAsync(payment);

                    WalletTransaction walletTransaction = new()
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
                    };

                    await _unitOfWork.WalletTransactionRepository.AddAsync(walletTransaction);

                    walletUser.Balance -= totalAmount;
                    await _unitOfWork.WalletRepository.UpdateAsync(walletUser);

                    booking.PaymentStatus = PaymentStatus.Paid;
                }
                else
                {
                    booking.PaymentStatus = PaymentStatus.Paid;
                }

                booking.TotalAmount = totalAmount;
                booking.Status = BookingStatus.Completed;
                booking.PaymentMethod = PaymentMethod.Wallet;
                await _unitOfWork.BookingRepository.UpdateAsync(booking);

                var ticketData = tickets.Select((t, idx) => new TicketForPdf
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
                    QrBytes = qrResult.Bytes[qrContents[idx]]
                }).ToList();

                await _hangfireJobService.EnqueueSendTicketEmailJobAsync(
                    user.Email!,
                    user.FullName!,
                    eventEntity.Title,
                    ticketData
                );

                return Result.Success();
            });
        }


        public async Task<Result<BasePaginated<ListEventOfUser>>> GetListEventOfUser(
            int pageNumber,
            int pageSize,
            Guid userId,
            string? title,
            DateTime? startTime,
            DateTime? endTime)
        {
            var query = _unitOfWork.BookingItemRepository
                .Query(false)
                .AsNoTracking()
                .Where(bi => bi.Booking.UserId == userId &&
                             !bi.DeletedAt.HasValue &&
                             !bi.Booking.DeletedAt.HasValue &&
                             bi.Booking.Event != null)
                .Select(bi => new
                {
                    bi.Booking.Event.Id,
                    bi.Booking.Event.Title,
                    bi.Booking.Event.StartTime,
                    bi.Booking.Event.EndTime,
                    bi.Booking.Event.Address,
                    bi.Booking.Event.ImgListEvent,
                    bi.Quantity
                });

            if (!string.IsNullOrWhiteSpace(title))
                query = query.Where(x => x.Title.Contains(title));

            if (startTime.HasValue)
                query = query.Where(x => x.StartTime >= startTime.Value);

            if (endTime.HasValue)
                query = query.Where(x => x.EndTime <= endTime.Value);

            var groupedQuery = query
                .GroupBy(x => new
                {
                    x.Id,
                    x.Title,
                    x.StartTime,
                    x.EndTime,
                    x.Address,
                    x.ImgListEvent
                })
                .Select(g => new
                {
                    EventId = g.Key.Id,
                    g.Key.Title,
                    g.Key.StartTime,
                    g.Key.EndTime,
                    g.Key.Address,
                    g.Key.ImgListEvent,
                    TotalTickets = g.Sum(x => x.Quantity)
                });

            var totalCount = await groupedQuery.CountAsync();

            var rawData = await groupedQuery
                .OrderByDescending(x => x.StartTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var pageData = rawData.Select(e => new ListEventOfUser
            {
                EventId = e.EventId,
                Title = e.Title,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Address = e.Address,
                TotalTickets = e.TotalTickets,
                Image = ParseFirstImageFromJson(e.ImgListEvent),
            }).ToList();

            var result = new BasePaginated<ListEventOfUser>(
                pageData,
                totalCount,
                pageNumber,
                pageSize
            );

            return Result<BasePaginated<ListEventOfUser>>.Success(result);
        }


        public async Task<Result<BasePaginated<TicketByEventResponse>>> GetTicketsByEventAsync(Guid userId, string id, int pageNumber, int pageSize)
        {
            if (!Guid.TryParse(id, out var eventId))
                return ErrorResponse.FailureResult("Invalid ticket ID format", ErrorCodes.InvalidInput);

            var query = _unitOfWork.TicketRepository
                .Query(false)
                .AsNoTracking()
                .Where(t => !t.DeletedAt.HasValue &&
                            t.UserId == userId &&
                            t.TicketType.EventId == eventId);

            var groupedQuery = query
                .GroupBy(t => new
                {
                    t.TicketTypeId,
                    t.TicketType.TicketName,
                    t.TicketType.TicketPrice
                })
                .Select(g => new TicketByEventResponse
                {
                    TicketTypeName = g.Key.TicketName,
                    Price = g.Key.TicketPrice,
                    Quantity = g.Count(),
                    Tickets = g.Select(x => new TicketItemResponse
                    {
                        TicketId = x.Id,
                        TicketCode = x.TicketCode,
                        Status = x.Status,
                        CreatedAt = x.CreatedAt
                    }).ToList()
                });

            var totalCount = await groupedQuery.CountAsync();

            var pageData = await groupedQuery
                .OrderByDescending(g => g.TicketTypeName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new BasePaginated<TicketByEventResponse>(pageData, totalCount, pageNumber, pageSize);

            return Result<BasePaginated<TicketByEventResponse>>.Success(result);
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
                .Where(t => t.Id == ticketId && t.UserId == userId && !t.IsDeleted && t.Status == TicketStatus.Valid)
                .Select(t => t.QrCodeUrl)
                .FirstOrDefaultAsync();

            if (qrCodeUrl == null)
            {
                return ErrorResponse.FailureResult("Ticket not found", ErrorCodes.NotFound);
            }

            return Result<QrResponse>.Success(new QrResponse { QrCode = qrCodeUrl });
        }

        public async Task<Result<CheckInResponse>> CheckInTicketAsync(string qrContent)
        {
            if (string.IsNullOrWhiteSpace(qrContent))
                return ErrorResponse.FailureResult("QR content is empty", ErrorCodes.InvalidInput);

            var parts = qrContent.Split('|');
            if (parts.Length != 2)
                return ErrorResponse.FailureResult("Invalid QR format", ErrorCodes.InvalidInput);

            var ticketCode = parts[0];
            var signature = parts[1];

            //Xác minh chữ ký
            if (!_ticketSignatureService.ValidateSignature(ticketCode, signature))
                return ErrorResponse.FailureResult("Invalid or tampered QR code", ErrorCodes.InvalidInput);

            var ticket = await _unitOfWork.TicketRepository
                .Query()
                .Include(t => t.User)
                .Include(t => t.TicketType)
                .FirstOrDefaultAsync(t => t.TicketCode == ticketCode && !t.DeletedAt.HasValue);

            if (ticket == null)
                return ErrorResponse.FailureResult("Ticket not found", ErrorCodes.NotFound);

            if (ticket.Status != TicketStatus.Valid)
                return ErrorResponse.FailureResult("Ticket already checked in", ErrorCodes.InvalidInput);

            if (ticket.EndTime < DateTime.UtcNow)
                return ErrorResponse.FailureResult("Event already ended", ErrorCodes.InvalidInput);

            ticket.Status = TicketStatus.Used;

            await _unitOfWork.TicketRepository.UpdateAsync(ticket);
            await _unitOfWork.SaveChangesAsync();

            return Result<CheckInResponse>.Success(new CheckInResponse()
            {
                TicketCode = ticketCode,
                FullName = ticket.User.FullName!,
                EventName = ticket.EventName,
                TicketTypeName = ticket.TicketType.TicketName,
                Status = ticket.Status,
                CheckInAt = DateTime.UtcNow,
            });
        }

    }
}
