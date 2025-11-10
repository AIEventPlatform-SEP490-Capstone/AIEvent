import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class BookingService {
  static async getBookedEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      const url = `${EndUrls.BOOKED_EVENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await BaseApiService.get(url);
      
      // Handle different response structures: response.data?.data || response.data || response
      let data = response?.data?.data || response?.data || response;
      
      // If data has items (paginated response), extract items
      const eventsArray = data?.items || (Array.isArray(data) ? data : []);
      
      return {
        success: true,
        data: Array.isArray(eventsArray) ? eventsArray : [],
        message: 'Booked events fetched successfully',
      };
    } catch (error) {
      console.error('Error in getBookedEvents:', error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch booked events: ${error.message}`,
        error: error.message,
      };
    }
  }

  static async getEventTickets(eventId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      
      const url = `${EndUrls.EVENT_TICKETS(eventId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await BaseApiService.get(url);
      
      // Handle different response structures: response.data?.data || response.data || response
      let data = response?.data?.data || response?.data || response;
      
      // If data has items (paginated response), extract items
      // Otherwise, if it's an array, use it directly
      const ticketsArray = data?.items || (Array.isArray(data) ? data : []);
      
      return {
        success: true,
        data: Array.isArray(ticketsArray) ? ticketsArray : [],
        message: 'Event tickets fetched successfully',
      };
    } catch (error) {
      console.error('Error in getEventTickets:', error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch event tickets: ${error.message}`,
        error: error.message,
      };
    }
  }

  static async getTicketQR(ticketId) {
    try {
      const response = await BaseApiService.get(EndUrls.TICKET_QR(ticketId));
      
      // Handle different response structures: response.data?.data || response.data || response
      let data = response?.data?.data || response?.data || response;
      
      let qrCodeData = null;

      if (data) {
        if (typeof data === 'object' && data.qrCode) {
          qrCodeData = data.qrCode;
        }
        else if (typeof data === 'string') {
          qrCodeData = data;
        }
        else if (typeof data === 'object') {
          qrCodeData = data.qrCode || data;
        }
      }
      
      const qrCodeString = typeof qrCodeData === 'string' ? qrCodeData : null;
      
      return {
        success: true,
        data: qrCodeString,
        message: 'QR code fetched successfully',
      };
    } catch (error) {
      console.error('Error in getTicketQR:', error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch QR code: ${error.message}`,
        error: error.message,
      };
    }
  }

  static async checkInTicket(qrContent) {
    try {
      console.log('Sending check-in request with QR content:', qrContent);
      const response = await BaseApiService.patch(EndUrls.CHECK_IN, { qrContent });
      console.log('Check-in response:', response);
      
      // Handle different response structures: response.data?.data || response.data || response
      let data = response?.data?.data || response?.data || response;
      
      return {
        success: true,
        data: data,
        message: response?.data?.message || 'Check-in successful',
      };
    } catch (error) {

      let errorMessage = error.message;
      if (error.message && (error.message.includes('Invalid data') || error.message.includes('Bad Request'))) {
        errorMessage = 'Bad Request: Invalid data provided';
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        error: error.message,
      };
    }
  }
}

export default BookingService;

