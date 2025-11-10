
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ratingAPI } from "../../api/ratingAPI";

export const fetchRatings = createAsyncThunk(
  "ratings/fetchAll",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await ratingAPI.getEventRatings(eventId);
      return response.data.items || response.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createRating = createAsyncThunk(
  "ratings/create",
  async ({ eventId, ratingData }, { rejectWithValue }) => {
    try {
      const response = await ratingAPI.createEventRating(eventId, ratingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRating = createAsyncThunk(
  "ratings/update",
  async ({ ratingId, ratingData }, { rejectWithValue }) => {
    try {
      const response = await ratingAPI.updateRating(ratingId, ratingData);
      return { ratingId, updatedRating: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRating = createAsyncThunk(
  "ratings/delete",
  async (ratingId, { rejectWithValue }) => {
    try {
      await ratingAPI.deleteRating(ratingId);
      return { ratingId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    items: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRatings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createRating.pending, (state) => {
        state.creating = true;
      })
      .addCase(createRating.fulfilled, (state, action) => {
        state.creating = false;
        state.items.push(action.payload);
      })
      .addCase(createRating.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      .addCase(updateRating.fulfilled, (state, action) => {
        const { ratingId, updatedRating } = action.payload;
        const index = state.items.findIndex((r) => r.ratingId === ratingId);
        if (index !== -1) state.items[index] = updatedRating;
      })

      .addCase(deleteRating.fulfilled, (state, action) => {
        const { ratingId } = action.payload;
        state.items = state.items.filter((r) => r.ratingId !== ratingId);
      });
  },
});

export const { clearError } = ratingsSlice.actions;

export const selectRatings = (state) => state.ratings.items;
export const selectRatingsLoading = (state) => state.ratings.loading;
export const selectRatingsError = (state) => state.ratings.error;

export default ratingsSlice.reducer;
