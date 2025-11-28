import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class FavoriteEventService {
  /**
   * Get favorite events with pagination support and filtering
   */
  static async getFavoriteEvents(params = {}) {
    try {
      const {
        search = '',
        eventCategoryId = '',
        pageNumber = 1,
        pageSize = 10,
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (eventCategoryId) queryParams.append('eventCategoryId', eventCategoryId);
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);

      const url = `${EndUrls.FAVORITE_EVENTS}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      if (!response || !response.statusCode || response.statusCode !== 'AIE20000') {
        const errorMessage = response?.message || response?.data?.message || 'Failed to fetch favorite events';
        throw new Error(errorMessage);
      }
      
      // Extract items from paginated response
      let items = response.data?.items || response.data?.Items || response.data || [];
      
      return {
        success: true,
        data: items,
        pagination: {
          currentPage: response.data?.currentPage || response.data?.CurrentPage || pageNumber,
          totalPages: response.data?.totalPages || response.data?.TotalPages || 1,
          totalItems: response.data?.totalItems || response.data?.TotalItems || items.length || 0,
          pageSize: response.data?.pageSize || response.data?.PageSize || pageSize
        },
        message: 'Favorite events fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching favorite events:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: `Failed to fetch favorite events: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Add event to favorites
   */
  static async addFavoriteEvent(eventId) {
    try {
      // Validate eventId before making the request
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      // Validate that eventId is a valid GUID format (more lenient)
      // Allow both uppercase and lowercase, with or without braces
      const guidRegexAdd = /^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/;
      if (!guidRegexAdd.test(eventId)) {
        console.warn(`Event ID '${eventId}' may not be in valid GUID format, but continuing anyway`);
        // Don't throw error, just log warning as some events might have different formats
      } else {
        console.log(`Event ID '${eventId}' is in valid GUID format`);
      }
      // Send as query parameter properly
      const url = new URL(EndUrls.ADD_FAVORITE_EVENT);
      url.searchParams.append('eventId', eventId);
      
      const response = await BaseApiService.post(url.toString(), null);
      
      // Check if response indicates success
      if (!response || !response.statusCode || response.statusCode !== 'AIE20100') {
        const errorMessage = response?.message || response?.data?.message || 'Failed to add event to favorites';
        throw new Error(errorMessage);
      }
      
      return {
        success: true,
        data: response,
        message: 'Event added to favorites successfully',
      };
    } catch (error) {
      console.error('Error adding event to favorites:', error);
      return {
        success: false,
        data: null,
        message: `Failed to add event to favorites: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Remove event from favorites
   */
  static async removeFavoriteEvent(eventId) {
    try {
      // Validate eventId before making the request
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      // Validate that eventId is a valid GUID format (more lenient)
      // Allow both uppercase and lowercase, with or without braces
      const guidRegexRemove = /^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/;
      if (!guidRegexRemove.test(eventId)) {
        console.warn(`Event ID '${eventId}' may not be in valid GUID format, but continuing anyway`);
        // Don't throw error, just log warning as some events might have different formats
      } else {
        console.log(`Event ID '${eventId}' is in valid GUID format`);
      }
      
      // Send as query parameter properly
      const url = new URL(EndUrls.REMOVE_FAVORITE_EVENT);
      url.searchParams.append('eventId', eventId);
      
      const response = await BaseApiService.delete(url.toString());
      
      // Check if response indicates success
      if (!response || !response.statusCode || response.statusCode !== 'AIE20400') {
        const errorMessage = response?.message || response?.data?.message || 'Failed to remove event from favorites';
        throw new Error(errorMessage);
      }
      
      return {
        success: true,
        data: response,
        message: 'Event removed from favorites successfully',
      };
    } catch (error) {
      console.error('Error removing event from favorites:', error);
      return {
        success: false,
        data: null,
        message: `Failed to remove event from favorites: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export default FavoriteEventService;