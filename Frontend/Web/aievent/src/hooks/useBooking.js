import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createBooking,
  fetchTickets,
  fetchTicketQR,
  refundTicket,
  clearError,
  selectBookings,
  selectTickets,
  selectBookingLoading,
  selectBookingError,
} from "../store/slices/bookingSlice";

export const useBooking = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectBookings);
  const tickets = useSelector(selectTickets);
  const loading = useSelector(selectBookingLoading);
  const error = useSelector(selectBookingError);
  const qrCodes = useSelector((state) => state.booking.qrCodes); // ✅ lấy 1 lần ở đây

  // Auto fetch tickets on mount
  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const createNewBooking = async (bookingData) => {
    return dispatch(createBooking(bookingData));
  };

  const getTicketQR = async (ticketId) => {
    return dispatch(fetchTicketQR(ticketId));
  };

  const refundTicketById = async (ticketId) => {
    return dispatch(refundTicket(ticketId));
  };

  const clearBookingError = () => {
    dispatch(clearError());
  };

  const getQRCode = (ticketId) => {
    return qrCodes[ticketId] || null;
  };

  return {
    bookings,
    tickets,
    loading,
    error,
    createNewBooking,
    getTicketQR,
    refundTicketById,
    clearBookingError,
    getQRCode,
  };
};

export default useBooking;
