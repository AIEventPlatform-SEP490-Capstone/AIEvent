import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class FriendService {
  /**
   * Lấy danh sách bạn bè với phân trang
   * @param {Object} params - Tham số phân trang
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @param {string} params.status - Lọc theo trạng thái: Accepted, Blocked, Canceled (tùy chọn)
   * @returns {Promise} Response từ API
   */
  static async getFriends(params = {}) {
    try {
      const { pageNumber = 1, pageSize = 10, status } = params;
      let url = `${EndUrls.FRIENDS}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (status) {
        url += `&status=${encodeURIComponent(status)}`;
      }
      const data = await BaseApiService.get(url);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Friends fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch friends',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch friends',
        error: error.message,
      };
    }
  }

  /**
   * Tìm kiếm bạn bè
   * @param {Object} params - Tham số tìm kiếm
   * @param {string} params.keyword - Từ khóa tìm kiếm (tên, email hoặc sở thích)
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @returns {Promise} Response từ API
   */
  static async searchFriends(params = {}) {
    try {
      const { keyword = "", pageNumber = 1, pageSize = 10 } = params;
      const url = `${EndUrls.FRIENDS_SEARCH}?keyword=${encodeURIComponent(keyword)}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
      const data = await BaseApiService.get(url);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Search completed successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to search friends',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to search friends',
        error: error.message,
      };
    }
  }

  /**
   * Lấy danh sách lời mời kết bạn
   * @param {Object} params - Tham số phân trang
   * @param {number} params.pageNumber - Số trang (mặc định: 1)
   * @param {number} params.pageSize - Số lượng item mỗi trang (mặc định: 10)
   * @returns {Promise} Response từ API
   */
  static async getFriendRequests(params = {}) {
    try {
      const { pageNumber = 1, pageSize = 10 } = params;
      const url = `${EndUrls.FRIEND_REQUESTS}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
      const data = await BaseApiService.get(url);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Friend requests fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch friend requests',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch friend requests',
        error: error.message,
      };
    }
  }

  /**
   * Chấp nhận lời mời kết bạn
   * @param {string} requestId - ID của lời mời kết bạn
   * @returns {Promise} Response từ API
   */
  static async acceptFriendRequest(requestId) {
    try {
      const url = `${EndUrls.FRIEND_REQUEST_RESPOND(requestId)}?isAccepted=true`;
      // PATCH request without body, only query parameter
      const data = await BaseApiService.patch(url);
      
      const statusCode = data?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20001" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Friend request accepted successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to accept friend request',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to accept friend request',
        error: error.message,
      };
    }
  }

  /**
   * Từ chối lời mời kết bạn
   * @param {string} requestId - ID của lời mời kết bạn
   * @returns {Promise} Response từ API
   */
  static async rejectFriendRequest(requestId) {
    try {
      const url = `${EndUrls.FRIEND_REQUEST_RESPOND(requestId)}?isAccepted=false`;
      // PATCH request without body, only query parameter
      const data = await BaseApiService.patch(url);
      
      const statusCode = data?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20001" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Friend request rejected successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to reject friend request',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to reject friend request',
        error: error.message,
      };
    }
  }

  /**
   * Gửi lời mời kết bạn
   * @param {string} userId - ID của người dùng muốn kết bạn
   * @returns {Promise} Response từ API
   */
  static async addFriend(userId) {
    try {
      const url = EndUrls.ADD_FRIEND(userId);
      const data = await BaseApiService.post(url, {});
      
      const statusCode = data?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20001" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Friend request sent successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to send friend request',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to send friend request',
        error: error.message,
      };
    }
  }

  /**
   * Hủy kết bạn
   * @param {string} friendId - ID của bạn bè cần hủy kết bạn
   * @returns {Promise} Response từ API
   */
  static async deleteFriend(friendId) {
    try {
      const url = EndUrls.DELETE_FRIEND(friendId);
      const data = await BaseApiService.delete(url);
      
      const statusCode = data?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20001" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Friend removed successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to remove friend',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to remove friend',
        error: error.message,
      };
    }
  }

  /**
   * Lấy thông tin profile của bạn bè
   * @param {string} friendId - ID của bạn bè
   * @returns {Promise} Response từ API
   */
  static async getFriendProfile(friendId) {
    try {
      const url = EndUrls.FRIEND_PROFILE(friendId);
      const data = await BaseApiService.get(url);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Friend profile fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch friend profile',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch friend profile',
        error: error.message,
      };
    }
  }

  /**
   * Chặn bạn bè
   * @param {string} friendId - ID của bạn bè cần chặn
   * @returns {Promise} Response từ API
   */
  static async blockFriend(friendId) {
    try {
      const url = EndUrls.BLOCK_FRIEND(friendId);
      const data = await BaseApiService.patch(url);
      
      const statusCode = data?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20001" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Friend blocked successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to block friend',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to block friend',
        error: error.message,
      };
    }
  }

  /**
   * Gỡ chặn bạn bè
   * @param {string} friendId - ID của bạn bè cần gỡ chặn
   * @returns {Promise} Response từ API
   */
  static async unblockFriend(friendId) {
    try {
      const url = EndUrls.UNBLOCK_FRIEND(friendId);
      const data = await BaseApiService.patch(url);
      
      const statusCode = data?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20001" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Friend unblocked successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to unblock friend',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to unblock friend',
        error: error.message,
      };
    }
  }
}

export default FriendService;

