namespace AIEvent.Infrastructure.Data
{
    public static class StoreProcedureScripts
    {
        public static string GetAdminDashboardSummary => @"
        IF OBJECT_ID('dbo.usp_GetAdminDashboardSummary','P') IS NULL
        CREATE PROCEDURE dbo.usp_GetAdminDashboardSummary
        AS
        BEGIN
            SET NOCOUNT ON;
            -- Thống kê người dùng
            SELECT
                COUNT(*) AS TotalUsers,
                SUM(CASE WHEN r.Name = 'User' THEN 1 ELSE 0 END) AS TotalNormalUsers,
                SUM(CASE WHEN r.Name = 'Organizer' THEN 1 ELSE 0 END) AS TotalOrganizers,
                SUM(CASE WHEN r.Name = 'Manager' THEN 1 ELSE 0 END) AS TotalManagers,
                SUM(CASE WHEN r.Name = 'Staff' THEN 1 ELSE 0 END) AS TotalStaff,
                SUM(CASE WHEN u.IsLocked = 1 THEN 1 ELSE 0 END) AS TotalLockedUsers
            FROM Users u
            INNER JOIN Roles r ON u.RoleId = r.Id
            WHERE u.IsDeleted = 0;

            -- Thống kê sự kiện
            SELECT
                COUNT(*) AS TotalEvents,
                SUM(CASE WHEN e.Status = 0 THEN 1 ELSE 0 END) AS TotalPending,
                SUM(CASE WHEN e.Status = 1 THEN 1 ELSE 0 END) AS TotalApproved,
                SUM(CASE WHEN e.Status = 2 THEN 1 ELSE 0 END) AS TotalRejected,
                SUM(CASE WHEN e.Status = 3 THEN 1 ELSE 0 END) AS TotalOngoing,
                SUM(CASE WHEN e.Status = 4 THEN 1 ELSE 0 END) AS TotalEnded
            FROM Events e
            WHERE e.IsDeleted = 0;

