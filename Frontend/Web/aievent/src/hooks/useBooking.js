import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createBooking,
  fetchEvents,
  fetchEventTickets,
  fetchTicketQR,
  refundTicket,
  clearError,
  selectBookings,
  selectEvents,
  selectEventTickets,
  selectBookingLoading,
  selectBookingError,
} from "../store/slices/bookingSlice";

export const useBooking = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectBookings);
  const events = useSelector(selectEvents);
  const eventTickets = useSelector(selectEventTickets);
  const loading = useSelector(selectBookingLoading);
  const error = useSelector(selectBookingError);
  const qrCodes = useSelector((state) => state.booking.qrCodes);

  // Tự động lấy danh sách sự kiện khi vào trang
  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const createNewBooking = (bookingData) =>
    dispatch(createBooking(bookingData));

  const getEventTickets = (eventId) => dispatch(fetchEventTickets(eventId));

  const getTicketQR = (ticketId) => dispatch(fetchTicketQR(ticketId));

  const refundTicketById = (ticketId) => dispatch(refundTicket(ticketId));

  const clearBookingError = () => dispatch(clearError());

  const getQRCode = (ticketId) => qrCodes[ticketId] || null;

  return {
    bookings,
    events,
    eventTickets,
    loading,
    error,
    createNewBooking,
    getEventTickets,
    getTicketQR,
    refundTicketById,
    clearBookingError,
    getQRCode,
  };
};

export default useBooking;
