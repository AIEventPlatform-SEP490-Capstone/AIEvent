import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tagAPI } from '../../api/tagAPI';
import { handleApiError } from '../../lib/toastUtils'; // Import the error handler

// Async thunks
export const fetchPopularTags = createAsyncThunk(
  'tags/fetchPopular',
  async ({ pageNumber = 1, pageSize = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await tagAPI.getPopularTags(pageNumber, pageSize);
      
      // Handle the paginated response structure
      if (response && response.items) {
        return response.items;
      }
      
      // Fallback for older response structures
      return response.data?.items || response.data || response || [];
    } catch (error) {
      handleApiError(error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTags = createAsyncThunk(
  'tags/fetchAll',
  async (userRole = null, { rejectWithValue }) => {
    try {
      let response;
      // If user is manager or admin, use the all tags endpoint
      // Organizers should see only their own tags
      if (userRole && (userRole.toLowerCase() === 'manager' || userRole.toLowerCase() === 'admin')) {
        response = await tagAPI.getTags(1, 100);
      } else {
        // For organizers and other roles, show only user's tags
        response = await tagAPI.getUserTags(1, 100);
      }
      
      // Handle the new paginated response structure
      if (response && response.items) {
        return response.items;
      }
      
      // Fallback for older response structures
      return response.data.items || response.data || response || [];
    } catch (error) {
      handleApiError(error); // Use our error handler
      return rejectWithValue(error.message);
    }
  }
);

export const createTag = createAsyncThunk(
  'tags/create',
  async (tagData, { rejectWithValue }) => {
    try {
      const response = await tagAPI.createTag(tagData);
      // Handle response structure from backend
      return response.data || response;
    } catch (error) {
      handleApiError(error); // Use our error handler
      return rejectWithValue(error.message);
    }
  }
);

export const updateTag = createAsyncThunk(
  'tags/update',
  async ({ tagId, tagData }, { rejectWithValue }) => {
    try {
      const response = await tagAPI.updateTag(tagId, tagData);
      // Handle the new response structure
      if (response && response.data) {
        return response.data;
      }
      return response;
    } catch (error) {
      handleApiError(error); // Use our error handler
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTag = createAsyncThunk(
  'tags/delete',
  async (tagId, { rejectWithValue }) => {
    try {
      await tagAPI.deleteTag(tagId);
      return tagId;
    } catch (error) {
      handleApiError(error); // Use our error handler
      return rejectWithValue(error.message);
    }
  }
);

const tagsSlice = createSlice({
  name: 'tags',
  initialState: {
    items: [],
    popularTags: [],
    loading: false,
    loadingPopular: false,
    error: null,
    lastFetched: null,
    lastFetchedPopular: null,
    creating: false,
    updating: false,
    deleting: false,
    // For tag selection in forms
    selectedTags: []
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Tag selection for forms
    selectTag: (state, action) => {
      const tag = action.payload;
      if (!state.selectedTags.find(t => t.tagId === tag.tagId)) {
        state.selectedTags.push(tag);
      }
    },
    unselectTag: (state, action) => {
      const tagId = action.payload;
      state.selectedTags = state.selectedTags.filter(t => t.tagId !== tagId);
    },
    clearSelectedTags: (state) => {
      state.selectedTags = [];
    },
    // Force refresh
    invalidateTags: (state) => {
      state.lastFetched = null;
    },
    invalidatePopularTags: (state) => {
      state.lastFetchedPopular = null;
    },
    // Clear all tags data
    clearTags: (state) => {
      state.items = [];
      state.lastFetched = null;
    },
    clearPopularTags: (state) => {
      state.popularTags = [];
      state.lastFetchedPopular = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch popular tags
      .addCase(fetchPopularTags.pending, (state) => {
        state.loadingPopular = true;
        state.error = null;
      })
      .addCase(fetchPopularTags.fulfilled, (state, action) => {
        state.loadingPopular = false;
        state.popularTags = action.payload;
        state.lastFetchedPopular = Date.now();
        state.error = null;
      })
      .addCase(fetchPopularTags.rejected, (state, action) => {
        state.loadingPopular = false;
        state.error = action.payload;
      })
      
      // Fetch tags
      .addCase(fetchTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create tag
      .addCase(createTag.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.creating = false;
        // Ensure the new tag has the correct structure
        const newTag = action.payload;
        if (newTag && (newTag.tagId || newTag.id)) {
          state.items.push({
            tagId: newTag.tagId || newTag.id,
            tagName: newTag.tagName || newTag.nameTag || newTag.TagName,
            nameTag: newTag.nameTag || newTag.tagName || newTag.TagName,
            createdDate: newTag.createdDate || newTag.CreatedDate,
            updatedDate: newTag.updatedDate || newTag.UpdatedDate,
            quantityUsed: newTag.quantityUsed || newTag.QuantityUsed || 0,
            ...newTag
          });
        }
        // Invalidate cache to force refresh next time
        state.lastFetched = null;
        state.error = null;
      })
      .addCase(createTag.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Update tag
      .addCase(updateTag.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.items.findIndex(tag => tag.tagId === action.payload.tagId);
        if (index !== -1) {
          // Ensure the updated tag has the correct structure
          const updatedTag = action.payload;
          state.items[index] = {
            tagId: updatedTag.tagId || updatedTag.id,
            tagName: updatedTag.tagName || updatedTag.nameTag || updatedTag.TagName,
            nameTag: updatedTag.nameTag || updatedTag.tagName || updatedTag.TagName,
            createdDate: updatedTag.createdDate || updatedTag.CreatedDate,
            updatedDate: updatedTag.updatedDate || updatedTag.UpdatedDate,
            quantityUsed: updatedTag.quantityUsed || updatedTag.QuantityUsed || 0,
            ...updatedTag
          };
        }
        state.error = null;
      })
      .addCase(updateTag.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Delete tag
      .addCase(deleteTag.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter(tag => tag.tagId !== action.payload);
        // Also remove from selected tags
        state.selectedTags = state.selectedTags.filter(tag => tag.tagId !== action.payload);
        state.error = null;
      })
      .addCase(deleteTag.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  selectTag, 
  unselectTag, 
  clearSelectedTags,
  invalidateTags,
  invalidatePopularTags,
  clearTags,
  clearPopularTags
} = tagsSlice.actions;

// Selectors
export const selectTags = (state) => state.tags.items;
export const selectPopularTags = (state) => state.tags.popularTags;
export const selectTagsLoading = (state) => state.tags.loading;
export const selectPopularTagsLoading = (state) => state.tags.loadingPopular;
export const selectTagsError = (state) => state.tags.error;
export const selectSelectedTags = (state) => state.tags.selectedTags;
export const selectTagById = (state, tagId) => 
  state.tags.items.find(tag => tag.tagId === tagId);

// Check if tags need to be fetched (cache for 10 minutes)
// Note: This selector doesn't have access to user role, so caching is handled in the component
export const selectShouldFetchTags = (state) => {
  const { lastFetched, items } = state.tags;
  if (!lastFetched || items.length === 0) return true;
  return Date.now() - lastFetched > 10 * 60 * 1000; // 10 minutes
};

export const selectShouldFetchPopularTags = (state) => {
  const { lastFetchedPopular, popularTags } = state.tags;
  if (!lastFetchedPopular || popularTags.length === 0) return true;
  return Date.now() - lastFetchedPopular > 10 * 60 * 1000; // 10 minutes
};

export default tagsSlice.reducer;