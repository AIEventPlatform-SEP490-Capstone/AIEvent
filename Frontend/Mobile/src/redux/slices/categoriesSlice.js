import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import CategoryService from '../../api/services/CategoryService';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await CategoryService.getCategories(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchCategoryById = createAsyncThunk(
  'categories/fetchCategoryById',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await CategoryService.getCategoryById(categoryId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch category');
    }
  }
);

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoriesError: (state) => {
      state.error = null;
    },
    invalidateCategories: (state) => {
      state.lastFetched = null;
    },
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
        if (action.payload.success) {
          state.items = action.payload.data || [];
          state.lastFetched = Date.now();
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch category by ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const category = action.payload.data;
          const index = state.items.findIndex(
            (cat) => cat.eventCategoryId === category.eventCategoryId
          );
          if (index !== -1) {
            state.items[index] = category;
          } else {
            state.items.push(category);
          }
        } else {
          state.error = action.payload.message;
        }
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { clearCategoriesError, invalidateCategories } = categoriesSlice.actions;

// Export selectors
export const selectCategories = (state) => state.categories.items;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCategoriesError = (state) => state.categories.error;
export const selectCategoryById = (state, categoryId) =>
  state.categories.items.find((cat) => cat.eventCategoryId === categoryId);

// Check if categories need to be fetched (cache for 5 minutes)
export const selectShouldFetchCategories = (state) => {
  const { lastFetched, items } = state.categories;
  if (!lastFetched || items.length === 0) return true;
  return Date.now() - lastFetched > 5 * 60 * 1000; // 5 minutes
};

export default categoriesSlice.reducer;