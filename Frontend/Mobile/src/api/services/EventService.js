import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';
import { translateReportEventError } from '../../utility';

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
  // static async shareEvent(eventId) {
  //   try {
  //     const data = await BaseApiService.post(EndUrls.SHARE_EVENT(eventId), {});
  //     return {
  //       success: true,
  //       data: data,
  //       message: 'Event shared successfully',
  //     };
  //   } catch (error) {
  //     console.error('Error sharing event:', error);
  //     return {
  //       success: false,
  //       data: null,
  //       message: `Failed to share event: ${error.message}`,
  //       error: error.message,
  //     };
  //   }
  // }

  /**
   * Invite friends to event
   * @param {string} eventId - The ID of the event
   * @param {string[]} invitedUserIds - Array of user IDs to invite
   * @param {string} message - Invitation message
   */
  static async inviteFriends(eventId, invitedUserIds, message) {
    try {
      const requestBody = {
        invitedUserIds: invitedUserIds,
        message: message || '',
      };
      
      const data = await BaseApiService.post(
        EndUrls.INVITE_FRIENDS(eventId),
        requestBody
      );
      
      return {
        success: true,
        data: data,
        message: 'Friends invited successfully',
      };
    } catch (error) {
      console.error('Error inviting friends:', error);
      return {
        success: false,
        data: null,
        message: `Failed to invite friends: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Confirm invitation (Accept/Reject/Pending)
   * @param {string} invitationId - The ID of the invitation
   * @param {string} status - Status: "Pending", "Accepted", or "Rejected"
   */
  static async confirmInvitation(invitationId, status) {
    try {
      // Validate status
      const validStatuses = ['Pending', 'Accepted', 'Rejected'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          data: null,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          error: 'Invalid status',
        };
      }

      const requestBody = {
        status: status,
      };
      
      const data = await BaseApiService.put(
        EndUrls.CONFIRM_INVITATION(invitationId),
        requestBody
      );
      
      return {
        success: true,
        data: data,
        message: 'Invitation status updated successfully',
      };
    } catch (error) {
      console.error('Error confirming invitation:', error);
      return {
        success: false,
        data: null,
        message: `Failed to confirm invitation: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get invitations status
   * Returns a list of invitations with pagination
   */
  static async getInvitationsStatus() {
    try {
      const response = await BaseApiService.get(EndUrls.GET_INVITATIONS_STATUS);
      
      // Extract data from the response
      let data = response;
      
      // Handle different response structures
      if (response.data) {
        data = response.data;
      }
      
      // Extract items from paginated response
      let items = data.items || data.Items || [];
      
      return {
        success: true,
        data: items,
        pagination: {
          currentPage: data.currentPage || data.CurrentPage || 1,
          totalPages: data.totalPages || data.TotalPages || 1,
          totalItems: data.totalItems || data.TotalItems || items.length || 0,
          pageSize: data.pageSize || data.PageSize || 10,
          hasPreviousPage: data.hasPreviousPage || data.HasPreviousPage || false,
          hasNextPage: data.hasNextPage || data.HasNextPage || false,
        },
        message: 'Invitations fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching invitations status:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: `Failed to fetch invitations: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get AI recommended events
   */
  static async getAIRecommendedEvents(params = {}) {
    try {
      const {
        pageNumber = 1,
        pageSize = 5,
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (pageNumber) queryParams.append('pageNumber', pageNumber);
      if (pageSize) queryParams.append('pageSize', pageSize);

      const url = `${EndUrls.AI_EVENTS}?${queryParams.toString()}`;
      const response = await BaseApiService.get(url);
      
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
        pagination: {
          currentPage: data.currentPage || data.CurrentPage || pageNumber,
          totalPages: data.totalPages || data.TotalPages || 1,
          totalItems: data.totalItems || data.TotalItems || items.length || 0,
          pageSize: data.pageSize || data.PageSize || pageSize
        },
        message: 'AI recommended events fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching AI recommended events:', error);
      return {
        success: false,
        data: [],
        pagination: null,
        message: `Failed to fetch AI recommended events: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Report an event
   */
  static async reportEvent(params = {}) {
    try {
      const {
        eventId,
        type,
        reason,
        attachmentUrl = '',
      } = params;

      if (!eventId || !type || !reason) {
        return {
          success: false,
          message: 'Missing required parameters: eventId, type, reason',
        };
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('EventId', eventId);
      queryParams.append('Type', type);
      queryParams.append('Reason', reason);
      if (attachmentUrl) {
        queryParams.append('AttachmentUrl', attachmentUrl);
      }

      const url = `${EndUrls.REPORT_EVENT}?${queryParams.toString()}`;
      const response = await BaseApiService.post(url, {});
      
      return {
        success: true,
        data: response,
        message: 'Event reported successfully',
      };
    } catch (error) {
      console.error('Error reporting event:', error);
      const errorMessage = error.message || 'Failed to report event';
      const translatedMessage = translateReportEventError(errorMessage);
      
      return {
        success: false,
        message: translatedMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Get user reports for an event
   */
  static async getUserReports(eventId) {
    try {
      const response = await BaseApiService.get(EndUrls.GET_USER_REPORTS(eventId));
      
      let data = response;
      if (response.data) {
        data = response.data;
      }
      
      const reports = Array.isArray(data) ? data : (data ? [data] : []);
      
      return {
        success: true,
        data: reports,
        message: 'User reports fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return {
        success: false,
        data: [],
        message: `Failed to fetch user reports: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export default EventService;