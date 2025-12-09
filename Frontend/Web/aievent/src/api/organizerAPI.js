import fetcher from "./fetcher";

export const organizerAPI = {
  // Lấy danh sách Organizer
  getOrganizers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.pageNumber) queryParams.append("pageNumber", params.pageNumber);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);
    if (params.status) queryParams.append("status", params.status);

    const response = await fetcher.get(`/organizer?${queryParams.toString()}`);
    return response.data?.data || response.data;
  },

  // Lấy thông tin chi tiết 1 Organizer theo ID
  getOrganizerById: async (id) => {
    const response = await fetcher.get(`/organizer/${id}`);
    return response.data?.data || response.data;
  },

  // Lấy hồ sơ Organizer hiện tại (đang đăng nhập)
  getOrganizerProfile: async () => {
    const response = await fetcher.get(`/organizer/profile`);
    return response.data?.data || response.data;
  },

  // Đăng kí thành Organizer
  createOrganizer: async (data) => {
    // Nếu data đã là FormData thì dùng trực tiếp
    let formData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
    }

    // Debug: in ra các entries (bỏ comment khi chuyển production)
    // for (const pair of formData.entries()) {
    //   console.log("FormData:", pair[0], pair[1]);
    // }

    const response = await fetcher.post("/organizer", formData, {
      headers: { "Content-Type": "multipart/form-data" }, // axios sẽ set boundary tự động
    });

    return response.data;
  },

  // Cập nhật Organizer (PATCH)
  updateOrganizer: async (data) => {
    let formData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
    }

    const response = await fetcher.patch("/organizer", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data?.data || response.data;
  },

  // Xác nhận / từ chối Organizer (PATCH:/api/organizer/confirm/{id})
  confirmOrganizer: async (id, confirmData) => {
    const payload = {
      status: confirmData.status,
      reason: confirmData.reason || null,
    };

    const response = await fetcher.patch(`/organizer/confirm/${id}`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data?.data || response.data;
  },

  // Lấy danh sách organizer và sự kiện bị gán cờ
  getOrganizerFlags: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.organizerId) queryParams.append("organizerId", params.organizerId);
    if (params.minFlags !== undefined && params.minFlags !== null) queryParams.append("minFlags", params.minFlags);
    if (params.pageNumber) queryParams.append("pageNumber", params.pageNumber);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize);

    const query = queryParams.toString();
    const response = await fetcher.get(
      query ? `/organizer/flags?${query}` : "/organizer/flags"
    );
    return response.data?.data || response.data;
  },
};

export default organizerAPI;
