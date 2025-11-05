import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { organizerAPI } from "../../api/organizerAPI";

// Thunks
export const fetchOrganizers = createAsyncThunk(
  "organizers/fetchOrganizers",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await organizerAPI.getOrganizers(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch organizers"
      );
    }
  }
);

export const fetchOrganizerById = createAsyncThunk(
  "organizers/fetchOrganizerById",
  async (id, { rejectWithValue }) => {
    try {
      return await organizerAPI.getOrganizerById(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch organizer"
      );
    }
  }
);

export const fetchOrganizerProfile = createAsyncThunk(
  "organizers/fetchOrganizerProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await organizerAPI.getOrganizerProfile();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch organizer profile"
      );
    }
  }
);

export const createOrganizer = createAsyncThunk(
  "organizers/createOrganizer",
  async (data, { rejectWithValue }) => {
    try {
      return await organizerAPI.createOrganizer(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to create organizer"
      );
    }
  }
);

export const updateOrganizer = createAsyncThunk(
  "organizers/updateOrganizer",
  async (data, { rejectWithValue }) => {
    try {
      return await organizerAPI.updateOrganizer(data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update organizer"
      );
    }
  }
);

export const confirmOrganizer = createAsyncThunk(
  "organizers/confirmOrganizer",
  async ({ id, confirmData }, { rejectWithValue }) => {
    try {
      return await organizerAPI.confirmOrganizer(id, confirmData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to confirm organizer"
      );
    }
  }
);

// Slice
const organizersSlice = createSlice({
  name: "organizers",
  initialState: {
    list: [],
    current: null,
    profile: null,
    loading: false,
    error: null,
    totalCount: 0,
  },
  reducers: {
    clearOrganizer: (state) => {
      state.current = null;
    },
    clearOrganizers: (state) => {
      state.list = [];
      state.totalCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrganizers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.items || [];
        state.totalCount = action.payload?.totalItems || 0;
      })
      .addCase(fetchOrganizers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrganizerById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchOrganizerProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { clearOrganizer, clearOrganizers } = organizersSlice.actions;
export const selectOrganizers = (state) => state.organizers.list;
export const selectOrganizer = (state) => state.organizers.current;
export const selectOrganizerProfile = (state) => state.organizers.profile;
export const selectOrganizersLoading = (state) => state.organizers.loading;
export const selectOrganizersError = (state) => state.organizers.error;
export default organizersSlice.reducer;
