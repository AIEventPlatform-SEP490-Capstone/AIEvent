import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { userAPI } from "../../api/userAPI";

export const fetchUserProfile = createAsyncThunk(
    "userProfile/fetchUserProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await userAPI.getUserProfile();
            // Handle API response structure: { statusCode, message, data }
            if (response && response.data) {
                return response.data;
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            return rejectWithValue(
                error.response ? error.response.data : error.message
            );
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    "userProfile/updateUserProfile",
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await userAPI.updateUserProfile(profileData);
            
            // Handle API response structure: { statusCode, message, data }
            if (response && response.statusCode === "AIE20001") {
                // Success response - return the profile data if available
                // If API returns empty data, return null to indicate no update needed
                return response.data && Object.keys(response.data).length > 0 ? response.data : null;
            } else {
                throw new Error(response.message || 'Update failed');
            }
        } catch (error) {
            return rejectWithValue(error.response ? error.response.data : error.message);
        }
    }
);

const initialState = {
    profile: null,
    isLoading: false,
    isUpdating: false,
    error: null,
    updateError: null,
};

const userProfileSlice = createSlice({
    name: 'userProfile',
    initialState,
    reducers: {
        clearUserProfileError: (state) => {
            state.error = null;
            state.updateError = null;
        },
        setProfile: (state, action) => {
            state.profile = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch user profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.profile = action.payload;
                state.error = null;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Update user profile
            .addCase(updateUserProfile.pending, (state) => {
                state.isUpdating = true;
                state.updateError = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isUpdating = false;
                // Update profile with the returned data from update response
                if (action.payload && action.payload !== null) {
                    // Only update fields that have actual data, preserve existing data for empty responses
                    const updatedProfile = { ...state.profile };
                    
                    // Only update fields that exist and are not empty in the response
                    Object.keys(action.payload).forEach(key => {
                        if (action.payload[key] !== undefined && action.payload[key] !== null) {
                            updatedProfile[key] = action.payload[key];
                        }
                    });
                    
                    state.profile = updatedProfile;
                }
                // If action.payload is null, it means API returned empty data, so we keep existing profile
                state.updateError = null;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isUpdating = false;
                state.updateError = action.payload;
            });
    },
});

export const { clearUserProfileError, setProfile } = userProfileSlice.actions;

// Selector
export const selectUserProfile = (state) => state.userProfile.profile;

export default userProfileSlice.reducer;