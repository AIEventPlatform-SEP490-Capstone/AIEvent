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
};

export default bookingAPI;
