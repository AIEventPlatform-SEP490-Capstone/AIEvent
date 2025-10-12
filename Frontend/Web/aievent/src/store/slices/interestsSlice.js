import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { interestAPI } from "../../api/interestAPI";

// Async thunks
export const fetchInterests = createAsyncThunk(
  "interests/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await interestAPI.getInterests(1, 100);
      return response.data.items || response.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createInterest = createAsyncThunk(
  "interests/create",
  async (interestData, { rejectWithValue }) => {
    try {
      const response = await interestAPI.createInterest(interestData);
      console.log("Create interest API response:", response);
      // Xử lý response structure từ backend
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateInterest = createAsyncThunk(
  "interests/update",
  async ({ interestId, interestData }, { rejectWithValue }) => {
    try {
      const response = await interestAPI.updateInterest(
        interestId,
        interestData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteInterest = createAsyncThunk(
  "interests/delete",
  async (interestId, { rejectWithValue }) => {
    try {
      await interestAPI.deleteInterest(interestId);
      return interestId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const interestsSlice = createSlice({
  name: "interests",
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
    creating: false,
    updating: false,
    deleting: false,
    // For interest selection in forms
    selectedInterests: [],
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Interest selection for forms
    selectInterest: (state, action) => {
      const interest = action.payload;
      if (
        !state.selectedInterests.find(
          (i) => i.interestId === interest.interestId
        )
      ) {
        state.selectedInterests.push(interest);
      }
    },
    unselectInterest: (state, action) => {
      const interestId = action.payload;
      state.selectedInterests = state.selectedInterests.filter(
        (i) => i.interestId !== interestId
      );
    },
    clearSelectedInterests: (state) => {
      state.selectedInterests = [];
    },
    // Force refresh
    invalidateInterests: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch interests
      .addCase(fetchInterests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchInterests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create interest
      .addCase(createInterest.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createInterest.fulfilled, (state, action) => {
        state.creating = false;
        console.log("Adding new interest to store:", action.payload);
        // Đảm bảo interest mới có đúng structure
        const newInterest = action.payload;
        if (newInterest && (newInterest.interestId || newInterest.id)) {
          state.items.push({
            interestId: newInterest.interestId || newInterest.id,
            interestName: newInterest.interestName,
            ...newInterest,
          });
        }
        // Invalidate cache để force refresh lần sau
        state.lastFetched = null;
        state.error = null;
      })
      .addCase(createInterest.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      // Update interest
      .addCase(updateInterest.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateInterest.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.items.findIndex(
          (interest) => interest.interestId === action.payload.interestId
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateInterest.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // Delete interest
      .addCase(deleteInterest.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteInterest.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter(
          (interest) => interest.interestId !== action.payload
        );
        // Also remove from selected interests
        state.selectedInterests = state.selectedInterests.filter(
          (interest) => interest.interestId !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteInterest.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  selectInterest,
  unselectInterest,
  clearSelectedInterests,
  invalidateInterests,
} = interestsSlice.actions;

// Selectors
export const selectInterests = (state) => state.interests.items;
export const selectInterestsLoading = (state) => state.interests.loading;
export const selectInterestsError = (state) => state.interests.error;
export const selectSelectedInterests = (state) =>
  state.interests.selectedInterests;
export const selectInterestById = (state, interestId) =>
  state.interests.items.find((interest) => interest.interestId === interestId);

// Check if interests need to be fetched (cache for 10 minutes)
export const selectShouldFetchInterests = (state) => {
  const { lastFetched, items } = state.interests;
  if (!lastFetched || items.length === 0) return true;
  return Date.now() - lastFetched > 10 * 60 * 1000; // 10 minutes
};

export default interestsSlice.reducer;
