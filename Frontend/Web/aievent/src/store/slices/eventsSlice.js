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
  async ({ eventId, reasonCancel = null }, { rejectWithValue }) => {
    try {
      const response = await eventAPI.deleteEvent(eventId, reasonCancel);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete event');
    }
  }
);

// Get draft events (requires Organizer role)
export const fetchDraftEvents = createAsyncThunk(
  'events/fetchDraftEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getDraftEvents(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch draft events');
    }
  }
);

// Get events by status (requires Admin, Manager, Organizer roles)
export const fetchEventsByStatus = createAsyncThunk(
  'events/fetchEventsByStatus',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEventsByStatus(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch events by status');
    }
  }
);

// Confirm event (requires Admin, Manager roles)
export const confirmEvent = createAsyncThunk(
  'events/confirmEvent',
  async ({ eventId, confirmData }, { rejectWithValue }) => {
    try {
      const response = await eventAPI.confirmEvent(eventId, confirmData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to confirm event');
    }
  }
);

// Invite friends to event
export const inviteFriends = createAsyncThunk(
  'events/inviteFriends',
  async ({ eventId, invitationData }, { rejectWithValue }) => {
    try {
      const response = await eventAPI.inviteFriends(eventId, invitationData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to invite friends');
    }
  }
);

// Confirm invitation (Accept/Reject)
export const confirmInvitation = createAsyncThunk(
  'events/confirmInvitation',
  async ({ invitationId, confirmData }, { rejectWithValue }) => {
    try {
      const response = await eventAPI.confirmInvitation(invitationId, confirmData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to confirm invitation');
    }
  }
);

// Fetch invitations status
export const fetchInvitationsStatus = createAsyncThunk(
  'events/fetchInvitationsStatus',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getInvitationsStatus(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch invitations');
    }
  }
);

// Initial state
const initialState = {
  events: [],
  currentEvent: null,
  relatedEvents: [],
  invitations: [],
  invitationsLoading: false,
  invitationsError: null,
  invitationsTotalCount: 0,
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
        state.totalCount = action.payload?.totalItems || action.payload?.totalCount || 0;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
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
      })
      // Fetch draft events
      .addCase(fetchDraftEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.items || action.payload || [];
        state.totalCount = action.payload?.totalItems || action.payload?.totalCount || 0;
      })
      .addCase(fetchDraftEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch events by status
      .addCase(fetchEventsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.items || action.payload || [];
        state.totalCount = action.payload?.totalItems || action.payload?.totalCount || 0;
      })
      .addCase(fetchEventsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Confirm event
      .addCase(confirmEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmEvent.fulfilled, (state, action) => {
        state.loading = false;
        // Update the event status in the events list if it exists
        const index = state.events.findIndex(event => event.eventId === action.meta.arg.eventId);
        if (index !== -1) {
          state.events[index].requireApproval = action.meta.arg.confirmData.status;
        }
        // Update current event if it's the same
        if (state.currentEvent && state.currentEvent.eventId === action.meta.arg.eventId) {
          state.currentEvent.requireApproval = action.meta.arg.confirmData.status;
        }
      })
      .addCase(confirmEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Invite friends
      .addCase(inviteFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(inviteFriends.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(inviteFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Confirm invitation
      .addCase(confirmInvitation.pending, (state) => {
        state.invitationsLoading = true;
        state.invitationsError = null;
      })
      .addCase(confirmInvitation.fulfilled, (state, action) => {
        state.invitationsLoading = false;
        // Update the invitation in the invitations list if it exists
        const index = state.invitations.findIndex(inv => inv.invitationId === action.meta.arg.invitationId);
        if (index !== -1) {
          state.invitations[index].status = action.meta.arg.confirmData.status;
          state.invitations[index].respondedAt = new Date().toISOString();
        }
      })
      .addCase(confirmInvitation.rejected, (state, action) => {
        state.invitationsLoading = false;
        state.invitationsError = action.payload;
      })
      // Fetch invitations status
      .addCase(fetchInvitationsStatus.pending, (state) => {
        state.invitationsLoading = true;
        state.invitationsError = null;
      })
      .addCase(fetchInvitationsStatus.fulfilled, (state, action) => {
        state.invitationsLoading = false;
        state.invitations = action.payload?.items || action.payload || [];
        state.invitationsTotalCount = action.payload?.totalItems || action.payload?.totalCount || 0;
      })
      .addCase(fetchInvitationsStatus.rejected, (state, action) => {
        state.invitationsLoading = false;
        state.invitationsError = action.payload;
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
export const selectInvitations = (state) => state.events.invitations;
export const selectInvitationsLoading = (state) => state.events.invitationsLoading;
export const selectInvitationsError = (state) => state.events.invitationsError;
export const selectInvitationsTotalCount = (state) => state.events.invitationsTotalCount;

export default eventsSlice.reducer;
