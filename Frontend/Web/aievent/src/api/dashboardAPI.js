import fetcher from "./fetcher";

export const dashboardAPI = {
  // GET: Lấy cài đặt hệ thống
  getSystemSettings: async () => {
    const response = await fetcher.get("/dashboard/system-setting");
    return response.data?.data || response.data;
  },

  // PATCH: Cập nhật cài đặt hệ thống
  updateSystemSettings: async (settingsData) => {
    const response = await fetcher.patch("/dashboard/system-setting", settingsData);
    return response.data?.data || response.data;
  },

  // GET: Báo cáo hệ thống cho Admin (thống kê tháng + hoạt động gần đây)
  getAdminSystemReport: async ({ pageNumber = 1, pageSize = 10 } = {}) => {
    const response = await fetcher.get("/dashboard/admin/system-report", {
      params: {
        recentActivitiesPageNumber: pageNumber,
        recentActivitiesPageSize: pageSize,
      },
    });
    // API format: { statusCode, message, data }
    return response.data?.data || response.data;
  },

  // GET: Admin - Event Management list (paging)
  getAdminEventManagement: async ({ pageNumber = 1, pageSize = 10 } = {}) => {
    const response = await fetcher.get("/dashboard/admin/event-management", {
      params: { pageNumber, pageSize },
    });
    return response.data?.data || response.data;
  },

  // GET: Admin overview metrics
  getAdminOverview: async ({ year, month } = {}) => {
    const response = await fetcher.get("/dashboard/admin-overview", {
      params: {
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
      },
    });
    return response.data?.data || response.data;
  },

  // GET: Organizer - Event Statistics
  getEventStatistics: async (filter = null) => {
    const response = await fetcher.get("/dashboard/event-statistics", {
      params: filter,
    });
    return response.data?.data || response.data;
  },

  // GET: Organizer - Buyer Statistics
  getBuyerStatistics: async (filter = null) => {
    const response = await fetcher.get("/dashboard/buyer-statistics", {
      params: filter,
    });
    return response.data?.data || response.data;
  },

  // GET: Organizer - Check-in Statistics
  getCheckInStatistics: async (filter = null) => {
    const response = await fetcher.get("/dashboard/checkin-statistics", {
      params: filter,
    });
    return response.data?.data || response.data;
  },

  // GET: Organizer - Revenue Statistics
  getRevenueStatistics: async (filter = null) => {
    const response = await fetcher.get("/dashboard/revenue-statistics", {
      params: filter,
    });
    return response.data?.data || response.data;
  },

  // GET: Organizer - Net Revenue Statistics
  getNetRevenueStatistics: async (filter = null) => {
    const response = await fetcher.get("/dashboard/net-revenue-statistics", {
      params: filter,
    });
    return response.data?.data || response.data;
  },

  // GET: Organizer - Revenue by Category/Tag
  getRevenueByCategoryTag: async (filter = null) => {
    const response = await fetcher.get("/dashboard/revenue-by-category-tag", {
      params: filter,
    });
    return response.data?.data || response.data;
  },

  // GET: Manager - Organizer Approved Statistics
  getOrganizerApprovedStatistics: async ({ year, status } = {}) => {
    const response = await fetcher.get("/dashboard/organizer-approved-statistics", {
      params: {
        ...(year ? { year } : {}),
        ...(status ? { status } : {}),
      },
    });
    return response.data?.data || response.data;
  },

  // GET: Manager - Event Month Statistics
  getEventMonthStatistics: async ({ year, status } = {}) => {
    const response = await fetcher.get("/dashboard/event-month-statistics", {
      params: {
        ...(year ? { year } : {}),
        ...(status ? { status } : {}),
      },
    });
    return response.data?.data || response.data;
  },

  // GET: Manager - Organizer Join Statistics
  getOrganizerJoinStatistics: async ({ year } = {}) => {
    const response = await fetcher.get("/dashboard/organizer-join-statistics", {
      params: {
        ...(year ? { year } : {}),
      },
    });
    return response.data?.data || response.data;
  },

  // GET: Manager - Total Organizer Event
  getTotalOrganizerEvent: async () => {
    const response = await fetcher.get("/dashboard/total-organizer-event");
    return response.data?.data || response.data;
  },
};