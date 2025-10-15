import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { refundRuleAPI } from '../../api/refundRuleAPI';

// Async thunks
export const fetchRefundRules = createAsyncThunk(
  'refundRules/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await refundRuleAPI.getRefundRules(1, 100);
      return response.data.items || response.data || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createRefundRule = createAsyncThunk(
  'refundRules/create',
  async (ruleData, { rejectWithValue }) => {
    try {
      const response = await refundRuleAPI.createRefundRule(ruleData);
      console.log('Create refund rule API response:', response);
      // Xử lý response structure từ backend
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRefundRule = createAsyncThunk(
  'refundRules/update',
  async ({ ruleId, ruleData }, { rejectWithValue }) => {
    try {
      const response = await refundRuleAPI.updateRefundRule(ruleId, ruleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRefundRule = createAsyncThunk(
  'refundRules/delete',
  async (ruleId, { rejectWithValue }) => {
    try {
      await refundRuleAPI.deleteRefundRule(ruleId);
      return ruleId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const refundRulesSlice = createSlice({
  name: 'refundRules',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
    creating: false,
    updating: false,
    deleting: false,
    // Multiple selected rules for forms
    selectedRules: [],
    // Rule preview for forms
    previewRule: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Multiple rule selection for forms
    selectRefundRule: (state, action) => {
      const rule = action.payload;
      if (!state.selectedRules.find(r => r.ruleRefundId === rule.ruleRefundId)) {
        state.selectedRules.push(rule);
      }
    },
    unselectRefundRule: (state, action) => {
      const ruleId = action.payload;
      state.selectedRules = state.selectedRules.filter(r => r.ruleRefundId !== ruleId);
    },
    clearSelectedRules: (state) => {
      state.selectedRules = [];
    },
    // Rule preview for forms
    setPreviewRule: (state, action) => {
      state.previewRule = action.payload;
    },
    clearPreviewRule: (state) => {
      state.previewRule = null;
    },
    // Force refresh
    invalidateRefundRules: (state) => {
      state.lastFetched = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch refund rules
      .addCase(fetchRefundRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRefundRules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchRefundRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create refund rule
      .addCase(createRefundRule.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createRefundRule.fulfilled, (state, action) => {
        state.creating = false;
        console.log('Adding new refund rule to store:', action.payload);
        // Đảm bảo rule mới có đúng structure
        const newRule = action.payload;
        if (newRule && (newRule.ruleRefundId || newRule.id)) {
          const ruleToAdd = {
            ruleRefundId: newRule.ruleRefundId || newRule.id,
            ruleName: newRule.ruleName,
            ruleDescription: newRule.ruleDescription,
            ruleRefundDetails: newRule.ruleRefundDetails || [],
            ...newRule
          };
          state.items.push(ruleToAdd);
          // Auto-add the newly created rule to selected list
          if (!state.selectedRules.find(r => r.ruleRefundId === ruleToAdd.ruleRefundId)) {
            state.selectedRules.push(ruleToAdd);
          }
        }
        // Invalidate cache để force refresh lần sau
        state.lastFetched = null;
        state.error = null;
      })
      .addCase(createRefundRule.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Update refund rule
      .addCase(updateRefundRule.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateRefundRule.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.items.findIndex(rule => rule.refundRuleId === action.payload.refundRuleId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Update selected rule if it was the updated one
        if (state.selectedRule?.refundRuleId === action.payload.refundRuleId) {
          state.selectedRule = action.payload;
        }
        state.error = null;
      })
      .addCase(updateRefundRule.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Delete refund rule
      .addCase(deleteRefundRule.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteRefundRule.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter(rule => rule.refundRuleId !== action.payload);
        // Clear selected rule if it was deleted
        if (state.selectedRule?.refundRuleId === action.payload) {
          state.selectedRule = null;
        }
        state.error = null;
      })
      .addCase(deleteRefundRule.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  selectRefundRule, 
  unselectRefundRule,
  clearSelectedRules,
  setPreviewRule,
  clearPreviewRule,
  invalidateRefundRules 
} = refundRulesSlice.actions;

// Selectors
export const selectRefundRules = (state) => state.refundRules.items;
export const selectRefundRulesLoading = (state) => state.refundRules.loading;
export const selectRefundRulesError = (state) => state.refundRules.error;
export const selectSelectedRefundRules = (state) => state.refundRules.selectedRules;
export const selectPreviewRefundRule = (state) => state.refundRules.previewRule;
export const selectRefundRuleById = (state, ruleId) => 
  state.refundRules.items.find(rule => rule.refundRuleId === ruleId);

// Check if refund rules need to be fetched (cache for 15 minutes)
export const selectShouldFetchRefundRules = (state) => {
  const { lastFetched, items } = state.refundRules;
  if (!lastFetched || items.length === 0) return true;
  return Date.now() - lastFetched > 15 * 60 * 1000; // 15 minutes
};

export default refundRulesSlice.reducer;
