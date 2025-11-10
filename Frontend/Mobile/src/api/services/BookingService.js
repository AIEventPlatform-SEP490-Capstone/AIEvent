import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class BookingService {
  static async createBooking(eventId, ticketTypeRequests) {
    try {
      const response = await BaseApiService.post(EndUrls.CREATE_BOOKING, {
        eventId,
        ticketTypeRequests,
      });

      const data = response?.data?.data || response?.data || response;

      return {
        success: true,
        data,
        message: 'Booking created successfully',
      };
    } catch (error) {
      console.error('Error in createBooking:', error);
      return {
        success: false,
        data: null,
        message: `Failed to create booking: ${error.message}`,
        error: error.message,
      };
    }
  }

  // Normalize booked events -> return array of events with id, title, startTime...
  static async getBookedEvents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber)
        queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const url = `${EndUrls.BOOKED_EVENTS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await BaseApiService.get(url);

      let data = response?.data?.data || response?.data || response;

      // items might be paginated object
      const items = data?.items || (Array.isArray(data) ? data : []);

      // map each API item to a normalized shape
      const normalized = (Array.isArray(items) ? items : []).map(ev => ({
        id: ev.eventId ?? ev.id,
        title: ev.title ?? ev.name ?? '',
        startTime: ev.startTime,
        endTime: ev.endTime,
        address: ev.address ?? ev.venue ?? '',
        totalTickets: ev.totalTickets ?? 0,
        image: ev.image ?? null,
        // keep original payload if needed
        raw: ev,
      }));

      return {
        success: true,
        data: normalized,
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

  // Flatten event tickets into a list of individual tickets with normalized fields
  static async getEventTickets(eventId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.pageNumber)
        queryParams.append('pageNumber', params.pageNumber);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);

      const url = `${EndUrls.EVENT_TICKETS(eventId)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await BaseApiService.get(url);

      let data = response?.data?.data || response?.data || response;

      const items = data?.items || (Array.isArray(data) ? data : []);

      const flattened = [];

      // API shape: items = [ { ticketTypeName, price, quantity, tickets: [ {ticketId, ticketCode, ...}, ... ] }, ... ]
      for (const tt of Array.isArray(items) ? items : []) {
        const ticketTypeName = tt.ticketTypeName ?? tt.name ?? '';
        const price = tt.price ?? 0;
        const quantity = tt.quantity ?? 0;
        const ticketsArr = tt.tickets ?? [];

        for (const t of ticketsArr) {
          flattened.push({
            id: t.ticketId ?? t.id,
            code: t.ticketCode ?? t.code,
            status: t.status ?? '',
            createdAt: t.createdAt ?? null,
            ticketTypeName,
            price,
            quantity,
            raw: t,
          });
        }
      }

      return {
        success: true,
        data: flattened,
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
      let data = response?.data?.data || response?.data || response;

      let qrCodeData = null;
      if (data) {
        if (typeof data === 'object' && data.qrCode) {
          qrCodeData = data.qrCode;
        } else if (typeof data === 'string') {
          qrCodeData = data;
        } else if (typeof data === 'object') {
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
}

export default BookingService;
