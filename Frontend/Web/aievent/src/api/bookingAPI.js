import fetcher from "./fetcher";

export const bookingAPI = {
  //  Create new booking
  createBooking: async (bookingData) => {
    const response = await fetcher.post("/booking", bookingData);
    return response.data?.data; //
  },

  //  Get all tickets
  getTickets: async () => {
    const response = await fetcher.get("/booking/ticket");
    return response.data?.data;
  },

  //  Get QR code of a ticket by ID
  getTicketQR: async (ticketId) => {
    const response = await fetcher.get(`/booking/ticket/qr/${ticketId}`);
    return response.data?.data; //  QR code nằm trong data.qrCode
  },

  //  Refund ticket by ID
  refundTicket: async (ticketId) => {
    const response = await fetcher.patch(`/booking/ticket/refund/${ticketId}`);
    return response.data?.data;
  },

  //  Get booked events for current user (timeline)
  getBookedEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.append("pageNumber", params.pageNumber);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    const response = await fetcher.get(`/booking/event?${query.toString()}`);
    return response.data?.data || response.data;
  },

  //  Get tickets of a booked event by eventId
  getEventTickets: async (eventId, params = {}) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.append("pageNumber", params.pageNumber);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    const response = await fetcher.get(
      `/booking/event/${eventId}/ticket?${query.toString()}`
    );
    return response.data?.data || response.data;
  },
};

export default bookingAPI;
