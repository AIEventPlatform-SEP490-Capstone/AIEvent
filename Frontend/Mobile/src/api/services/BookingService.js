import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class BookingService {
  /**
   * Get booked events for current user (timeline)
   */
  static async getBookedEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      const url = `${EndUrls.BOOKED_EVENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await BaseApiService.get(url);
      
      // API returns: { statusCode, message, data: { items: [...], ... } }
      const eventsArray = response?.data?.items || (Array.isArray(response?.data) ? response.data : []);
      
      return {
        success: true,
        data: Array.isArray(eventsArray) ? eventsArray : [],
        message: 'Booked events fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to fetch booked events: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get tickets of a booked event by eventId
   */
  static async getEventTickets(eventId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      const url = `${EndUrls.EVENT_TICKETS(eventId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await BaseApiService.get(url);
      
      // API returns: { statusCode, message, data: { items: [...], ... } }
      const ticketsArray = response?.data?.items || (Array.isArray(response?.data) ? response.data : []);
      
      return {
        success: true,
        data: Array.isArray(ticketsArray) ? ticketsArray : [],
        message: 'Event tickets fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to fetch event tickets: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get QR code for a ticket
   */
  static async getTicketQR(ticketId) {
    try {
      const response = await BaseApiService.get(EndUrls.TICKET_QR(ticketId));
      
      // API returns: { statusCode, message, data: { qrCode: "...", ... } } or { statusCode, message, data: "base64string" }
      let qrCodeData = null;
      
      if (response?.data) {
        // If data is an object with qrCode property
        if (typeof response.data === 'object' && response.data.qrCode) {
          qrCodeData = response.data.qrCode;
        }
        // If data is a string (base64 or URL)
        else if (typeof response.data === 'string') {
          qrCodeData = response.data;
        }
        // If data is an object, try to get qrCode from it
        else if (typeof response.data === 'object') {
          qrCodeData = response.data.qrCode || response.data;
        }
      }
      
      // Ensure we return a string, not an object
      const qrCodeString = typeof qrCodeData === 'string' ? qrCodeData : null;
      
      return {
        success: true,
        data: qrCodeString,
        message: 'QR code fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Failed to fetch QR code: ${error.message}`,
        error: error.message,
      };
    }
  }
}

export default BookingService;

