import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventAPI } from '../../api/eventAPI';

// Async thunks
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEvents(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch events');
    }
  }
);

export const fetchEventsByOrganizer = createAsyncThunk(
  'events/fetchEventsByOrganizer',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEventsByOrganizer(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEventById(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch event');
    }
  }
);

export const fetchRelatedEvents = createAsyncThunk(
  'events/fetchRelatedEvents',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getRelatedEvents(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch related events');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await eventAPI.createEvent(eventData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await eventAPI.updateEvent(eventData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await eventAPI.deleteEvent(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete event');
    }
  }
);

// Initial state
const initialState = {
  events: [],
  currentEvent: null,
  relatedEvents: [],
  loading: false,
  error: null,
  totalCount: 0,
};

// Slice
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearEvents: (state) => {
      state.events = [];
      state.totalCount = 0;
    },
    clearRelatedEvents: (state) => {
      state.relatedEvents = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.items || action.payload || [];
        state.totalCount = action.payload?.totalCount || 0;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch events by organizer
      .addCase(fetchEventsByOrganizer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsByOrganizer.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.items || action.payload || [];
        state.totalCount = action.payload?.totalCount || 0;
      })
      .addCase(fetchEventsByOrganizer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch event by ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch related events
      .addCase(fetchRelatedEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRelatedEvents.fulfilled, (state, action) => {
        state.loading = false;
        // The related events are already extracted in the API layer
        state.relatedEvents = action.payload || [];
      })
      .addCase(fetchRelatedEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new event to the events list
        if (state.events.length > 0) {
          state.events.unshift(action.payload);
          state.totalCount += 1;
        }
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        // Update the event in the events list
        const index = state.events.findIndex(event => event.eventId === action.payload.eventId);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        // Update current event if it's the same
        if (state.currentEvent && state.currentEvent.eventId === action.payload.eventId) {
          state.currentEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the event from the events list
        state.events = state.events.filter(event => event.eventId !== action.meta.arg);
        state.totalCount -= 1;
        // Clear current event if it's the same
        if (state.currentEvent && state.currentEvent.eventId === action.meta.arg) {
          state.currentEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearCurrentEvent, clearEvents, clearRelatedEvents } = eventsSlice.actions;

// Export selectors
export const selectEvents = (state) => state.events.events;
export const selectCurrentEvent = (state) => state.events.currentEvent;
export const selectRelatedEvents = (state) => state.events.relatedEvents;
export const selectEventsLoading = (state) => state.events.loading;
export const selectEventsError = (state) => state.events.error;
export const selectEventsTotalCount = (state) => state.events.totalCount;

export default eventsSlice.reducer;