            -- Thống kê báo cáo
            SELECT
                COUNT(*) AS TotalReports,
                SUM(CASE WHEN Type = 'Event' THEN 1 ELSE 0 END) AS ReportEvent,
                SUM(CASE WHEN Type = 'Comment' THEN 1 ELSE 0 END) AS ReportComment,
                SUM(CASE WHEN Type = 'User' THEN 1 ELSE 0 END) AS ReportUser,
                SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) AS PendingReports,
                SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) AS ResolvedReports
            FROM Reports
            WHERE IsDeleted = 0;

            -- Thống kê tài chính
            SELECT
                ISNULL(SUM(wt.Amount), 0) AS TotalRevenue,
                ISNULL(SUM(CASE WHEN wt.Type = 'Refund' THEN wt.Amount ELSE 0 END), 0) AS TotalRefund,
                ISNULL(SUM(wt.Fee), 0) AS TotalServiceFee
            FROM WalletTransactions wt
            WHERE wt.Type IN ('Revenue', 'Refund') AND wt.IsDeleted = 0;
        END
        ";

        public static string GetAdminUsers => @"
        IF OBJECT_ID('dbo.usp_GetAdminUsers','P') IS NULL
        CREATE PROCEDURE dbo.usp_GetAdminUsers
            @Search NVARCHAR(100) = NULL,
            @RoleName NVARCHAR(50) = NULL,
            @Page INT = 1,
            @PageSize INT = 20
        AS
        BEGIN
            SET NOCOUNT ON;
            DECLARE @Offset INT = (@Page - 1) * @PageSize;

            WITH UserCTE AS (
                SELECT 
                    u.Id,
                    u.FullName,
                    u.Email,
                    r.Name AS RoleName,
                    u.IsLocked,
                    u.CreatedAt,
                    ROW_NUMBER() OVER (ORDER BY u.CreatedAt DESC) AS RowNum,
                    COUNT(*) OVER () AS TotalCount
                FROM Users u
                INNER JOIN Roles r ON u.RoleId = r.Id
                WHERE u.IsDeleted = 0
                  AND (@Search IS NULL OR u.FullName LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%')
                  AND (@RoleName IS NULL OR r.Name = @RoleName)
            )
            SELECT Id, FullName, Email, RoleName, IsLocked, CreatedAt, TotalCount
            FROM UserCTE
            WHERE RowNum BETWEEN @Offset + 1 AND @Offset + @PageSize
            ORDER BY CreatedAt DESC;
        END
        ";
        
        public static string GetAdminEvents => @"
        IF OBJECT_ID('dbo.usp_GetAdminEvents','P') IS NULL
        CREATE PROCEDURE dbo.usp_GetAdminEvents
            @Status INT = NULL,
            @Search NVARCHAR(200) = NULL,
            @CategoryId UNIQUEIDENTIFIER = NULL,
            @Page INT = 1,
            @PageSize INT = 20
        AS
        BEGIN
            SET NOCOUNT ON;
            DECLARE @Offset INT = (@Page - 1) * @PageSize;

            WITH EventCTE AS (
                SELECT 
                    e.Id,
                    e.Title,
                    op.ContactName AS OrganizerName,
                    ec.CategoryName,
                    e.StartTime,
                    e.TotalTickets,
                    e.Status,
                    AVG(r.Rating) AS AvgRating,
                    ROW_NUMBER() OVER (ORDER BY e.CreatedAt DESC) AS RowNum,
                    COUNT(*) OVER () AS TotalCount
                FROM Events e
                INNER JOIN OrganizerProfiles op ON e.OrganizerProfileId = op.Id
                INNER JOIN EventCategories ec ON e.EventCategoryId = ec.Id
                LEFT JOIN Ratings r ON e.Id = r.EventId AND r.IsDeleted = 0
                WHERE e.IsDeleted = 0
                  AND (@Status IS NULL OR e.Status = @Status)
                  AND (@Search IS NULL OR e.Title LIKE '%' + @Search + '%')
                  AND (@CategoryId IS NULL OR e.EventCategoryId = @CategoryId)
                GROUP BY e.Id, e.Title, op.ContactName, ec.CategoryName, e.StartTime, e.TotalTickets, e.Status
            )
            SELECT Id, Title, OrganizerName, CategoryName, StartTime, TotalTickets, Status, AvgRating, TotalCount
            FROM EventCTE
            WHERE RowNum BETWEEN @Offset + 1 AND @Offset + @PageSize
            ORDER BY StartTime DESC;
        END
        ";
        public static string GetAdminEventCheckInList => @"
        IF OBJECT_ID('dbo.usp_GetAdminEventCheckInList','P') IS NULL
        CREATE PROCEDURE dbo.usp_GetAdminEventCheckInList
            @EventId UNIQUEIDENTIFIER,
            @Search NVARCHAR(100) = NULL
        AS
        BEGIN
            SET NOCOUNT ON;
            SELECT 
                t.TicketCode,
                u.FullName AS UserName,
                tt.TicketName,
                t.CheckInTime,
                CASE WHEN t.CheckInTime IS NOT NULL THEN 1 ELSE 0 END AS IsCheckedIn
            FROM Tickets t
            INNER JOIN BookingItems bi ON t.BookingItemId = bi.Id
            INNER JOIN TicketTypes tt ON bi.TicketTypeId = tt.Id
            INNER JOIN Bookings b ON bi.BookingId = b.Id
            INNER JOIN Users u ON b.UserId = u.Id
            WHERE t.EventId = @EventId AND t.IsDeleted = 0
              AND (@Search IS NULL OR t.TicketCode LIKE '%' + @Search + '%' OR u.FullName LIKE '%' + @Search + '%')
            ORDER BY t.CheckInTime DESC;
        END
        ";

        public static string GetAdminFinancialSummary => @"
        IF OBJECT_ID('dbo.usp_GetAdminFinancialSummary','P') IS NULL
        CREATE PROCEDURE dbo.usp_GetAdminFinancialSummary
            @Month INT = NULL,
            @Year INT = NULL
        AS
        BEGIN
            SET NOCOUNT ON;
            SELECT
                ISNULL(SUM(wt.Amount), 0) AS TotalRevenue,
                ISNULL(SUM(CASE WHEN wt.Type = 'Withdraw' AND wr.Status = 1 THEN wr.Amount ELSE 0 END), 0) AS TotalPayout,
                ISNULL(SUM(wt.Fee), 0) AS TotalPlatformFee,
                COUNT(DISTINCT b.Id) AS TotalBookings
            FROM WalletTransactions wt
            LEFT JOIN Bookings b ON wt.ReferenceId = b.Id AND wt.ReferenceType = 'Booking'
            LEFT JOIN WithdrawRequests wr ON wt.ReferenceId = wr.Id AND wt.ReferenceType = 'Withdraw'
            WHERE wt.IsDeleted = 0
              AND (@Month IS NULL OR MONTH(wt.CreatedAt) = @Month)
              AND (@Year IS NULL OR YEAR(wt.CreatedAt) = @Year);
        END
        ";

        public static string GetAdminWithdrawRequests => @"
        IF OBJECT_ID('dbo.usp_GetAdminWithdrawRequests','P') IS NULL
        CREATE PROCEDURE dbo.usp_GetAdminWithdrawRequests
            @Status INT = NULL,
            @Page INT = 1,
            @PageSize INT = 10
        AS
        BEGIN
            SET NOCOUNT ON;
            DECLARE @Offset INT = (@Page - 1) * @PageSize;

            WITH WithdrawCTE AS (
                SELECT 
                    wr.Id,
                    u.FullName AS UserName,
                    wr.Amount,
                    wr.BankName,
                    wr.BankAccountNumber,
                    wr.Status,
                    wr.CreatedAt,
                    COUNT(*) OVER () AS TotalCount
                FROM WithdrawRequests wr
                INNER JOIN Users u ON wr.UserId = u.Id
                WHERE wr.IsDeleted = 0
                  AND (@Status IS NULL OR wr.Status = @Status)
            )
            SELECT Id, UserName, Amount, BankName, BankAccountNumber, Status, CreatedAt, TotalCount
            FROM WithdrawCTE
            WHERE RowNum BETWEEN @Offset + 1 AND @Offset + @PageSize
            ORDER BY CreatedAt DESC;
        END
        ";

    }
}