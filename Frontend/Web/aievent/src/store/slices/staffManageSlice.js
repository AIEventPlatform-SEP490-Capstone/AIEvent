import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userManagementAPI } from '../../api/userManagementAPI';

export const fetchAllStaff = createAsyncThunk(
    'staffManagement/fetchAll',
    async ({ pageNumber = 1, pageSize = 10, email = '', name = '' }, { rejectWithValue }) => {
        try {
            const response = await userManagementAPI.getAllStaff(pageNumber, pageSize, email, name);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addStaff = createAsyncThunk(
    'staffManagement/add',
    async (staffData, { rejectWithValue }) => {
        try {
            const response = await userManagementAPI.addStaff(staffData);
            return response;
        } catch (error) {
            // Pass the full error object to preserve statusCode and message
            return rejectWithValue({
                message: error.message || error.response?.message || 'Failed to add staff',
                statusCode: error.code || error.response?.statusCode,
                response: error.response
            });
        }
    }
);

export const deleteStaff = createAsyncThunk(
    'staffManagement/delete',
    async (staffId, { rejectWithValue }) => {
        try {
            const response = await userManagementAPI.deleteStaff(staffId);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    staffList: [],
    staffPagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
    },
    staffFilters: {
        email: '',
        name: ''
    },
    staffLoading: false,
    staffError: null,
};

const staffManagementSlice = createSlice({
    name: 'staffManagement',
    initialState,
    reducers: {
        setStaffFilters: (state, action) => {
            state.staffFilters = action.payload;
        },
        clearStaffFilters: (state) => {
            state.staffFilters = { email: '', name: '' };
        },
        clearStaffError: (state) => {
            state.staffError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllStaff.pending, (state) => {
                state.staffLoading = true;
                state.staffError = null;
            })
            .addCase(fetchAllStaff.fulfilled, (state, action) => {
                state.staffLoading = false;
                // Response structure: { statusCode, message, data: { items, totalItems, currentPage, ... } }
                state.staffList = action.payload.data?.items || [];
                state.staffPagination = {
                    currentPage: action.payload.data?.currentPage || 1,
                    pageSize: action.payload.data?.pageSize || 10,
                    totalItems: action.payload.data?.totalItems || 0,
                    totalPages: action.payload.data?.totalPages || 0,
                };
            })
            .addCase(fetchAllStaff.rejected, (state, action) => {
                state.staffLoading = false;
                state.staffError = action.payload;
            })
            .addCase(addStaff.pending, (state) => {
                state.staffLoading = true;
                state.staffError = null;
            })
            .addCase(addStaff.fulfilled, (state, action) => {
                state.staffLoading = false;
                // Add new staff to list if response includes staff data
                if (action.payload.data) {
                    state.staffList.push(action.payload.data);
                }
            })
            .addCase(addStaff.rejected, (state, action) => {
                state.staffLoading = false;
                state.staffError = action.payload;
            })
            .addCase(deleteStaff.pending, (state) => {
                state.staffLoading = true;
                state.staffError = null;
            })
            .addCase(deleteStaff.fulfilled, (state, action) => {
                state.staffLoading = false;
                // Remove deleted staff from list
                const deletedId = action.payload.data?.id || action.payload.id;
                if (deletedId) {
                    state.staffList = state.staffList.filter(staff => staff.id !== deletedId);
                }
            })
            .addCase(deleteStaff.rejected, (state, action) => {
                state.staffLoading = false;
                state.staffError = action.payload;
            });
    },
});

export const { setStaffFilters, clearStaffFilters, clearStaffError } = staffManagementSlice.actions;

export const selectStaffList = (state) => state.staffManagement.staffList;
export const selectStaffPagination = (state) => state.staffManagement.staffPagination;
export const selectStaffFilters = (state) => state.staffManagement.staffFilters;
export const selectStaffLoading = (state) => state.staffManagement.staffLoading;
export const selectStaffError = (state) => state.staffManagement.staffError;

export default staffManagementSlice.reducer;