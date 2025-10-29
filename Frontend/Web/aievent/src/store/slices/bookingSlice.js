import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { bookingAPI } from "../../api/bookingAPI";

// Tạo booking mới
export const createBooking = createAsyncThunk(
  "booking/create",
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.createBooking(bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Lấy danh sách vé
export const fetchTickets = createAsyncThunk(
  "booking/fetchTickets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getTickets();
      return response.data?.data?.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Lấy QR code của vé
export const fetchTicketQR = createAsyncThunk(
  "booking/fetchTicketQR",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getTicketQR(ticketId);
      return { ticketId, qrCode: response.data?.data?.qrCode };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Hoàn vé
export const refundTicket = createAsyncThunk(
  "booking/refundTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.refundTicket(ticketId);
      return { ticketId, result: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

//  Slice

const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    bookings: [],
    tickets: [],
    qrCodes: {},
    loading: false,
    error: null,
    refunding: false,
    creating: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      //  Create booking
      .addCase(createBooking.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.creating = false;
        state.bookings.push(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      //  Fetch tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //  Fetch QR
      .addCase(fetchTicketQR.fulfilled, (state, action) => {
        const { ticketId, qrCode } = action.payload;
        state.qrCodes[ticketId] = qrCode;
      })

      //  Refund Ticket
      .addCase(refundTicket.pending, (state) => {
        state.refunding = true;
        state.error = null;
      })
      .addCase(refundTicket.fulfilled, (state, action) => {
        state.refunding = false;
        const { ticketId } = action.payload;
        // Optionally mark refunded tickets
        state.tickets = state.tickets.map((t) =>
          t.ticketId === ticketId ? { ...t, refunded: true } : t
        );
      })
      .addCase(refundTicket.rejected, (state, action) => {
        state.refunding = false;
        state.error = action.payload;
      });
  },
});

// Exports

export const { clearError } = bookingSlice.actions;

export const selectBookings = (state) => state.booking.bookings;
export const selectTickets = (state) => state.booking.tickets;
export const selectQRCodeByTicketId = (state, id) => state.booking.qrCodes[id];
export const selectBookingLoading = (state) => state.booking.loading;
export const selectBookingError = (state) => state.booking.error;

export default bookingSlice.reducer;
