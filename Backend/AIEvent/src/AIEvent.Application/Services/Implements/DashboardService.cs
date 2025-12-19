using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.DTOs.RevenueReport;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces; 
using Microsoft.EntityFrameworkCore; 

namespace AIEvent.Application.Services.Implements
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHangfireJobService _hangfireJobService;

        public DashboardService(IUnitOfWork unitOfWork, IHangfireJobService hangfireJobService)
        {
            _unitOfWork = unitOfWork;
            _hangfireJobService = hangfireJobService;
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

        public async Task<Result> CreateSystemSetting(Guid id, SystemSettingRequest request)
        {
            try
            {
                if (request.FlatformFee <= 0 || request.FixFee <= 0 || request.DatePayout <= 0 || request.EventReminderHours <= 0)
                {
                    return ErrorResponse.FailureResult(
                        "All fields must be greater than 0",
                        ErrorCodes.InvalidInput
                    );
                }

                if (request.DateApply <= DateTime.UtcNow)
                {
                    return ErrorResponse.FailureResult(
                        "DateApply must be greater than today",
                        ErrorCodes.InvalidInput
                    );
                }

                var adminId = id.ToString();

                var now = DateTime.UtcNow;

                var existedSetting = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => s.CreatedBy == adminId && !s.IsDeleted)
                    .Where(s => s.CreatedAt.Month == now.Month && s.CreatedAt.Year == now.Year)
                    .FirstOrDefaultAsync();

                if (existedSetting != null)
                {
                    return ErrorResponse.FailureResult(
                        "System setting can only be update once per month",
                        ErrorCodes.InvalidInput);
                }

                var newSetting = new SystemSetting
                {
                    FlatformFee = request.FlatformFee,
                    FixFee = request.FixFee,
                    DatePayout = request.DatePayout,
                    EventReminderHours = request.EventReminderHours,
                    CreatedBy = adminId,
                    CreatedAt = now,
                    UpdatedAt = request.DateApply.UtcDateTime,
                };

                await _unitOfWork.SystemSettingRepository.AddAsync(newSetting);
                await _unitOfWork.SaveChangesAsync();

                await _hangfireJobService.EnqueueNotifyPlatformSettingChange(newSetting);

                return Result.Success();
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult(
                    $"Error creating system setting: {ex.Message}",
                    ErrorCodes.InternalServerError
                );
            }
        }


        public async Task<Result<SystemSettingResponse>> GetSystemSetting(string adminId)
        {
            var systemSetting = await _unitOfWork.SystemSettingRepository
                .Query()
                .AsNoTracking()
                .Where(s => !s.IsDeleted && s.CreatedBy == adminId)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (systemSetting == null)
            {
                return ErrorResponse.FailureResult("No Permission", ErrorCodes.PermissionDenied);
            }

            SystemSettingResponse request = new()
            {
                DatePayout = systemSetting.DatePayout,
                FixFee = systemSetting.FixFee,
                FlatformFee = systemSetting.FlatformFee,
                EventReminderHours = systemSetting.EventReminderHours,
                DateApply = systemSetting.UpdatedAt,
                CreateTime = systemSetting.CreatedAt,
            };

            return Result<SystemSettingResponse>.Success(request);
        }

        public async Task<Result<BasePaginated<SystemSettingResponse>>> GetSystemSettingListAsync(string adminId, int pageNumber = 1, int pageSize = 10)
        {
            try
            {
                var query = _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted && s.CreatedBy == adminId);

                var totalCount = await query.CountAsync();

                var systemSettings = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new SystemSettingResponse   
                    {
                        DatePayout = s.DatePayout,
                        FixFee = s.FixFee,
                        FlatformFee = s.FlatformFee,
                        EventReminderHours = s.EventReminderHours,
                        DateApply = s.UpdatedAt ?? s.CreatedAt,
                        CreateTime = s.CreatedAt
                    })
                    .ToListAsync();

                if (!systemSettings.Any() && totalCount == 0)
                    return ErrorResponse.FailureResult("No Permission or No System Settings Found", ErrorCodes.PermissionDenied);

                return Result<BasePaginated<SystemSettingResponse>>.Success(
                    new BasePaginated<SystemSettingResponse>(systemSettings, totalCount, pageNumber, pageSize));
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting system settings: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<AdminDashboardResponse>> GetAdminDashboardAsync(int? year = null, int? month = null)
        {
            try
            {
                var response = new AdminDashboardResponse();
 
                var adminRoleId = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Where(r => r.Name == "Admin" && !r.IsDeleted)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                var totalUsers = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Where(u => !u.IsDeleted && u.RoleId != adminRoleId)
                    .CountAsync();

                response.TotalUsers = totalUsers;
 
                var now = DateTimeOffset.UtcNow;
                
                var targetYear = year ?? now.Year;
                var targetMonth = month ?? now.Month;
                
                if (targetYear < 2000 || targetYear > 9999)
                    return ErrorResponse.FailureResult("Invalid year. Year must be between 2000 and 9999", ErrorCodes.InvalidInput);
                
                if (targetMonth < 1 || targetMonth > 12)
                    return ErrorResponse.FailureResult("Invalid month. Month must be between 1 and 12", ErrorCodes.InvalidInput);
                
                var selectedMonthStart = new DateTimeOffset(targetYear, targetMonth, 1, 0, 0, 0, TimeSpan.Zero);
                var selectedMonthEnd = selectedMonthStart.AddMonths(1).AddTicks(-1);
                
                var currentMonthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
                var lastMonthStart = currentMonthStart.AddMonths(-1);
                var lastMonthEnd = currentMonthStart.AddTicks(-1);

                var currentMonthUsers = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Where(u => !u.IsDeleted && u.RoleId != adminRoleId && u.CreatedAt >= currentMonthStart)
                    .CountAsync();

                var lastMonthUsers = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Where(u => !u.IsDeleted && u.RoleId != adminRoleId && 
                                u.CreatedAt >= lastMonthStart && u.CreatedAt <= lastMonthEnd)
                    .CountAsync();

                if (lastMonthUsers > 0)
                    response.MonthlyUserGrowthPercentage = ((decimal)(currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
                else if (currentMonthUsers > 0)
                    response.MonthlyUserGrowthPercentage = 100;
                else
                    response.MonthlyUserGrowthPercentage = 0;
                 
                response.TotalOrganizers = await _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .AsNoTracking()
                    .Where(o => !o.IsDeleted && o.Status == OrganizerProfileStatus.Approved)
                    .CountAsync();
 
                response.TotalEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Publish == true && e.Status == EventStatus.Approved)
                    .CountAsync();
 
                response.PendingEventsCount = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Status == EventStatus.PendingApproval && e.Publish == true)
                    .CountAsync();

                response.CancelledEventsCount = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Status == EventStatus.Cancelled)
                    .CountAsync();

                response.PendingOrganizerRequestsCount = await _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .AsNoTracking()
                    .Where(o => !o.IsDeleted && o.Status == OrganizerProfileStatus.Pending)
                    .CountAsync();
 
                var todayStart = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);
                var todayEnd = todayStart.AddDays(1).AddTicks(-1);

                var bookingsBaseQuery = _unitOfWork.BookingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(b => !b.IsDeleted);

                response.TotalBookings = await bookingsBaseQuery.CountAsync();

                response.BookingsToday = await bookingsBaseQuery
                    .Where(b => b.CreatedAt >= todayStart && b.CreatedAt <= todayEnd)
                    .CountAsync();

                var bookingsByStatus = await bookingsBaseQuery
                    .GroupBy(b => b.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                response.CompletedBookings = bookingsByStatus.FirstOrDefault(x => x.Status == BookingStatus.Completed)?.Count ?? 0;
                response.PendingBookings = bookingsByStatus.FirstOrDefault(x => x.Status == BookingStatus.Pending)?.Count ?? 0;
                response.CancelledBookings = bookingsByStatus.FirstOrDefault(x => x.Status == BookingStatus.Cancelled)?.Count ?? 0;

                var ticketsBaseQuery = _unitOfWork.TicketRepository
                    .Query()
                    .AsNoTracking()
                    .Where(t => !t.IsDeleted);

                var validTicketsQuery = ticketsBaseQuery.Where(t => t.Status != TicketStatus.Refunded && t.Status != TicketStatus.Cancelled);
                response.TotalTicketsSold = await validTicketsQuery.CountAsync();

                response.TicketsSoldToday = await validTicketsQuery
                    .Where(t => t.CreatedAt >= todayStart && t.CreatedAt <= todayEnd)
                    .CountAsync();

                var ticketsByStatus = await ticketsBaseQuery
                    .GroupBy(t => t.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                response.ValidTickets = ticketsByStatus.FirstOrDefault(x => x.Status == TicketStatus.Valid)?.Count ?? 0;
                response.UsedTickets = ticketsByStatus.FirstOrDefault(x => x.Status == TicketStatus.Used)?.Count ?? 0;
                 
                var allSystemSettings = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted)
                    .OrderByDescending(s => s.UpdatedAt)
                    .ToListAsync();

                var defaultSetting = allSystemSettings.FirstOrDefault();

                var allCompletedEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.CompletedAt.HasValue && e.TotalAmount > 0 && e.Status == EventStatus.PaidOut)
                    .Select(e => new { e.PlatformFee, e.TotalAmount, e.SaleStartTime, e.CompletedAt })
                    .ToListAsync();

                response.TotalRevenue = allCompletedEvents
                    .Sum(e => CalculatePlatformFeeForEvent(e.PlatformFee, e.TotalAmount, e.SaleStartTime, allSystemSettings, defaultSetting));

                response.RevenueToday = allCompletedEvents
                    .Where(e => e.CompletedAt.HasValue && e.CompletedAt.Value.Date == now.Date)
                    .Sum(e => CalculatePlatformFeeForEvent(e.PlatformFee, e.TotalAmount, e.SaleStartTime, allSystemSettings, defaultSetting));

                response.RevenueThisMonth = allCompletedEvents
                    .Where(e => e.CompletedAt.HasValue && 
                               e.CompletedAt.Value >= selectedMonthStart.UtcDateTime && 
                               e.CompletedAt.Value <= selectedMonthEnd.UtcDateTime)
                    .Sum(e => CalculatePlatformFeeForEvent(e.PlatformFee, e.TotalAmount, e.SaleStartTime, allSystemSettings, defaultSetting));
                 
                var startDate = now.AddMonths(-12);
                DateTimeOffset? endDate = null;
                
                if (year.HasValue)
                {
                    startDate = new DateTimeOffset(year.Value, 1, 1, 0, 0, 0, TimeSpan.Zero);
                    var yearEnd = new DateTimeOffset(year.Value, 12, 31, 23, 59, 59, TimeSpan.Zero);
                    if (yearEnd > now)
                        endDate = now;
                    else
                        endDate = yearEnd;
                }
                 
                var bookingsQuery = _unitOfWork.BookingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(b => !b.IsDeleted && b.CreatedAt >= startDate && b.Status == BookingStatus.Completed);
                
                if (endDate.HasValue)
                    bookingsQuery = bookingsQuery.Where(b => b.CreatedAt <= endDate.Value);
                
                var bookingsByMonth = await bookingsQuery
                    .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();
                 
                var ticketsQuery = _unitOfWork.TicketRepository
                    .Query()
                    .AsNoTracking()
                    .Where(t => !t.IsDeleted && 
                               t.Status != TicketStatus.Refunded && 
                               t.Status != TicketStatus.Cancelled &&
                               t.CreatedAt >= startDate);
                
                if (endDate.HasValue)
                    ticketsQuery = ticketsQuery.Where(t => t.CreatedAt <= endDate.Value);
                
                var ticketsByMonth = await ticketsQuery
                    .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();
                 
                var revenueEventsForMonth = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && 
                               e.CompletedAt.HasValue &&
                               e.TotalAmount > 0 &&
                               e.Status == EventStatus.PaidOut &&
                               e.CompletedAt.Value >= startDate.UtcDateTime)
                    .Select(e => new { e.PlatformFee, e.TotalAmount, e.SaleStartTime, e.CompletedAt })
                    .ToListAsync();
                
                if (endDate.HasValue)
                    revenueEventsForMonth = revenueEventsForMonth
                        .Where(e => e.CompletedAt.HasValue && e.CompletedAt.Value <= endDate.Value.UtcDateTime)
                        .ToList();
                
                var revenueByMonth = revenueEventsForMonth
                    .GroupBy(e => new { e.CompletedAt!.Value.Year, e.CompletedAt.Value.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Revenue = g.Sum(e => CalculatePlatformFeeForEvent(e.PlatformFee, e.TotalAmount, e.SaleStartTime, allSystemSettings, defaultSetting))
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToList();
                 
                var monthlyStatsDict = new Dictionary<(int Year, int Month), MonthlyStatisticsResponse>();

                foreach (var booking in bookingsByMonth)
                {
                    var key = (booking.Year, booking.Month);
                    if (!monthlyStatsDict.ContainsKey(key))
                    {
                        monthlyStatsDict[key] = new MonthlyStatisticsResponse
                        {
                            Year = booking.Year,
                            Month = booking.Month
                        };
                    }
                    monthlyStatsDict[key].BookingsCount = booking.Count;
                }

                foreach (var ticket in ticketsByMonth)
                {
                    var key = (ticket.Year, ticket.Month);
                    if (!monthlyStatsDict.ContainsKey(key))
                    {
                        monthlyStatsDict[key] = new MonthlyStatisticsResponse
                        {
                            Year = ticket.Year,
                            Month = ticket.Month
                        };
                    }
                    monthlyStatsDict[key].TicketsSoldCount = ticket.Count;
                }

                foreach (var revenue in revenueByMonth)
                {
                    var key = (revenue.Year, revenue.Month);
                    if (!monthlyStatsDict.ContainsKey(key))
                    {
                        monthlyStatsDict[key] = new MonthlyStatisticsResponse
                        {
                            Year = revenue.Year,
                            Month = revenue.Month
                        };
                    }
                    monthlyStatsDict[key].Revenue = revenue.Revenue;
                }

                response.MonthlyStatistics = monthlyStatsDict.Values
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToList();

                return Result<AdminDashboardResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting admin dashboard: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<BasePaginated<EventManagementResponse>>> GetEventManagementAsync(string? search = null, int pageNumber = 1, int pageSize = 10)
        {
            try
            {
                var query = _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Include(e => e.OrganizerProfile)
                    .Where(e => !e.IsDeleted && e.Publish == true);
 
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(e => 
                        e.Title.ToLower().Contains(searchLower) ||
                        (e.OrganizerProfile != null && 
                         (e.OrganizerProfile.CompanyName != null && e.OrganizerProfile.CompanyName.ToLower().Contains(searchLower) ||
                          e.OrganizerProfile.ContactName.ToLower().Contains(searchLower))));
                }

                var totalCount = await query.CountAsync();

                var events = await query
                    .OrderByDescending(e => e.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(e => new EventManagementResponse
                    {
                        EventId = e.Id,
                        Title = e.Title,
                        OrganizerName = e.OrganizerProfile != null 
                            ? (!string.IsNullOrEmpty(e.OrganizerProfile.CompanyName) 
                                ? e.OrganizerProfile.CompanyName 
                                : e.OrganizerProfile.ContactName)
                            : null,
                        CreatedAt = e.CreatedAt,
                        ImageUrl = !string.IsNullOrEmpty(e.ImgListEvent)
                            ? e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                            : null,
                        ParticipantCount = e.SoldQuantity,
                        Status = e.Status
                    })
                    .ToListAsync();

                return Result<BasePaginated<EventManagementResponse>>.Success(
                    new BasePaginated<EventManagementResponse>(events, totalCount, pageNumber, pageSize));
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting event management: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<BasePaginated<UserManagementResponse>>> GetUserManagementAsync(string? search = null, int pageNumber = 1, int pageSize = 10)
        {
            try
            { 
                var adminRoleId = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Where(r => r.Name == "Admin" && !r.IsDeleted)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                IQueryable<User> query = _unitOfWork.UserRepository
                                            .Query()
                                            .AsNoTracking()
                                            .Where(u => !u.IsDeleted && u.RoleId != adminRoleId);

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(u =>
                        (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                        (u.Email != null && u.Email.ToLower().Contains(searchLower)) ||
                        (u.Role != null && u.Role.Name.ToLower().Contains(searchLower)));
                }

                var totalCount = await query.CountAsync();

                var result = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new UserManagementResponse
                    {
                        UserId = u.Id,
                        FullName = u.FullName ?? "",
                        Email = u.Email ?? "",
                        RoleName = u.Role != null ? u.Role.Name : "",

                        TotalEventsParticipated = u.Bookings.Count(),

                        TotalEventsOrganized =
                            u.Role!.Name == "Organizer"
                                ? u.OrganizerProfile!.Events!
                                    .Count(e =>
                                        e.Status == EventStatus.Approved &&
                                        e.Publish == true &&
                                        !e.IsDeleted)
                                : 0,

                        AvatarUrl = u.AvatarImgUrl
                    })
                    .ToListAsync();

                return Result<BasePaginated<UserManagementResponse>>.Success(
                    new BasePaginated<UserManagementResponse>(result, totalCount, pageNumber, pageSize));
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting user management: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<SystemReportResponse>> GetSystemReportAsync(int recentActivitiesPageNumber = 1, int recentActivitiesPageSize = 10)
        {
            try
            {
                var response = new SystemReportResponse();
                var now = DateTimeOffset.UtcNow;
                var currentMonthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);

                var adminRoleId = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Where(r => r.Name == "Admin" && !r.IsDeleted)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                var monthlyStats = new MonthlyStatistics();

                monthlyStats.NewUsers = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Where(u => !u.IsDeleted && u.RoleId != adminRoleId && u.CreatedAt >= currentMonthStart)
                    .CountAsync();

                monthlyStats.NewEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted 
                            && e.CreatedAt >= currentMonthStart 
                            && e.Status != EventStatus.PendingApproval
                            && e.Publish == true)
                    .CountAsync();

                var systemSettingsForMonthly = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted)
                    .OrderByDescending(s => s.UpdatedAt)
                    .ToListAsync();

                var defaultSettingForMonthly = systemSettingsForMonthly.FirstOrDefault();

                var monthlyEvents = await _unitOfWork.EventRepository
                   .Query()
                   .AsNoTracking()
                   .Where(e => !e.IsDeleted && 
                              e.CompletedAt.HasValue &&
                              e.TotalAmount > 0 &&
                              e.Status == EventStatus.PaidOut && 
                              e.CompletedAt.Value >= currentMonthStart.UtcDateTime)
                   .Select(e => new { e.PlatformFee, e.TotalAmount, e.SaleStartTime })
                   .ToListAsync();

                monthlyStats.Revenue = monthlyEvents
                    .Sum(e => CalculatePlatformFeeForEvent(e.PlatformFee, e.TotalAmount, e.SaleStartTime, systemSettingsForMonthly, defaultSettingForMonthly));

                response.MonthlyStatistics = monthlyStats;

                var thirtyDaysAgo = now.AddDays(-30);
                var activities = new List<RecentActivityResponse>();

                var recentUsers = await _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Where(u => !u.IsDeleted && u.RoleId != adminRoleId && u.CreatedAt >= thirtyDaysAgo)
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(3)
                    .Select(u => new RecentActivityResponse
                    {
                        Id = u.Id,
                        Title = $"Người dùng mới: {u.FullName ?? u.Email ?? "Unknown"}",
                        Description = $"Đã đăng ký với vai trò {u.Role.Name}",
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                var recentEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.CreatedAt >= thirtyDaysAgo)
                    .OrderByDescending(e => e.CreatedAt)
                    .Take(3)
                    .Select(e => new RecentActivityResponse
                    {
                        Id = e.Id,
                        Title = $"Sự kiện mới: {e.Title}",
                        Description = $"Trạng thái: {e.Status}",
                        CreatedAt = e.CreatedAt
                    })
                    .ToListAsync();

                var recentOrganizerRequests = await _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .AsNoTracking()
                    .Where(o => !o.IsDeleted && o.CreatedAt >= thirtyDaysAgo && o.Status == OrganizerProfileStatus.Pending)
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(3)
                    .Select(o => new RecentActivityResponse
                    {
                        Id = o.Id,
                        Title = $"Đơn đăng ký Organizer: {o.CompanyName ?? o.ContactName}",
                        Description = $"Email: {o.ContactEmail}",
                        CreatedAt = o.CreatedAt
                    })
                    .ToListAsync();

                var approvedEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Status == EventStatus.Approved &&
                                e.RequireApprovalAt.HasValue && e.RequireApprovalAt >= thirtyDaysAgo)
                    .OrderByDescending(e => e.RequireApprovalAt)
                    .Take(3)
                    .Select(e => new RecentActivityResponse
                    {
                        Id = e.Id,
                        Title = $"Sự kiện được duyệt: {e.Title}",
                        Description = $"Đã được phê duyệt",
                        CreatedAt = e.RequireApprovalAt!.Value
                    })
                    .ToListAsync();

                var rejectedEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Status == EventStatus.Rejected &&
                                e.RequireApprovalAt.HasValue && e.RequireApprovalAt >= thirtyDaysAgo)
                    .OrderByDescending(e => e.RequireApprovalAt)
                    .Take(3)
                    .Select(e => new RecentActivityResponse
                    {
                        Id = e.Id,
                        Title = $"Sự kiện bị từ chối: {e.Title}",
                        Description = e.ReasonReject ?? "Bị từ chối",
                        CreatedAt = e.RequireApprovalAt!.Value
                    })
                    .ToListAsync();

                var cancelEvents = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Status == EventStatus.Cancelled &&
                                e.RequireApprovalAt.HasValue && e.RequireApprovalAt >= thirtyDaysAgo)
                    .OrderByDescending(e => e.RequireApprovalAt)
                    .Take(3)
                    .Select(e => new RecentActivityResponse
                    {
                        Id = e.Id,
                        Title = $"Sự kiện bị hủy: {e.Title}",
                        Description = e.ReasonCancel ?? "Bị hủy",
                        CreatedAt = e.RequireApprovalAt!.Value
                    })
                    .ToListAsync();

                var systemSettingChanges = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted && s.CreatedAt >= thirtyDaysAgo)
                    .OrderByDescending(s => s.CreatedAt)
                    .Take(3)
                    .Select(s => new RecentActivityResponse
                    {
                        Id = s.Id,
                        Title = "Thay đổi cài đặt hệ thống",
                        Description = $"Phí nền tảng: {s.FlatformFee:P2}, Phí cố định: {s.FixFee:N0} VNĐ, Ngày thanh toán: {s.DatePayout} ngày, Nhắc nhở sự kiện: {s.EventReminderHours} giờ",
                        CreatedAt = s.CreatedAt
                    })
                    .ToListAsync();

                activities.AddRange(recentUsers);
                activities.AddRange(recentEvents);
                activities.AddRange(recentOrganizerRequests);
                activities.AddRange(approvedEvents);
                activities.AddRange(rejectedEvents);
                activities.AddRange(cancelEvents);
                activities.AddRange(systemSettingChanges);

                var sortedActivities = activities
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((recentActivitiesPageNumber - 1) * recentActivitiesPageSize)
                    .Take(recentActivitiesPageSize)
                    .ToList();

                var totalActivitiesCount = activities.Count;

                response.RecentActivities = new BasePaginated<RecentActivityResponse>(
                    sortedActivities,
                    totalActivitiesCount,
                    recentActivitiesPageNumber,
                    recentActivitiesPageSize);

                return Result<SystemReportResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error getting system report: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result<List<OrganizerStatisticResponse>>> StatisticsOrganizersAsync(int year, OrganizerProfileStatus status)
        {
            try
            {
                var query = await _unitOfWork.OrganizerProfileRepository
                    .Query(false)
                    .AsNoTracking()
                    .Where(o => o.Status == status &&
                                o.ConfirmAt.HasValue &&
                                o.ConfirmAt.Value.Year == year)
                    .GroupBy(o => o.ConfirmAt!.Value.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        Total = g.Count()
                    })
                    .ToListAsync();

                var result = Enumerable.Range(1, 12)
                    .Select(month => new OrganizerStatisticResponse
                    {
                        Month = month,
                        TotalApproved = query.FirstOrDefault(x => x.Month == month)?.Total ?? 0
                    })
                    .ToList();

                return Result<List<OrganizerStatisticResponse>>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult(
                    $"Error getting organizer statistics: {ex.Message}",
                    ErrorCodes.InternalServerError);
            }
        }


        public async Task<Result<List<EventStatisticByMonthResponse>>> GetStatisticsEventsByMonthAsync(int year, EventStatus status)
        {
            try
            {
                var query = await _unitOfWork.EventRepository
                    .Query(false)
                    .AsNoTracking()
                    .Where(e => e.Status == status &&
                                e.RequireApprovalAt.HasValue &&
                                e.RequireApprovalAt.Value.Year == year)
                    .GroupBy(e => e.RequireApprovalAt!.Value.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        Total = g.Count()
                    })
                    .ToListAsync();

                var result = Enumerable.Range(1, 12)
                    .Select(month => new EventStatisticByMonthResponse
                    {
                        Month = month,
                        TotalApproved = query.FirstOrDefault(x => x.Month == month)?.Total ?? 0
                    })
                    .ToList();

                return Result<List<EventStatisticByMonthResponse>>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult(
                    $"Error getting event statistics: {ex.Message}",
                    ErrorCodes.InternalServerError);
            }
        }


        public async Task<Result<List<OrganizerStatisticResponse>>> GetTotalOrganizersCreatedEventsByMonthAsync(int year)
        {
            try
            {
                var query = await _unitOfWork.EventRepository
                    .Query(false)
                    .AsNoTracking()
                    .Where(e => e.CreatedAt.Year == year &&
                                !e.IsDeleted && 
                                e.Status != EventStatus.PendingApproval && 
                                e.Status != EventStatus.Rejected && 
                                e.Publish == true)
                    .GroupBy(e => e.CreatedAt.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        TotalOrganizers = g
                            .Select(x => x.OrganizerProfileId)
                            .Distinct()
                            .Count()
                    })
                    .ToListAsync();

                var result = Enumerable.Range(1, 12)
                    .Select(month => new OrganizerStatisticResponse
                    {
                        Month = month,
                        TotalApproved = query.FirstOrDefault(x => x.Month == month)?.TotalOrganizers ?? 0
                    })
                    .ToList();

                return Result<List<OrganizerStatisticResponse>>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult(
                    $"Error getting organizer event statistics: {ex.Message}",
                    ErrorCodes.InternalServerError
                );
            }
        }

        public async Task<Result<ApprovedSummaryResponse>> GetOrganizerAndEventApprovedSummaryAsync()
        {
            try
            {
                var totalApprovedOrganizers = await _unitOfWork.OrganizerProfileRepository
                    .Query(false)
                    .AsNoTracking()
                    .CountAsync(o => o.Status == OrganizerProfileStatus.Approved);

                var totalApprovedEvents = await _unitOfWork.EventRepository
                    .Query(false)
                    .AsNoTracking()
                    .CountAsync(e => e.Status != EventStatus.PendingApproval && !e.IsDeleted);

                var result = new ApprovedSummaryResponse
                {
                    TotalApprovedOrganizers = totalApprovedOrganizers,
                    TotalApprovedEvents = totalApprovedEvents
                };

                return Result<ApprovedSummaryResponse>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult(
                    $"Error getting approved summary: {ex.Message}",
                    ErrorCodes.InternalServerError
                );
            }
        }



        public async Task<Result<BasePaginated<PayoutHistoryResponse>>> GetPayoutHistoryAsync(string? search = null, int? year = null, int? month = null, int pageNumber = 1, int pageSize = 10)
        {
            IQueryable<RevenueReport> revenueQuery = _unitOfWork.RevenueReportRepository
                .Query()
                .AsNoTracking()
                .Include(r => r.OrganizerProfile)
                .Where(r => !r.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower().Trim();
                revenueQuery = revenueQuery.Where(r =>
                    r.OrganizerProfile.ContactName.ToLower().Contains(searchLower) ||
                    r.OrganizerProfile.ContactEmail.ToLower().Contains(searchLower) ||
                    (r.OrganizerProfile.CompanyName != null && r.OrganizerProfile.CompanyName.ToLower().Contains(searchLower)) ||
                    r.EventName.ToLower().Contains(searchLower));
            }

            if (year.HasValue)
                revenueQuery = revenueQuery.Where(r => r.ReportYear == year.Value);

            if (month.HasValue)
                revenueQuery = revenueQuery.Where(r => r.ReportMonth == month.Value);

            IQueryable<WalletTransaction> walletTransactionQuery = _unitOfWork.WalletTransactionRepository
                .Query()
                .AsNoTracking()
                .Include(wt => wt.Wallet)
                    .ThenInclude(w => w.User)
                .Where(wt => wt.Status == TransactionStatus.Success
                    && (wt.Type == TransactionType.Topup || wt.Type == TransactionType.Withdraw)
                    && !wt.IsDeleted);

            if (year.HasValue)
                walletTransactionQuery = walletTransactionQuery.Where(wt => wt.CreatedAt.Year == year.Value);

            if (month.HasValue)
                walletTransactionQuery = walletTransactionQuery.Where(wt => wt.CreatedAt.Month == month.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower().Trim();
                walletTransactionQuery = walletTransactionQuery.Where(wt =>
                    (wt.Wallet.User.FullName != null && wt.Wallet.User.FullName.ToLower().Contains(searchLower)) ||
                    (wt.Wallet.User.Email != null && wt.Wallet.User.Email.ToLower().Contains(searchLower)));
            }

            var revenueReports = await revenueQuery
                .OrderByDescending(r => r.PayoutDate)
                .ThenByDescending(r => r.CreatedAt)
                .ToListAsync();

            var walletTransactions = await walletTransactionQuery
                .OrderByDescending(wt => wt.CreatedAt)
                .ToListAsync();

            int totalCount = revenueReports.Count + walletTransactions.Count;

            var result = new List<PayoutHistoryResponse>(totalCount);

            foreach (var r in revenueReports)
            {
                result.Add(new PayoutHistoryResponse
                {
                    HistoryType = "Payout",
                    RevenueReportId = r.Id,
                    OrganizerProfileId = r.OrganizerProfileId,
                    OrganizerName = r.OrganizerProfile?.ContactName ?? string.Empty,
                    OrganizerEmail = r.OrganizerProfile?.ContactEmail ?? string.Empty,
                    CompanyName = r.OrganizerProfile?.CompanyName,
                    EventId = r.EventId,
                    EventName = r.EventName,
                    GrossRevenue = r.GrossRevenue,
                    PlatformFee = r.PlatformFee,
                    NetRevenue = r.NetRevenue,
                    Amount = r.NetRevenue,
                    ReportMonth = r.ReportMonth,
                    ReportYear = r.ReportYear,
                    TransactionDate = r.PayoutDate,
                    CreatedAt = r.CreatedAt,
                    Description = $"Payout cho sự kiện: {r.EventName}"
                });
            }
 
            foreach (var wt in walletTransactions)
            {
                var user = wt.Wallet?.User;
                if (user == null) continue;

                result.Add(new PayoutHistoryResponse
                {
                    HistoryType = wt.Type == TransactionType.Topup ? "Topup" : "Withdraw",
                    WalletTransactionId = wt.Id,
                    OrganizerName = user.FullName ?? string.Empty,
                    OrganizerEmail = user.Email ?? string.Empty,
                    Amount = wt.Amount,
                    ReportMonth = wt.CreatedAt.Month,
                    ReportYear = wt.CreatedAt.Year,
                    TransactionDate = wt.CreatedAt.DateTime,
                    CreatedAt = wt.CreatedAt,
                    Description = wt.Description,
                    TransactionType = wt.Type
                });
            }
             
            var paginatedResult = result
                .OrderByDescending(x => x.TransactionDate ?? x.CreatedAt.DateTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new BasePaginated<PayoutHistoryResponse>(paginatedResult, totalCount, pageNumber, pageSize);
        }

        private decimal CalculatePlatformFeeForEvent(
            decimal? platformFee, 
            decimal totalAmount, 
            DateTime? saleStartTime,
            List<SystemSetting> allSystemSettings,
            SystemSetting? defaultSetting)
        {
            if (platformFee.HasValue && platformFee.Value > 0)
                return platformFee.Value;

            if (totalAmount <= 0)
                return 0;

            SystemSetting? setting = null;
            if (saleStartTime.HasValue)
                setting = allSystemSettings
                        .FirstOrDefault(s => s.UpdatedAt <= saleStartTime.Value && !s.IsDeleted);

            setting ??= defaultSetting;

            if (setting == null)
                return 0;

            decimal calculatedPlatformFee = totalAmount * setting.FlatformFee + setting.FixFee;
            decimal netRevenue = totalAmount - calculatedPlatformFee;

            if (netRevenue < 0)
                return totalAmount;

            return calculatedPlatformFee;
        }
    }
}
