import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoriteEventAPI } from '../../api/favoriteEventAPI';
import { logout } from './authSlice';

// Async thunks
export const fetchFavoriteEvents = createAsyncThunk(
  'favoriteEvents/fetchFavoriteEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await favoriteEventAPI.getFavoriteEvents(params);
      // Ensure we always return an array
      if (response && Array.isArray(response.items)) {
        return response.items;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        return [];
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch favorite events');
    }
  }
);

export const addFavoriteEvent = createAsyncThunk(
  'favoriteEvents/addFavoriteEvent',
  async (eventId, { rejectWithValue, dispatch }) => {
    try {
      const response = await favoriteEventAPI.addFavoriteEvent(eventId);
      // Refresh the favorite events list after adding
      dispatch(fetchFavoriteEvents());
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add favorite event');
    }
  }
);

export const removeFavoriteEvent = createAsyncThunk(
  'favoriteEvents/removeFavoriteEvent',
  async (eventId, { rejectWithValue, dispatch }) => {
    try {
      const response = await favoriteEventAPI.removeFavoriteEvent(eventId);
      // Refresh the favorite events list after removing
      dispatch(fetchFavoriteEvents());
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to remove favorite event');
    }
  }
);

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
};

// Slice
const favoriteEventsSlice = createSlice({
  name: 'favoriteEvents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFavoriteEvents: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorite events
      .addCase(fetchFavoriteEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteEvents.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure items is always an array
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFavoriteEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Clear items on error to prevent stale data
        state.items = [];
      })
      // Add favorite event
      .addCase(addFavoriteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFavoriteEvent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addFavoriteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove favorite event
      .addCase(removeFavoriteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFavoriteEvent.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeFavoriteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset favorite events when user logs out
      .addCase(logout.fulfilled, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.items = [];
        state.loading = false;
        state.error = null;
      });
  },
});

// Actions
export const { clearError, clearFavoriteEvents } = favoriteEventsSlice.actions;

// Selectors
export const selectFavoriteEvents = (state) => state.favoriteEvents.items;
export const selectFavoriteEventsLoading = (state) => state.favoriteEvents.loading;
export const selectFavoriteEventsError = (state) => state.favoriteEvents.error;

export default favoriteEventsSlice.reducer;