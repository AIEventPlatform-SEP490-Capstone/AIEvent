import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { eventCategoryAPI } from "../../api/eventCategoryAPI";

// Async thunks
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
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
  "categories/create",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await eventCategoryAPI.createEventCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ categoryId, categoryData }, { rejectWithValue }) => {
    try {
      const response = await eventCategoryAPI.updateEventCategory(
        categoryId,
        categoryData
      );
      return { categoryId, updatedCategory: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await eventCategoryAPI.deleteEventCategory(categoryId);
      return { categoryId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchById",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await eventCategoryAPI.getEventCategoryById(categoryId);
      return { categoryId, category: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
    creating: false,
    updating: false,
    deleting: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Force refresh categories
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
      })

      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updating = false;
        const { categoryId, updatedCategory } = action.payload;
        const index = state.items.findIndex(
          (cat) => cat.eventCategoryId === categoryId
        );
        if (index !== -1) {
          state.items[index] = updatedCategory;
        }
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleting = false;
        const { categoryId } = action.payload;
        state.items = state.items.filter(
          (cat) => cat.eventCategoryId !== categoryId
        );
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })

      // Fetch category by ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        const { categoryId, category } = action.payload;
        const index = state.items.findIndex(
          (cat) => cat.eventCategoryId === categoryId
        );
        if (index !== -1) {
          state.items[index] = category;
        } else {
          state.items.push(category);
        }
        state.error = null;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, invalidateCategories } = categoriesSlice.actions;

// Selectors
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
