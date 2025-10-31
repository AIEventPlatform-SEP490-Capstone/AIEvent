import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userManagementAPI } from '../../api/userManagementAPI';

// Async thunks
export const fetchAllUsers = createAsyncThunk(
  'userManagement/fetchAll',
  async ({ pageNumber = 1, pageSize = 10, email = '', name = '', role = '' }, { rejectWithValue }) => {
    try {
      const response = await userManagementAPI.getAllUsers(pageNumber, pageSize, email, name, role);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'userManagement/fetchById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userManagementAPI.getUserById(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const banUser = createAsyncThunk(
  'userManagement/banUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userManagementAPI.banUser(userId);
      return { userId, response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState: {
    users: [],
    selectedUser: null,
    loading: false,
    loadingUser: false,
    error: null,
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0
    },
    filters: {
      email: '',
      name: '',
      role: ''
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        email: '',
        name: '',
        role: ''
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Received user data:', action.payload);
        // Handle the SuccessResponse structure
        const data = action.payload.data || action.payload;
        console.log('Extracted data:', data);
        state.users = data.items || [];
        state.pagination = {
          currentPage: data.pageNumber || 1,
          pageSize: data.pageSize || 10,
          totalItems: data.totalItems || 0,
          totalPages: data.totalPages || 0
        };
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loadingUser = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loadingUser = false;
        // Handle the SuccessResponse structure
        state.selectedUser = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loadingUser = false;
        state.error = action.payload;
      })
      
      // Ban user
      .addCase(banUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(banUser.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the banned user from the users list
        state.users = state.users.filter(user => user.id !== action.payload.userId);
        // Clear selected user if it's the banned user
        if (state.selectedUser && state.selectedUser.id === action.payload.userId) {
          state.selectedUser = null;
        }
        state.error = null;
      })
      .addCase(banUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  setSelectedUser, 
  clearSelectedUser, 
  setFilters, 
  clearFilters 
} = userManagementSlice.actions;

// Selectors
export const selectUsers = (state) => state.userManagement.users;
export const selectSelectedUser = (state) => state.userManagement.selectedUser;
export const selectUserManagementLoading = (state) => state.userManagement.loading;
export const selectUserLoading = (state) => state.userManagement.loadingUser;
export const selectUserManagementError = (state) => state.userManagement.error;
export const selectUserPagination = (state) => state.userManagement.pagination;
export const selectUserFilters = (state) => state.userManagement.filters;

export default userManagementSlice.reducer;