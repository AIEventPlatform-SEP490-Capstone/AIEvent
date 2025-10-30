using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IBookingService
    {
        Task<Result> CreateBookingAsync(Guid userId, CreateBookingRequest request);
        Task<Result<BasePaginated<ListEventOfUser>>> GetListEventOfUser(
            int pageNumber,
            int pageSize,
            Guid userId,
            string? title,
            DateTime? startTime,
            DateTime? endTime);
        Task<Result<BasePaginated<TicketByEventResponse>>> GetTicketsByEventAsync(Guid userId, string eventId, int pageNumber, int pageSize);
        Task<Result<QrResponse>> GetQrCodeAsync(Guid userId, string id);
        Task<Result> RefundTicketAsync(Guid userId, string id);
    }
}
