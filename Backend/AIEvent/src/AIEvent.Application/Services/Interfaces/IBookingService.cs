using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IBookingService
    {
        Task<Result> CreateBookingAsync(Guid userId, CreateBookingRequest request);
    }
}
