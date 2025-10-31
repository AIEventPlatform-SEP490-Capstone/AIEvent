

import fetcher from "./fetcher";

export const bookingAPI = {
  // POST: Tạo booking mới
  createBooking: async (bookingData) => {
    const response = await fetcher.post("/booking", bookingData);
    return response.data?.data;
  },

  // GET: Danh sách sự kiện
  getEvents: async () => {
    const response = await fetcher.get("/booking/event");
    return response.data?.data;
  },

  // GET: Lấy danh sách vé theo từng sự kiện
  getEventTickets: async (eventId) => {
    const response = await fetcher.get(`/booking/event/${eventId}/ticket`);
    return response.data?.data;
  },

  // GET: Lấy QR Code của vé
  getTicketQR: async (ticketId) => {
    const response = await fetcher.get(`/booking/ticket/qr/${ticketId}`);
    return response.data?.data;
  },

  // PATCH: Hoàn vé
  refundTicket: async (ticketId) => {
    const response = await fetcher.patch(`/booking/ticket/refund/${ticketId}`);
    return response.data?.data;
  },
};

export default bookingAPI;
