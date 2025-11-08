import fetcher from "./fetcher";

export const friendAPI = {
  /**
   * Lấy danh sách bạn bè với phân trang
   * @param {Object} params - Tham số phân trang
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @returns {Promise} Response từ API
   */
  getFriends: async (params = {}) => {
    const { pageNumber = 1, pageSize = 10 } = params;
    const response = await fetcher.get("/friend", {
      params: {
        pageNumber,
        pageSize,
      },
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
};

export default friendAPI;

