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

        public BookingService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IQrCodeService qrCodeService, ITicketTokenService ticketTokenService)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _qrCodeService = qrCodeService;
            _ticketTokenService = ticketTokenService;
        }

        public async Task<Result> CreateBookingAsync(Guid userId, CreateBookingRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var eventEntity = await _unitOfWork.EventRepository.GetByIdAsync(request.EventId);
                if (eventEntity == null || eventEntity.IsDeleted)
                {
                    return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);
                }

                var ticketTypeIds = request.TicketTypeRequests.Select(x => x.TicketTypeId).ToList();
                var ticketTypes = await _unitOfWork.TicketDetailRepository
                    .Query()
                    .Where(t => ticketTypeIds.Contains(t.Id))
                    .ToListAsync();

                if (ticketTypes.Count != ticketTypeIds.Count)
                {
                    return ErrorResponse.FailureResult("One or more ticket types are invalid", ErrorCodes.InvalidInput);
                }

                Booking booking = new()
                {
                    UserId = userId,
                    EventId = request.EventId,
                    Currency = "VND",
                    Status = BookingStatus.Pending,
                    PaymentStatus = PaymentStatus.Unpaid,
                    PaymentMethod = PaymentMethod.Wallet,
                    TotalAmount = 0,
                };
                await _unitOfWork.BookingRepository.AddAsync(booking);

                decimal totalAmount = 0;
                foreach (var requestItem in request.TicketTypeRequests)
                {
                    // Tạo BookingItem
                    var ticketType = ticketTypes.First(t => t.Id == requestItem.TicketTypeId);

                    if (ticketType.RemainingQuantity < requestItem.Quantity)
                        return ErrorResponse.FailureResult($"Not enough tickets for type {ticketType.TicketName}", ErrorCodes.InvalidInput);

                    var bookingItem = new BookingItem
                    {
                        BookingId = booking.Id,
                        TicketTypeId = ticketType.Id,
                        Quantity = requestItem.Quantity,
                        UnitPrice = ticketType.TicketPrice,
                        TotalPrice = ticketType.TicketPrice * requestItem.Quantity
                    };

                    totalAmount += bookingItem.TotalPrice;
                    await _unitOfWork.BookingItemRepository.AddAsync(bookingItem);
                    await _unitOfWork.SaveChangesAsync();

                    // Generate tickets
                    for (int i = 0; i < requestItem.Quantity; i++)
                    {
                        var ticket = new Ticket
                        {
                            UserId = userId,
                            BookingItemId = bookingItem.Id,
                            TicketTypeId = requestItem.TicketTypeId,
                            TicketCode = Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                            Status = TicketStatus.Valid,
                            EventName = eventEntity.Title,
                            StartTime = eventEntity.StartTime,
                            EndTime = eventEntity.EndTime,
                            Address = eventEntity.Address,
                            Price = bookingItem.UnitPrice,
                            UseAt = null,
                            QrCodeUrl = ""
                        };

                        // Generate QR token and QR code image
                        var token = _ticketTokenService.CreateTicketToken(ticket.Id);
                        var qrUrl = await _qrCodeService.GenerateQrCodeAsync(token);
                        ticket.QrCodeUrl = qrUrl;

                        await _unitOfWork.TicketRepository.AddAsync(ticket);
                    }

                    // Update số lượng vé còn lại
                    ticketType.RemainingQuantity -= requestItem.Quantity;
                    ticketType.SoldQuantity += requestItem.Quantity;
                    eventEntity.RemainingTickets -= requestItem.Quantity;
                    eventEntity.SoldQuantity += requestItem.Quantity;
                    await _unitOfWork.TicketDetailRepository.UpdateAsync(ticketType);
                }

                booking.TotalAmount = totalAmount;
                await _unitOfWork.EventRepository.UpdateAsync(eventEntity);

                //payment
                if (booking.TotalAmount > 0)
                {
                    var wallet = await _unitOfWork.WalletRepository
                        .Query()
                        .FirstOrDefaultAsync(w => w.UserId == userId && w.Status == WalletStatus.Active && !w.IsDeleted);
                    if (wallet == null)
                    {
                        return ErrorResponse.FailureResult("Wallet not found", ErrorCodes.NotFound);
                    }
                    if (wallet.Balance < totalAmount)
                    {
                        return ErrorResponse.FailureResult("Not enough money in wallet", ErrorCodes.InvalidInput);
                    }

                    wallet.Balance -= totalAmount;
                    await _unitOfWork.WalletRepository.UpdateAsync(wallet);

                    PaymentTransaction paymentTransaction = new()
                    {
                        BookingId = booking.Id,
                        UserId = userId,
                        Amount = totalAmount,
                        Currency = "VND",
                        PaymentMethod = PaymentMethod.Wallet,
                        Description = $"Thanh toán vé sự kiện '{eventEntity.Title}'",
                        CompletedAt = DateTime.UtcNow,
                    };
                    await _unitOfWork.PaymentTransactionRepository.AddAsync(paymentTransaction);

                    WalletTransaction walletTransaction = new()
                    {
                        WalletId = wallet.Id,
                        Amount = totalAmount,
                        BalanceBefore = wallet.Balance,
                        BalanceAfter = wallet.Balance - totalAmount,
                        Type = TransactionType.Payment,
                        ReferenceId = paymentTransaction.Id,
                        Status = TransactionStatus.Success,
                        Description = $"Thanh toán vé sự kiện '{eventEntity.Title}'",
                    };
                    await _unitOfWork.WalletTransactionRepository.AddAsync(walletTransaction);
                }

                booking.PaymentStatus = PaymentStatus.Paid;
                await _unitOfWork.BookingRepository.UpdateAsync(booking);

                return Result.Success();
            });            
        }
    }
}
