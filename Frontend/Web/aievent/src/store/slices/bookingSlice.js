

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { bookingAPI } from "../../api/bookingAPI";

// Tạo booking mới
export const createBooking = createAsyncThunk(
  "booking/create",
  async (bookingData, { rejectWithValue }) => {
    try {
      const data = await bookingAPI.createBooking(bookingData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Lấy danh sách sự kiện
export const fetchEvents = createAsyncThunk(
  "booking/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const data = await bookingAPI.getEvents();
      return data.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Lấy danh sách vé của từng sự kiện
export const fetchEventTickets = createAsyncThunk(
  "booking/fetchEventTickets",
  async (eventId, { rejectWithValue }) => {
    try {
      const data = await bookingAPI.getEventTickets(eventId);
      return { eventId, tickets: data.items || [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Lấy QR Code của vé
export const fetchTicketQR = createAsyncThunk(
  "booking/fetchTicketQR",
  async (ticketId, { rejectWithValue }) => {
    try {
      const data = await bookingAPI.getTicketQR(ticketId);
      return { ticketId, qrCode: data.qrCode };
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
      const data = await bookingAPI.refundTicket(ticketId);
      return { ticketId, result: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    events: [],
    eventTickets: {},
    bookings: [],
    qrCodes: {},
    loading: false,
    error: null,
    creating: false,
    refunding: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Tạo booking
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

      // Lấy danh sách sự kiện
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Lấy vé của từng sự kiện
      .addCase(fetchEventTickets.fulfilled, (state, action) => {
        const { eventId, tickets } = action.payload;
        state.eventTickets[eventId] = tickets;
      })

      // Lấy QR
      .addCase(fetchTicketQR.fulfilled, (state, action) => {
        const { ticketId, qrCode } = action.payload;
        state.qrCodes[ticketId] = qrCode;
      })

      // Hoàn vé
      .addCase(refundTicket.pending, (state) => {
        state.refunding = true;
      })
      .addCase(refundTicket.fulfilled, (state) => {
        state.refunding = false;
      })
      .addCase(refundTicket.rejected, (state, action) => {
        state.refunding = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = bookingSlice.actions;

export const selectBookings = (state) => state.booking.bookings;
export const selectEvents = (state) => state.booking.events;
export const selectEventTickets = (state) => state.booking.eventTickets;
export const selectQRCodeByTicketId = (state, id) => state.booking.qrCodes[id];
export const selectBookingLoading = (state) => state.booking.loading;
export const selectBookingError = (state) => state.booking.error;

export default bookingSlice.reducer;
