import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class EventService {
  /**
   * Test API connection
   */
  static async testConnection() {
    try {
      console.log('Testing API connection to:', EndUrls.EVENTS);
      const response = await BaseApiService.get(EndUrls.EVENTS);
      console.log('API Connection Test Response:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('API Connection Test Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all events with pagination support
   */
  static async getEvents(params = {}) {
    try {
      const {
        search = '',
        eventCategoryId = '',
        pageNumber = 1,
        pageSize = 10,
        ticketType = null,
        district = '',
        timeLine = null
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (eventCategoryId) queryParams.append('eventCategoryId', eventCategoryId);
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);
      if (ticketType !== null) queryParams.append('ticketType', ticketType);
      if (district) queryParams.append('district', district);
      if (timeLine !== null) queryParams.append('timeLine', timeLine);

      const url = `${EndUrls.EVENTS}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      
      // Extract data from the paginated response
      // The backend returns SuccessResponse<BasePaginated<EventsResponse>>
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // If we have a data wrapper, extract the actual data
      if (data.data) {
        data = data.data;
      }
      
      // Extract items from paginated response
      const items = data.items || data.Items || [];
      
      return {
        success: true,
        data: items,
        pagination: {
          currentPage: data.currentPage || data.CurrentPage || pageNumber,
          totalPages: data.totalPages || data.TotalPages || 1,
          totalItems: data.totalItems || data.TotalItems || items.length || 0,
          pageSize: data.pageSize || data.PageSize || pageSize
        },
        message: 'Events fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: `Failed to fetch events: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(id) {
    try {
      const response = await BaseApiService.get(EndUrls.EVENT_DETAIL(id));
      // Extract data from the response
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // If we have a data wrapper, extract the actual data
      if (data.data) {
        data = data.data;
      }
      
      return {
        success: true,
        data: data,
        message: 'Event details fetched',
      };
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch event: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Search events
   */
  static async searchEvents(query) {
    try {
      const response = await BaseApiService.get(`${EndUrls.EVENTS}?search=${encodeURIComponent(query)}`);
      // Extract data from the paginated response
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // If we have a data wrapper, extract the actual data
      if (data.data) {
        data = data.data;
      }
      
      // Extract items from paginated response
      const items = data.items || data.Items || [];
      
      return {
        success: true,
        data: items,
        message: 'Search completed',
      };
    } catch (error) {
      console.error('Error searching events:', error);
      return {
        success: false,
        data: [],
        message: `Search failed: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Join event
   */
  static async joinEvent(eventId) {
    try {
      const data = await BaseApiService.post(EndUrls.JOIN_EVENT(eventId), {});
      return {
        success: true,
        data: data,
        message: 'Successfully joined event',
      };
    } catch (error) {
      console.error('Error joining event:', error);
      return {
        success: false,
        data: null,
        message: `Failed to join event: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Leave event
   */
  static async leaveEvent(eventId) {
    try {
      const data = await BaseApiService.post(EndUrls.LEAVE_EVENT(eventId), {});
      return {
        success: true,
        data: data,
        message: 'Successfully left event',
      };
    } catch (error) {
      console.error('Error leaving event:', error);
      return {
        success: false,
        data: null,
        message: `Failed to leave event: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Share event
   */
  static async shareEvent(eventId) {
    try {
      const data = await BaseApiService.post(EndUrls.SHARE_EVENT(eventId), {});
      return {
        success: true,
        data: data,
        message: 'Event shared successfully',
      };
    } catch (error) {
      console.error('Error sharing event:', error);
      return {
        success: false,
        data: null,
        message: `Failed to share event: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export default EventService;