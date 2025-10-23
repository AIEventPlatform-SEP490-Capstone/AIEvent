import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tagAPI } from '../../api/tagAPI';

// Async thunks
export const fetchTags = createAsyncThunk(
  'tags/fetchAll',
  async (userRole = null, { rejectWithValue }) => {
    try {
      let response;
      // If user is organizer or manager, use the user-specific endpoint
      if (userRole && (userRole.toLowerCase() === 'organizer')) {
        response = await tagAPI.getUserTags(1, 100);
      } else {
        response = await tagAPI.getTags(1, 100);
      }
      return response.data.items || response.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTag = createAsyncThunk(
  'tags/create',
  async (tagData, { rejectWithValue }) => {
    try {
      const response = await tagAPI.createTag(tagData);
      console.log('Create tag API response:', response);
      // Xử lý response structure từ backend
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTag = createAsyncThunk(
  'tags/update',
  async ({ tagId, tagData }, { rejectWithValue }) => {
    try {
      const response = await tagAPI.updateTag(tagId, tagData);
      return response.data;
    } catch (error) {
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
      return rejectWithValue(error.message);
    }
  }
);

const tagsSlice = createSlice({
  name: 'tags',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
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
    }
  },
  extraReducers: (builder) => {
    builder
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
        console.log('Adding new tag to store:', action.payload);
        // Đảm bảo tag mới có đúng structure
        const newTag = action.payload;
        if (newTag && (newTag.tagId || newTag.id)) {
          state.items.push({
            tagId: newTag.tagId || newTag.id,
            tagName: newTag.tagName || newTag.nameTag,
            nameTag: newTag.nameTag || newTag.tagName,
            ...newTag
          });
        }
        // Invalidate cache để force refresh lần sau
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
          state.items[index] = action.payload;
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
  invalidateTags 
} = tagsSlice.actions;

// Selectors
export const selectTags = (state) => state.tags.items;
export const selectTagsLoading = (state) => state.tags.loading;
export const selectTagsError = (state) => state.tags.error;
export const selectSelectedTags = (state) => state.tags.selectedTags;
export const selectTagById = (state, tagId) => 
  state.tags.items.find(tag => tag.tagId === tagId);

// Check if tags need to be fetched (cache for 10 minutes)
export const selectShouldFetchTags = (state) => {
  const { lastFetched, items } = state.tags;
  if (!lastFetched || items.length === 0) return true;
  return Date.now() - lastFetched > 10 * 60 * 1000; // 10 minutes
};

export default tagsSlice.reducer;