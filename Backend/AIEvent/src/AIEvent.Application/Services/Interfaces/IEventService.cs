using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventService
    {
        Task<Result> CreateEventAsync(Guid organizerId, CreateEventRequest request);
        Task<Result<EventDetailResponse>> GetEventByIdAsync(Guid eventId);
        Task<Result> DeleteEventAsync(Guid eventId, Guid organizerId, string? reasonCancel);
        Task<Result> UpdateEventAsync(Guid organizerId, Guid eventId, UpdateEventRequest request);
        Task<Result<BasePaginated<EventsRelatedResponse>>> GetRelatedEventAsync(Guid eventId, int pageNumber = 1, int pageSize = 5);
        Task<Result<BasePaginated<EventsResponse>>> GetEventAsync(Guid? userId, string? search, string? eventCategoryId, List<EventTagRequest> tags, TicketPricingType? ticketType, string? district, TimeLine? timeLine, int pageNumber = 1, int pageSize = 5);
        Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventStatusAsync(Guid? organizerId, string? search, EventStatus? status = null, int pageNumber = 1, int pageSize = 10);
        Task<Result> ConfirmEventAsync(Guid userId, Guid eventId, ConfirmEventRequest request);
        Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventDraftAsync(Guid organizerId, int pageNumber = 1, int pageSize = 10);
        Task CompleteExpiredEventsAsync();
        Task<Result> ReportEventAsyncs(Guid userId, ReportEventRequest request);
        Task<Result<BasePaginated<ListReportResponse>>> GetAllReportByEventId(int pageNumber, int pageSize, string eventId, EventReportType? type);
        Task<Result<ReportResponse>> GetEventReportDetailAsync(string id);
        Task<Result> ReplyReportAsync(string id, ReplyReportRequest request);
        Task<Result<ReportResponse>> GetEventReportOfUserAsync(Guid userId, string id);
        Task<Result<BasePaginated<ListEventResponse>>> GetAllEventForStaff(Guid staffId, string? title, string? eventCategoryId,int pageNumber, int pageSize);
        Task<Result<BasePaginated<EventsResponse>>> GetAllEventByRadius(Guid userId, int? radius, string? eventCategoryId, int pageNumber, int pageSize);
    }
}
