import fetcher from "./fetcher";

export const friendAPI = {
  /**
   * Lấy danh sách bạn bè với phân trang
   * @param {Object} params - Tham số phân trang
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @param {string} params.status - Lọc theo trạng thái: Pending, Accepted, Rejected, Blocked, Canceled (tùy chọn)
   * @returns {Promise} Response từ API
   */
  getFriends: async (params = {}) => {
    const { pageNumber = 1, pageSize = 10, status } = params;
    const queryParams = {
      pageNumber,
      pageSize,
    };
    
    // Chỉ thêm status vào params nếu có giá trị
    if (status) {
      queryParams.status = status;
    }
    
    const response = await fetcher.get("/friend", {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Tìm kiếm bạn bè
   * @param {Object} params - Tham số tìm kiếm
   * @param {string} params.keyword - Từ khóa tìm kiếm (tên, email hoặc sở thích)
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @returns {Promise} Response từ API
   */
  searchFriends: async (params = {}) => {
    const { keyword = "", pageNumber = 1, pageSize = 10 } = params;
    const response = await fetcher.get("/friend/search", {
      params: {
        keyword,
        pageNumber,
        pageSize,
      },
    });
    return response.data;
  },

  /**
   * Lấy danh sách lời mời kết bạn
   * @param {Object} params - Tham số phân trang
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @returns {Promise} Response từ API
   */
  getFriendRequests: async (params = {}) => {
    const { pageNumber = 1, pageSize = 10 } = params;
    const response = await fetcher.get("/friend/request", {
      params: {
        pageNumber,
        pageSize,
      },
    });
    return response.data;
  },

  /**
   * Chấp nhận hoặc từ chối lời mời kết bạn
   * @param {string} requestId - ID của lời mời kết bạn
   * @param {boolean} isAccepted - true để chấp nhận, false để từ chối
   * @returns {Promise} Response từ API
   */
  respondToFriendRequest: async (requestId, isAccepted) => {
    const response = await fetcher.patch(`/friend/${requestId}`, null, {
      params: {
        isAccepted: isAccepted
      }
    });
    return response.data;
  },

  /**
   * Chấp nhận lời mời kết bạn
   * @param {string} requestId - ID của lời mời kết bạn
   * @returns {Promise} Response từ API
   */
  acceptFriendRequest: async (requestId) => {
    const response = await fetcher.patch(`/friend/${requestId}`, null, {
      params: {
        isAccepted: true
      }
    });
    return response.data;
  },

  /**
   * Từ chối lời mời kết bạn
   * @param {string} requestId - ID của lời mời kết bạn
   * @returns {Promise} Response từ API
   */
  rejectFriendRequest: async (requestId) => {
    const response = await fetcher.patch(`/friend/${requestId}`, null, {
      params: {
        isAccepted: false
      }
    });
    return response.data;
  },

  /**
   * Gửi lời mời kết bạn
   * @param {string} userId - ID của người dùng muốn kết bạn
   * @returns {Promise} Response từ API
   */
  addFriend: async (userId) => {
    const response = await fetcher.post(`/friend/${userId}`);
    return response.data;
  },

  /**
   * Hủy kết bạn
   * @param {string} friendId - ID của bạn bè cần hủy kết bạn
   * @returns {Promise} Response từ API
   */
  deleteFriend: async (friendId) => {
    const response = await fetcher.delete(`/friend/${friendId}`);
    return response.data;
  },

  /**
   * Lấy thông tin profile của bạn bè
   * @param {string} friendId - ID của bạn bè
   * @returns {Promise} Response từ API
   */
  getFriendProfile: async (friendId) => {
    const response = await fetcher.get(`/friend/${friendId}`);
    return response.data;
  },

  /**
   * Chặn bạn bè
   * @param {string} friendId - ID của bạn bè cần chặn
   * @returns {Promise} Response từ API
   */
  blockFriend: async (friendId) => {
    const response = await fetcher.patch(`/friend/${friendId}/block`);
    return response.data;
  },

  /**
   * Gỡ chặn bạn bè
   * @param {string} friendId - ID của bạn bè cần gỡ chặn
   * @returns {Promise} Response từ API
   */
  unblockFriend: async (friendId) => {
    const response = await fetcher.patch(`/friend/${friendId}/unblock`);
    return response.data;
  },

  /**
   * Lấy danh sách bạn bè và tọa độ của họ để hiển thị trên map
   * @param {Object} params - Tham số tìm kiếm
   * @param {number} params.radius - Bán kính tìm kiếm (km) - sẽ chuyển sang mét khi gọi API
   * @param {number} params.latitude - Vĩ độ của người dùng
   * @param {number} params.longitude - Kinh độ của người dùng
   * @returns {Promise} Response từ API chứa danh sách bạn bè với latitude và longitude
   */
  getFriendsLocation: async (params = {}) => {
    const { radius, latitude, longitude } = params;
    const queryParams = new URLSearchParams();
    
    // Backend nhận radius là mét, nhưng frontend dùng km
    if (radius !== undefined && radius !== null) {
      queryParams.append('radius', (radius * 1000).toString()); // Chuyển km sang mét
    }
    if (latitude !== undefined && latitude !== null) {
      queryParams.append('latitude', latitude.toString());
    }
    if (longitude !== undefined && longitude !== null) {
      queryParams.append('longitude', longitude.toString());
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/friend/location?${queryString}` : '/friend/location';
    const response = await fetcher.get(url);
    return response.data?.data || response.data;
  },
};

// Get AI recommended friends
friendAPI.getAIRecommendedFriends = async (pageNumber = 1, pageSize = 5) => {
  const queryParams = new URLSearchParams();
  queryParams.append('pageNumber', pageNumber);
  queryParams.append('pageSize', pageSize);

  const response = await fetcher.get(`/ai/friend?${queryParams.toString()}`);
  return response.data?.data || response.data;
};

export default friendAPI;

