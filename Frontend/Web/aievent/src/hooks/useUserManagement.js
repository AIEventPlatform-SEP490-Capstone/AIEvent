import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllUsers,
  fetchAllBannedUsers,
  fetchUserById,
  banUser,
  unbanUser,
  setSelectedUser,
  clearSelectedUser,
  setFilters,
  clearFilters,
  clearError,
  setActiveTab,
  selectUsers,
  selectBannedUsers,
  selectSelectedUser,
  selectUserManagementLoading,
  selectUserLoading,
  selectUserManagementError,
  selectUserPagination,
  selectBannedUserPagination,
  selectUserFilters,
  selectActiveTab
} from '../store/slices/userManagementSlice';

export const useUserManagement = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const bannedUsers = useSelector(selectBannedUsers);
  const selectedUser = useSelector(selectSelectedUser);
  const loading = useSelector(selectUserManagementLoading);
  const loadingUser = useSelector(selectUserLoading);
  const error = useSelector(selectUserManagementError);
  const pagination = useSelector(selectUserPagination);
  const bannedPagination = useSelector(selectBannedUserPagination);
  const filters = useSelector(selectUserFilters);
  const activeTab = useSelector(selectActiveTab);

  // Fetch users based on active tab
  useEffect(() => {
    if (activeTab === 'active') {
      dispatch(fetchAllUsers({ 
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...filters
      }));
    } else {
      dispatch(fetchAllBannedUsers({ 
        pageNumber: bannedPagination.currentPage,
        pageSize: bannedPagination.pageSize,
        ...filters
      }));
    }
  }, [dispatch, activeTab, pagination.currentPage, pagination.pageSize, bannedPagination.currentPage, bannedPagination.pageSize, filters]);

  const refreshUsers = () => {
    if (activeTab === 'active') {
      dispatch(fetchAllUsers({ 
        pageNumber: pagination.currentPage,
        pageSize: pagination.pageSize,
        ...filters
      }));
    } else {
      dispatch(fetchAllBannedUsers({ 
        pageNumber: bannedPagination.currentPage,
        pageSize: bannedPagination.pageSize,
        ...filters
      }));
    }
  };

  const loadUsers = (pageNumber, pageSize, email, name, role) => {
    if (activeTab === 'active') {
      dispatch(fetchAllUsers({ pageNumber, pageSize, email, name, role }));
    } else {
      dispatch(fetchAllBannedUsers({ pageNumber, pageSize, email, name, role }));
    }
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

  const unbanSelectedUser = async (userId) => {
    return dispatch(unbanUser(userId));
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

  const switchToActiveTab = () => {
    dispatch(setActiveTab('active'));
  };

  const switchToBannedTab = () => {
    dispatch(setActiveTab('banned'));
  };

  return {
    users,
    bannedUsers,
    selectedUser,
    loading,
    loadingUser,
    error,
    pagination,
    bannedPagination,
    filters,
    activeTab,
    refreshUsers,
    loadUsers,
    loadUserById,
    selectUser,
    clearSelectedUserDetails,
    banSelectedUser,
    unbanSelectedUser,
    updateUserFilters,
    clearUserFilters,
    clearUserManagementError,
    switchToActiveTab,
    switchToBannedTab
  };
};

export default useUserManagement;