import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllUsers,
  fetchUserById,
  banUser,
  setSelectedUser,
  clearSelectedUser,
  setFilters,
  clearFilters,
  clearError,
  selectUsers,
  selectSelectedUser,
  selectUserManagementLoading,
  selectUserLoading,
  selectUserManagementError,
  selectUserPagination,
  selectUserFilters
} from '../store/slices/userManagementSlice';

export const useUserManagement = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const selectedUser = useSelector(selectSelectedUser);
  const loading = useSelector(selectUserManagementLoading);
  const loadingUser = useSelector(selectUserLoading);
  const error = useSelector(selectUserManagementError);
  const pagination = useSelector(selectUserPagination);
  const filters = useSelector(selectUserFilters);

  // Fetch users with current filters
  useEffect(() => {
    dispatch(fetchAllUsers({ 
      pageNumber: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...filters
    }));
  }, [dispatch, pagination.currentPage, pagination.pageSize, filters]);

  const refreshUsers = () => {
    dispatch(fetchAllUsers({ 
      pageNumber: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...filters
    }));
  };

  const loadUsers = (pageNumber, pageSize, email, name, role) => {
    dispatch(fetchAllUsers({ pageNumber, pageSize, email, name, role }));
  };

  const loadUserById = async (userId) => {
    return dispatch(fetchUserById(userId));
  };

  const selectUser = (user) => {
    dispatch(setSelectedUser(user));
  };

  const clearSelectedUserDetails = () => {
    dispatch(clearSelectedUser());
  };

  const banSelectedUser = async (userId) => {
    return dispatch(banUser(userId));
  };

  const updateUserFilters = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const clearUserFilters = () => {
    dispatch(clearFilters());
  };

  const clearUserManagementError = () => {
    dispatch(clearError());
  };

  return {
    users,
    selectedUser,
    loading,
    loadingUser,
    error,
    pagination,
    filters,
    refreshUsers,
    loadUsers,
    loadUserById,
    selectUser,
    clearSelectedUserDetails,
    banSelectedUser,
    updateUserFilters,
    clearUserFilters,
    clearUserManagementError
  };
};

export default useUserManagement;