import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoriteEventAPI } from '../../api/favoriteEventAPI';
import { logout } from './authSlice';

// Async thunks
export const fetchFavoriteEvents = createAsyncThunk(
  'favoriteEvents/fetchFavoriteEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await favoriteEventAPI.getFavoriteEvents(params);
      // Handle paginated response
      if (response && response.items) {
        return {
          items: Array.isArray(response.items) ? response.items : [],
          totalRecords: response.totalRecords || response.totalCount || response.items.length,
          totalPages: response.totalPages || Math.ceil((response.totalRecords || response.items.length) / (params.pageSize || 12)),
          currentPage: params.pageNumber || 1
        };
      } else if (Array.isArray(response)) {
        return {
          items: response,
          totalRecords: response.length,
          totalPages: 1,
          currentPage: 1
        };
      } else {
        return {
          items: [],
          totalRecords: 0,
          totalPages: 1,
          currentPage: 1
        };
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
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
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
        state.items = action.payload.items || [];
        state.totalRecords = action.payload.totalRecords || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
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
export const selectFavoriteEventsTotalRecords = (state) => state.favoriteEvents.totalRecords;
export const selectFavoriteEventsTotalPages = (state) => state.favoriteEvents.totalPages;
export const selectFavoriteEventsCurrentPage = (state) => state.favoriteEvents.currentPage;

export default favoriteEventsSlice.reducer;