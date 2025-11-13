using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

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
        Task<Result<List<TicketByEventResponse>>> GetTicketsByEventAsync(Guid userId, string id);
        Task<Result<CheckInResponse>> CheckInTicketAsync(Guid userId, string qrContent);
    }
}
