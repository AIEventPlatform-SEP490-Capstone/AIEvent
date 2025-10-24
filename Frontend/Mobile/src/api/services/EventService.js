import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class EventService {
  /**
   * Get all events
   */
  static async getEvents() {
    try {
      const data = await BaseApiService.get(EndUrls.EVENTS);
      return {
        success: true,
        data: data,
        message: 'Events fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
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
      const data = await BaseApiService.get(EndUrls.EVENT_DETAIL(id));
      return {
        success: true,
        data: data,
        message: 'Event details fetched',
      };
    } catch (error) {
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
      const data = await BaseApiService.get(`${EndUrls.SEARCH_EVENTS}?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        data: data,
        message: 'Search completed',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
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
