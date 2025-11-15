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
};

