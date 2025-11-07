import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

// Helper function to convert UTC to UTC+7
const convertUTCToUTC7 = (utcDate) => {
  if (!utcDate) return null;
  
  // Create a new Date object from the UTC date
  const date = new Date(utcDate);
  
  // Add 7 hours to convert from UTC to UTC+7
  // Vietnam is UTC+7
  date.setHours(date.getHours() + 7);
  
  return date;
};

// Helper function to convert UTC to UTC+7 as ISO string
const convertUTCToUTC7ISOString = (utcDate) => {
  if (!utcDate) return null;
  
  const date = convertUTCToUTC7(utcDate);
  return date ? date.toISOString() : null;
};

// Helper function to process event dates
const processEventDates = (event) => {
  if (!event) return event;
  
  // Create a new event object to avoid mutating the original
  const processedEvent = { ...event };
  
  // Convert all date fields from UTC to UTC+7
  if (processedEvent.startTime || processedEvent.StartTime) {
    const startTime = processedEvent.startTime || processedEvent.StartTime;
    processedEvent.startTime = convertUTCToUTC7ISOString(startTime);
    if (!processedEvent.StartTime) {
      processedEvent.StartTime = processedEvent.startTime;
    }
  }
  
  if (processedEvent.endTime || processedEvent.EndTime) {
    const endTime = processedEvent.endTime || processedEvent.EndTime;
    processedEvent.endTime = convertUTCToUTC7ISOString(endTime);
    if (!processedEvent.EndTime) {
      processedEvent.EndTime = processedEvent.endTime;
    }
  }
  
  if (processedEvent.saleStartTime) {
    processedEvent.saleStartTime = convertUTCToUTC7ISOString(processedEvent.saleStartTime);
  }
  
  if (processedEvent.saleEndTime) {
    processedEvent.saleEndTime = convertUTCToUTC7ISOString(processedEvent.saleEndTime);
  }
  
  return processedEvent;
};

// Helper function to process events array
const processEventsArray = (events) => {
  if (!Array.isArray(events)) return events;
  return events.map(processEventDates);
};

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
   * Get all events with pagination support and filtering
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
      let items = data.items || data.Items || [];
      
      // Process dates for all events
      items = processEventsArray(items);
      
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
      
      // Process dates for the event
      if (data) {
        data = processEventDates(data);
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
      // Use the main events endpoint with search parameter
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
      let items = data.items || data.Items || [];
      
      // Process dates for all events
      items = processEventsArray(items);
      
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