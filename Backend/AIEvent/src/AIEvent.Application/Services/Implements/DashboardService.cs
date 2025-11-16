using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Dashboard;
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

        public async Task<Result<SystemSettingResponse>> GetSystemSetting(string adminId)
        {
            var systemSetting = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .FirstOrDefaultAsync(s => s.CreatedBy == adminId && !s.IsDeleted);

            if (systemSetting == null)
            {
                return ErrorResponse.FailureResult("No Permission", ErrorCodes.PermissionDenied);
            }

            SystemSettingResponse request = new()
            {
                DatePayout = systemSetting.DatePayout,
                FixFee = systemSetting.FixFee,
                FlatformFee = systemSetting.FlatformFee,
                UpdateAt = systemSetting.UpdatedAt,
            };

            return Result<SystemSettingResponse>.Success(request);
        }

        public async Task<Result<AdminDashboardResponse>> GetAdminDashboardAsync(int pendingEventsPageNumber = 1, int pendingEventsPageSize = 10, 
                                                                                 int pendingOrganizersPageNumber = 1, int pendingOrganizersPageSize = 10,
                                                                                 int newUsersPageNumber = 1, int newUsersPageSize = 10)
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
 
                var organizerRoleId = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Where(r => r.Name == "Organizer" && !r.IsDeleted)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();
                 
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
 
                response.PendingOrganizerRequestsCount = await _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .AsNoTracking()
                    .Where(o => !o.IsDeleted && o.Status == OrganizerProfileStatus.Pending)
                    .CountAsync();
 
                var pendingEventsQuery = _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.Status == EventStatus.PendingApproval && e.Publish == true);

                var pendingEventsTotalCount = await pendingEventsQuery.CountAsync();

                var pendingEventsList = await pendingEventsQuery
                    .OrderByDescending(e => e.CreatedAt)
                    .Skip((pendingEventsPageNumber - 1) * pendingEventsPageSize)
                    .Take(pendingEventsPageSize)
                    .Select(e => new PendingEventResponse
                    {
                        EventId = e.Id,
                        Title = e.Title,
                        CreatedAt = e.CreatedAt,
                        EventImg = !string.IsNullOrEmpty(e.ImgListEvent) ? e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() : string.Empty
                    })
                    .ToListAsync();

                response.PendingEvents = new BasePaginated<PendingEventResponse>(pendingEventsList, pendingEventsTotalCount, pendingEventsPageNumber, pendingEventsPageSize);
 
                var pendingOrganizersQuery = _unitOfWork.OrganizerProfileRepository
                    .Query()
                    .AsNoTracking()
                    .Where(o => !o.IsDeleted && o.Status == OrganizerProfileStatus.Pending);

                var pendingOrganizersTotalCount = await pendingOrganizersQuery.CountAsync();

                var pendingOrganizersList = await pendingOrganizersQuery
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((pendingOrganizersPageNumber - 1) * pendingOrganizersPageSize)
                    .Take(pendingOrganizersPageSize)
                    .Select(o => new PendingOrganizerRequestResponse
                    {
                        OrganizerId = o.Id,
                        CompanyImg = o.ImgCompany,
                        ContactName = o.ContactName,
                        CompanyName = o.CompanyName,
                        CreatedAt = o.CreatedAt
                    })
                    .ToListAsync();

                response.PendingOrganizerRequests = new BasePaginated<PendingOrganizerRequestResponse>(pendingOrganizersList, pendingOrganizersTotalCount, pendingOrganizersPageNumber, pendingOrganizersPageSize);
 
                var thirtyDaysAgo = now.AddDays(-30);
                var newUsersQuery = _unitOfWork.UserRepository
                    .Query()
                    .AsNoTracking()
                    .Include(u => u.Role)
                    .Where(u => !u.IsDeleted && u.RoleId != adminRoleId && u.CreatedAt >= thirtyDaysAgo);

                var newUsersTotalCount = await newUsersQuery.CountAsync();

                var newUsersList = await newUsersQuery
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((newUsersPageNumber - 1) * newUsersPageSize)
                    .Take(newUsersPageSize)
                    .Select(u => new NewUserResponse
                    {
                        UserId = u.Id,
                        FullName = u.FullName ?? string.Empty,
                        Email = u.Email ?? string.Empty,
                        RoleName = u.Role.Name,
                        ImgProfile = u.AvatarImgUrl
                    })
                    .ToListAsync();

                response.NewUsers = new BasePaginated<NewUserResponse>(newUsersList, newUsersTotalCount, newUsersPageNumber, newUsersPageSize);

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
                    .Where(e => !e.IsDeleted);
 
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
                    .Where(e => !e.IsDeleted && e.CreatedAt >= currentMonthStart)
                    .CountAsync();
 
                 monthlyStats.Revenue = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => !e.IsDeleted && e.CreatedAt >= currentMonthStart)
                    .SumAsync(e => e.TotalAmount);

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

                activities.AddRange(recentUsers);
                activities.AddRange(recentEvents);
                activities.AddRange(recentOrganizerRequests);
                activities.AddRange(approvedEvents);
                activities.AddRange(rejectedEvents);
                activities.AddRange(cancelEvents);

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
    }
}
