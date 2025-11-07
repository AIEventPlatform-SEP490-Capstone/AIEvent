import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventAPI } from '../../api/eventAPI';

// Async thunks
export const requestEndEvent = createAsyncThunk(
  'endEventRequests/requestEndEvent',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await eventAPI.requestEndEvent(requestData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to request end event');
    }
  }
);

export const confirmEndEvent = createAsyncThunk(
  'endEventRequests/confirmEndEvent',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await eventAPI.confirmEndEvent(requestData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to confirm end event');
    }
  }
);

export const fetchEndEventRequestById = createAsyncThunk(
  'endEventRequests/fetchEndEventRequestById',
  async (endEventRequestId, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEndEventRequestById(endEventRequestId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch end event request');
    }
  }
);

export const fetchEndEventRequests = createAsyncThunk(
  'endEventRequests/fetchEndEventRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await eventAPI.getEndEventRequests(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch end event requests');
    }
  }
);

// Initial state
const initialState = {
  endEventRequests: [],
  currentEndEventRequest: null,
  loading: false,
  error: null,
  totalCount: 0,
};

// Slice
const endEventRequestsSlice = createSlice({
  name: 'endEventRequests',
  initialState,
  reducers: {
    clearCurrentEndEventRequest: (state) => {
      state.currentEndEventRequest = null;
    },
    clearEndEventRequests: (state) => {
      state.endEventRequests = [];
      state.totalCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Request end event
      .addCase(requestEndEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestEndEvent.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new request to the requests list
        if (state.endEventRequests.length > 0) {
          state.endEventRequests.unshift(action.payload);
          state.totalCount += 1;
        }
      })
      .addCase(requestEndEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Confirm end event
      .addCase(confirmEndEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmEndEvent.fulfilled, (state, action) => {
        state.loading = false;
        // Update the request status in the requests list if it exists
        const index = state.endEventRequests.findIndex(request => request.endEventRequestId === action.payload.endEventRequestId);
        if (index !== -1) {
          state.endEventRequests[index] = { ...state.endEventRequests[index], ...action.payload };
        }
        // Update current request if it's the same
        if (state.currentEndEventRequest && state.currentEndEventRequest.endEventRequestId === action.payload.endEventRequestId) {
          state.currentEndEventRequest = { ...state.currentEndEventRequest, ...action.payload };
        }
      })
      .addCase(confirmEndEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch end event request by ID
      .addCase(fetchEndEventRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEndEventRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEndEventRequest = action.payload;
      })
      .addCase(fetchEndEventRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch end event requests
      .addCase(fetchEndEventRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEndEventRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.endEventRequests = action.payload?.items || action.payload || [];
        state.totalCount = action.payload?.totalCount || 0;
      })
      .addCase(fetchEndEventRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearCurrentEndEventRequest, clearEndEventRequests } = endEventRequestsSlice.actions;

// Export selectors
export const selectEndEventRequests = (state) => state.endEventRequests.endEventRequests;
export const selectCurrentEndEventRequest = (state) => state.endEventRequests.currentEndEventRequest;
export const selectEndEventRequestsLoading = (state) => state.endEventRequests.loading;
export const selectEndEventRequestsError = (state) => state.endEventRequests.error;
export const selectEndEventRequestsTotalCount = (state) => state.endEventRequests.totalCount;

export default endEventRequestsSlice.reducer;