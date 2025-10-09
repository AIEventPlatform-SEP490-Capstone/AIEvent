import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventCategoryAPI } from '../../api/eventCategoryAPI';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventCategoryAPI.getEventCategories(1, 100);
      return response.data.items || response.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await eventCategoryAPI.createEventCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
    creating: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Force refresh categories
    invalidateCategories: (state) => {
      state.lastFetched = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.creating = false;
        state.items.push(action.payload);
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, invalidateCategories } = categoriesSlice.actions;

// Selectors
export const selectCategories = (state) => state.categories.items;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCategoriesError = (state) => state.categories.error;
export const selectCategoryById = (state, categoryId) => 
  state.categories.items.find(cat => cat.eventCategoryId === categoryId);

// Check if categories need to be fetched (cache for 5 minutes)
export const selectShouldFetchCategories = (state) => {
  const { lastFetched, items } = state.categories;
  if (!lastFetched || items.length === 0) return true;
  return Date.now() - lastFetched > 5 * 60 * 1000; // 5 minutes
};

export default categoriesSlice.reducer;
