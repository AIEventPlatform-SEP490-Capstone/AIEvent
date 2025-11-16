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

  //  Get booked events for current user (timeline)
  getBookedEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.append("pageNumber", params.pageNumber);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    const response = await fetcher.get(`/booking/event?${query.toString()}`);
    return response.data?.data || response.data;
  },

  //  Get tickets of a booked event by eventId

  getEventTickets: async (eventId) => {
    const response = await fetcher.get(`/booking/event/${eventId}/ticket`);
    const rawData = response.data?.data;

    const items = Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray(rawData)
      ? rawData
      : [];

    const flatTickets = items.flatMap((t) => {
      if (Array.isArray(t.tickets)) {
        return t.tickets.map((tk) => ({
          ...tk,
          ticketTypeName: t.ticketTypeName,
          price: t.price,
          quantity: t.quantity,
        }));
      }

      return {
        ...t,
        ticketTypeName: t.ticketTypeName || t.ticketName,
        price: t.price ?? 0,
        quantity: t.quantity ?? 0,
      };
    });

    return { items, tickets: flatTickets };
  },
};

export default bookingAPI;
