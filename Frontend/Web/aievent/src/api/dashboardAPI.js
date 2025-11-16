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
};

