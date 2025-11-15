using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;

        public DashboardService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private IQueryable<Event> GetFilteredEvents(Guid organizerProfileId, DashboardFilterRequest? filter)
        {
            var query = _unitOfWork.EventRepository
                .Query()
                .AsNoTracking()
                .Where(e => e.OrganizerProfileId == organizerProfileId && !e.IsDeleted);

            if (filter?.CategoryId.HasValue == true)
                query = query.Where(e => e.EventCategoryId == filter.CategoryId.Value);

            if (filter?.TagIds != null && filter.TagIds.Any())
                query = query.Where(e => e.EventTags.Any(et => filter.TagIds.Contains(et.TagId)));

            if (filter?.StartDate.HasValue == true)
                query = query.Where(e => e.CreatedAt >= filter.StartDate.Value);

            if (filter?.EndDate.HasValue == true)
                query = query.Where(e => e.CreatedAt <= filter.EndDate.Value);

            if (filter?.Year.HasValue == true)
                query = query.Where(e => e.CreatedAt.Year == filter.Year.Value);

            if (filter?.Month.HasValue == true)
                query = query.Where(e => e.CreatedAt.Month == filter.Month.Value);

            if (filter?.Day.HasValue == true)
                query = query.Where(e => e.CreatedAt.Day == filter.Day.Value);

            return query;
        }

        public async Task<Result<EventStatisticsResponse>> GetEventStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null)
        {
            if (organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid organizer profile ID", ErrorCodes.InvalidInput);

            try
            {
                var eventsQuery = GetFilteredEvents(organizerProfileId, filter)
                    .Include(e => e.EventTags)
                    .ThenInclude(et => et.Tag)
                    .Include(e => e.EventCategory);

                var response = new EventStatisticsResponse();

                // Total Events
                response.TotalEvents = await eventsQuery.CountAsync();

                // Events By Status
                var eventsByStatus = await eventsQuery
                    .GroupBy(e => e.Status)
                    .Select(g => new EventCountByStatusResponse
                    {
                        Status = (int)g.Key!,
                        StatusName = g.Key!.ToString()!,
                        Count = g.Count()
                    })
                    .ToListAsync();

                response.EventsByStatus = eventsByStatus;

                // Events By Tag
                var eventsByTag = await eventsQuery
                    .SelectMany(e => e.EventTags)
                    .GroupBy(et => new { et.TagId, et.Tag.NameTag })
                    .Select(g => new EventCountByTagResponse
                    {
                        TagId = g.Key.TagId,
                        TagName = g.Key.NameTag,
                        Count = g.Count()
                    })
                    .ToListAsync();

                response.EventsByTag = eventsByTag;

                // Events By Category
                var eventsByCategory = await eventsQuery
                    .GroupBy(e => new { e.EventCategoryId, e.EventCategory.CategoryName })
                    .Select(g => new EventCountByCategoryResponse
                    {
                        CategoryId = g.Key.EventCategoryId,
                        CategoryName = g.Key.CategoryName,
                        Count = g.Count()
                    })
                    .ToListAsync();

                response.EventsByCategory = eventsByCategory;

                // Events By Date
                var eventsByDate = await eventsQuery
                    .GroupBy(e => e.CreatedAt.Date)
                    .Select(g => new EventCountByDateResponse
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Date)
                    .ToListAsync();

                response.EventsByDate = eventsByDate;

                return Result<EventStatisticsResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting event statistics: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<BuyerStatisticsResponse>> GetBuyerStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null)
        {
            if (organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid organizer profile ID", ErrorCodes.InvalidInput);

            try
            {
                var eventsQuery = GetFilteredEvents(organizerProfileId, filter);

                var bookingsQuery = _unitOfWork.BookingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(b => b.Status == BookingStatus.Completed)
                    .Where(b => eventsQuery.Any(e => e.Id == b.EventId));

                if (filter?.StartDate.HasValue == true)
                {
                    bookingsQuery = bookingsQuery.Where(b => b.CreatedAt >= filter.StartDate.Value);
                }

                if (filter?.EndDate.HasValue == true)
                {
                    bookingsQuery = bookingsQuery.Where(b => b.CreatedAt <= filter.EndDate.Value);
                }

                var response = new BuyerStatisticsResponse();

                // Total Buyers
                response.TotalBuyers = await bookingsQuery
                    .Select(b => b.UserId)
                    .Distinct()
                    .CountAsync();

                // Buyers By Event
                var buyersByEvent = await bookingsQuery
                    .GroupBy(b => new { b.EventId, b.Event.Title })
                    .Select(g => new EventBuyerResponse
                    {
                        EventId = g.Key.EventId,
                        EventName = g.Key.Title,
                        BuyerCount = g.Select(b => b.UserId).Distinct().Count()
                    })
                    .OrderByDescending(x => x.BuyerCount)
                    .ToListAsync();

                response.BuyersByEvent = buyersByEvent;

                return Result<BuyerStatisticsResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting buyer statistics: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<CheckInStatisticsResponse>> GetCheckInStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null)
        {
            if (organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid organizer profile ID", ErrorCodes.InvalidInput);

            try
            {
                var eventsQuery = GetFilteredEvents(organizerProfileId, filter);

                var ticketsQuery = _unitOfWork.TicketRepository
                    .Query()
                    .AsNoTracking()
                    .Include(t => t.TicketType)
                    .Where(t => t.Status == TicketStatus.Used)
                    .Where(t => eventsQuery.Any(e => e.Id == t.TicketType.EventId));

                if (filter?.StartDate.HasValue == true)
                {
                    ticketsQuery = ticketsQuery.Where(t => t.UseAt >= filter.StartDate.Value);
                }

                if (filter?.EndDate.HasValue == true)
                {
                    ticketsQuery = ticketsQuery.Where(t => t.UseAt <= filter.EndDate.Value);
                }

                var response = new CheckInStatisticsResponse();

                // Total Checked In
                response.TotalCheckedIn = await ticketsQuery.CountAsync();

                // Check Ins By Event
                var checkInsByEvent = await ticketsQuery
                    .GroupBy(t => new { t.TicketType.EventId, t.TicketType.Event.Title })
                    .Select(g => new EventCheckInResponse
                    {
                        EventId = g.Key.EventId,
                        EventName = g.Key.Title,
                        CheckedInCount = g.Count()
                    })
                    .OrderByDescending(x => x.CheckedInCount)
                    .ToListAsync();

                response.CheckInsByEvent = checkInsByEvent;

                return Result<CheckInStatisticsResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting check-in statistics: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<RevenueStatisticsResponse>> GetRevenueStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null)
        {
            if (organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid organizer profile ID", ErrorCodes.InvalidInput);

            try
            {
                var eventsQuery = GetFilteredEvents(organizerProfileId, filter);

                var response = new RevenueStatisticsResponse();

                // Total Revenue
                response.TotalRevenue = await eventsQuery
                    .SumAsync(e => e.TotalAmount);

                // Revenue By Event
                var revenueByEvent = await eventsQuery
                    .Select(e => new EventRevenueResponse
                    {
                        EventId = e.Id,
                        EventName = e.Title,
                        Revenue = e.TotalAmount
                    })
                    .OrderByDescending(x => x.Revenue)
                    .ToListAsync();

                response.RevenueByEvent = revenueByEvent;

                return Result<RevenueStatisticsResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting revenue statistics: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<NetRevenueStatisticsResponse>> GetNetRevenueStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null)
        {
            if (organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid organizer profile ID", ErrorCodes.InvalidInput);

            try
            {
                var eventsQuery = GetFilteredEvents(organizerProfileId, filter);

                var response = new NetRevenueStatisticsResponse();

                // Total Net Revenue
                response.TotalNetRevenue = await eventsQuery
                    .SumAsync(e => e.PayoutAmount ?? 0);

                // Net Revenue By Event
                var netRevenueByEvent = await eventsQuery
                    .Select(e => new EventNetRevenueResponse
                    {
                        EventId = e.Id,
                        EventName = e.Title,
                        NetRevenue = e.PayoutAmount ?? 0,
                        PlatformFee = e.PlatformFee ?? 0,
                        GrossRevenue = e.TotalAmount
                    })
                    .OrderByDescending(x => x.NetRevenue)
                    .ToListAsync();

                response.NetRevenueByEvent = netRevenueByEvent;

                return Result<NetRevenueStatisticsResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting net revenue statistics: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<RevenueByCategoryTagResponse>> GetRevenueByCategoryTagAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null)
        {
            if (organizerProfileId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid organizer profile ID", ErrorCodes.InvalidInput);

            try
            {
                var eventsQuery = GetFilteredEvents(organizerProfileId, filter)
                    .Include(e => e.EventCategory)
                    .Include(e => e.EventTags)
                    .ThenInclude(et => et.Tag);

                var response = new RevenueByCategoryTagResponse();

                // Revenue By Category
                var revenueByCategory = await eventsQuery
                    .GroupBy(e => new { e.EventCategoryId, e.EventCategory.CategoryName })
                    .Select(g => new RevenueByCategoryResponse
                    {
                        CategoryId = g.Key.EventCategoryId,
                        CategoryName = g.Key.CategoryName,
                        Revenue = g.Sum(e => e.TotalAmount),
                        EventCount = g.Count()
                    })
                    .Where(x => x.EventCount > 0)
                    .OrderByDescending(x => x.Revenue)
                    .ToListAsync();

                response.RevenueByCategory = revenueByCategory;

                // Revenue By Tag
                var revenueByTag = await eventsQuery
                    .SelectMany(e => e.EventTags.Select(et => new { Event = e, Tag = et.Tag }))
                    .GroupBy(x => new { x.Tag.Id, x.Tag.NameTag })
                    .Select(g => new RevenueByTagResponse
                    {
                        TagId = g.Key.Id,
                        TagName = g.Key.NameTag,
                        Revenue = g.Sum(x => x.Event.TotalAmount),
                        EventCount = g.Select(x => x.Event.Id).Distinct().Count()
                    })
                    .OrderByDescending(x => x.Revenue)
                    .ToListAsync();

                response.RevenueByTag = revenueByTag;

                return Result<RevenueByCategoryTagResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting revenue by category/tag: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> UpdateSystemSetiing(string adminId, SystemSettingRequest request)
        {
            try
            {
                var systemSetting = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .FirstOrDefaultAsync(s => s.CreatedBy == adminId && !s.IsDeleted);

                if (systemSetting == null)
                {
                    return ErrorResponse.FailureResult("No Permission", ErrorCodes.PermissionDenied);
                }

                systemSetting.FlatformFee = request.FlatformFee;
                systemSetting.FixFee = request.FixFee;
                systemSetting.DatePayout = request.DatePayout;

                await _unitOfWork.SystemSettingRepository.UpdateAsync(systemSetting);
                await _unitOfWork.SaveChangesAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting revenue by category/tag: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<SystemSettingRequest>> GetSystemSetting(string adminId)
        {
            var systemSetting = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .FirstOrDefaultAsync(s => s.CreatedBy == adminId && !s.IsDeleted);

            if (systemSetting == null)
            {
                return ErrorResponse.FailureResult("No Permission", ErrorCodes.PermissionDenied);
            }

            SystemSettingRequest request = new()
            {
                DatePayout = systemSetting.DatePayout,
                FixFee = systemSetting.FixFee,
                FlatformFee = systemSetting.FlatformFee,
            };

            return Result<SystemSettingRequest>.Success(request);
        }
    }
}
