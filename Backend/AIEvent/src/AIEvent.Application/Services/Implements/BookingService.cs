using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
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
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository.Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);
                if (user == null)
                    return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);

                var eventEntity = await _unitOfWork.EventRepository.Query()
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

                // Create Booking 
                var booking = new Booking
                {
                    UserId = userId,
                    EventId = request.EventId,
                    Currency = "VND",
                    Status = BookingStatus.Pending,
                    PaymentStatus = PaymentStatus.Unpaid,
                    PaymentMethod = PaymentMethod.Wallet,
                    TotalAmount = 0m,
                };
                await _unitOfWork.BookingRepository.AddAsync(booking); 

                decimal totalAmount = 0m;
                var bookingItems = new List<BookingItem>();
                var tickets = new List<Ticket>();

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

                    // Tạo tickets tạm 
                    for (int i = 0; i < item.Quantity; i++)
                    {
                        tickets.Add(new Ticket
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
                        });
                    }

                    ticketType.RemainingQuantity -= item.Quantity;
                    ticketType.SoldQuantity += item.Quantity;
                    eventEntity.RemainingTickets -= item.Quantity;
                    eventEntity.SoldQuantity += item.Quantity;

                    await _unitOfWork.TicketDetailRepository.UpdateAsync(ticketType);
                }

                // Add all booking items and tickets 
                await _unitOfWork.BookingItemRepository.AddRangeAsync(bookingItems);
                await _unitOfWork.TicketRepository.AddRangeAsync(tickets);

                await _unitOfWork.SaveChangesAsync();

                // Generate QR codes 
                var qrTasks = tickets.Select(async t =>
                {
                    var token = _ticketTokenService.CreateTicketToken(t.Id); // needs real Id
                    t.QrCodeUrl = await _qrCodeService.GenerateQrCodeAsync(token);
                }).ToList();

                await Task.WhenAll(qrTasks);

                // Payment handling 
                if (totalAmount > 0)
                {
                    var wallet = await _unitOfWork.WalletRepository.Query()
                        .FirstOrDefaultAsync(w => w.UserId == userId && w.Status == WalletStatus.Active && !w.IsDeleted);
                    if (wallet == null)
                        return ErrorResponse.FailureResult("Wallet not found", ErrorCodes.NotFound);
                    if (wallet.Balance < totalAmount)
                        return ErrorResponse.FailureResult("Not enough money in wallet", ErrorCodes.InvalidInput);

                    // Decrease balance
                    var balanceBefore = wallet.Balance;
                    wallet.Balance -= totalAmount;
                    await _unitOfWork.WalletRepository.UpdateAsync(wallet);

                    // Create payment transaction
                    var payment = new PaymentTransaction
                    {
                        BookingId = booking.Id,
                        UserId = userId,
                        Amount = totalAmount,
                        Currency = "VND",
                        PaymentMethod = PaymentMethod.Wallet,
                        Description = $"Thanh toán vé sự kiện '{eventEntity.Title}'",
                        CompletedAt = DateTime.UtcNow,
                    };
                    await _unitOfWork.PaymentTransactionRepository.AddAsync(payment);

                    // Wallet transaction record
                    await _unitOfWork.WalletTransactionRepository.AddAsync(new WalletTransaction
                    {
                        WalletId = wallet.Id,
                        Amount = totalAmount,
                        BalanceBefore = balanceBefore,
                        BalanceAfter = wallet.Balance,
                        Type = TransactionType.Payment,
                        ReferenceId = payment.Id,
                        Status = TransactionStatus.Success,
                        Description = $"Thanh toán vé sự kiện '{eventEntity.Title}'",
                    });

                    booking.PaymentStatus = PaymentStatus.Paid;
                }
                else
                {
                    booking.PaymentStatus = PaymentStatus.Paid; 
                }

                // Update booking total
                booking.TotalAmount = totalAmount;
                await _unitOfWork.BookingRepository.UpdateAsync(booking);

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
                }).ToList();

                // Generate PDF 
                var pdfTask = _pdfService.GenerateTicketsPdfAsync(ticketData, eventEntity.Title, user.FullName!, user.Email!);

                var emailTask = pdfTask.ContinueWith(async pdfT =>
                {
                    var pdfBytes = pdfT.Result;
                    await _emailService.SendTicketsEmailAsync(
                        user.Email!,
                        "Your Tickets from AIEvent",
                        null!, 
                        pdfBytes,
                        $"{user.FullName}-AIEvent",
                        eventEntity.Title
                    );
                }, TaskContinuationOptions.OnlyOnRanToCompletion).Unwrap();

                await Task.WhenAll(pdfTask, emailTask);

                return Result.Success();
            });
        }


    }
}
