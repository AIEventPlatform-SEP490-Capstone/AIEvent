import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class AIChatService {
  /**
   * Send a chat message to AI
   * @param {string} userPrompt - User's message
   * @param {string|null} sessionId - Optional session ID for continuing conversation
   */
  static async sendChatMessage(userPrompt, sessionId = null) {
    try {
      const requestBody = {
        userPrompt: userPrompt,
        sessionId: sessionId,
      };

      const response = await BaseApiService.post(EndUrls.AI_CHAT, requestBody);
      
      // Extract data from response
      // Response structure: { statusCode, message, data }
      // data is a string containing the AI response
      let data = response;
      if (response.data) {
        data = response.data;
      }

      // Note: If the API returns sessionId in the response (e.g., in headers or response body),
      // extract it here. For now, we'll track sessionId on the client side.
      // Example: const sessionId = response.sessionId || response.headers?.sessionId;

      return {
        success: true,
        data: data, // This is the AI response string
        message: response.message || 'Message sent successfully',
        statusCode: response.statusCode,
        // sessionId: sessionId, // Uncomment if API returns sessionId
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      return {
        success: false,
        data: null,
        message: `Failed to send message: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get chat history for a session
   * @param {string} sessionId - Session ID
   * @param {object} params - Pagination parameters
   */
  static async getChatHistory(sessionId, params = {}) {
    try {
      const {
        pageNumber = 1,
        pageSize = 20,
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('sessionId', sessionId);
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);

      const url = `${EndUrls.AI_CHAT_HISTORY}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      
      // Extract data from response
      let data = response;
      if (response.data) {
        data = response.data;
      }

      return {
        success: true,
        data: {
          items: data.items || data.Items || [],
          pagination: {
            totalItems: data.totalItems || data.TotalItems || 0,
            currentPage: data.currentPage || data.CurrentPage || pageNumber,
            totalPages: data.totalPages || data.TotalPages || 1,
            pageSize: data.pageSize || data.PageSize || pageSize,
            hasPreviousPage: data.hasPreviousPage || data.HasPreviousPage || false,
            hasNextPage: data.hasNextPage || data.HasNextPage || false,
          },
        },
        message: response.message || 'History fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return {
        success: false,
        data: {
          items: [],
          pagination: null,
        },
        message: `Failed to fetch history: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get all chat sessions
   * @param {object} params - Pagination parameters
   */
  static async getChatSessions(params = {}) {
    try {
      const {
        pageNumber = 1,
        pageSize = 20,
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);

      const url = `${EndUrls.AI_CHAT_SESSIONS}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      
      // Extract data from response
      let data = response;
      if (response.data) {
        data = response.data;
      }

      return {
        success: true,
        data: {
          items: data.items || data.Items || [],
          pagination: {
            totalItems: data.totalItems || data.TotalItems || 0,
            currentPage: data.currentPage || data.CurrentPage || pageNumber,
            totalPages: data.totalPages || data.TotalPages || 1,
            pageSize: data.pageSize || data.PageSize || pageSize,
            hasPreviousPage: data.hasPreviousPage || data.HasPreviousPage || false,
            hasNextPage: data.hasNextPage || data.HasNextPage || false,
          },
        },
        message: response.message || 'Sessions fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      return {
        success: false,
        data: {
          items: [],
          pagination: null,
        },
        message: `Failed to fetch sessions: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Delete a chat session
   * @param {string} sessionId - Session ID to delete
   */
  static async deleteChatSession(sessionId) {
    try {
      const response = await BaseApiService.delete(EndUrls.AI_CHAT_SESSION_DELETE(sessionId));
      
      return {
        success: true,
        data: response,
        message: 'Session deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return {
        success: false,
        data: null,
        message: `Failed to delete session: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export default AIChatService;

