import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { fetchUserProfile, updateUserProfile, clearUserProfileError } from '../store/slices/userProfileSlice';

export const useUserProfile = () => {
  const dispatch = useDispatch();
  const {
    profile,
    isLoading,
    isUpdating,
    error,
    updateError,
  } = useSelector((state) => state.userProfile);

  const getUserProfile = useCallback(() => dispatch(fetchUserProfile()), [dispatch]);
  const updateProfile = useCallback((profileData) => dispatch(updateUserProfile(profileData)), [dispatch]);
  const clearError = useCallback(() => dispatch(clearUserProfileError()), [dispatch]);

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    updateError,
    getUserProfile,
    updateProfile,
    clearError,
  };
};