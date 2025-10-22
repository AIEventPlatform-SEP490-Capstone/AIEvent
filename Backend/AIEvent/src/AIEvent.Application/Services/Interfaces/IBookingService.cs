using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IBookingService
    {
        Task<Result> CreateBookingAsync(Guid userId, CreateBookingRequest request);
        Task<Result<BasePaginated<TicketResponse>>> GetListTicketAsync(int pageNumber, int pageSize, Guid userId, string? title,
                                                                            DateTime? startTime, DateTime? endTime, TicketStatus? status);
        Task<Result<QrResponse>> GetQrCodeAsync(Guid userId, string id);
        Task<Result> RefundTicketAsync(Guid userId, string id);
    }
}
