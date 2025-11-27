//Quản lý state của authentication trên toàn app
//Thunk actions để xử lý async operations
//Centralized state management cho auth status

import AuthService from '../../api/services/AuthService';
import UserService from '../../api/services/UserService';
import {walletAPI} from '../../api/services';

// Action Types
export const AUTH_ACTIONS = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  CHECK_AUTH_STATUS: 'CHECK_AUTH_STATUS',
  SET_USER_INFO: 'SET_USER_INFO',
  CHANGE_PASSWORD_REQUEST: 'CHANGE_PASSWORD_REQUEST',
  CHANGE_PASSWORD_SUCCESS: 'CHANGE_PASSWORD_SUCCESS',
  CHANGE_PASSWORD_FAILURE: 'CHANGE_PASSWORD_FAILURE',
  CLEAR_CHANGE_PASSWORD_ERROR: 'CLEAR_CHANGE_PASSWORD_ERROR',
  CLEAR_CHANGE_PASSWORD_SUCCESS: 'CLEAR_CHANGE_PASSWORD_SUCCESS',
};

// Action Creators
export const loginRequest = () => ({
  type: AUTH_ACTIONS.LOGIN_REQUEST,
});

export const loginSuccess = userData => ({
  type: AUTH_ACTIONS.LOGIN_SUCCESS,
  payload: userData,
});

export const loginFailure = error => ({
  type: AUTH_ACTIONS.LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: AUTH_ACTIONS.LOGOUT,
});

export const refreshTokenSuccess = tokens => ({
  type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS,
  payload: tokens,
});

export const checkAuthStatus = isLoggedIn => ({
  type: AUTH_ACTIONS.CHECK_AUTH_STATUS,
  payload: isLoggedIn,
});

export const setUserInfo = user => ({
  type: AUTH_ACTIONS.SET_USER_INFO,
  payload: user,
});

export const changePasswordRequest = () => ({
  type: AUTH_ACTIONS.CHANGE_PASSWORD_REQUEST,
});

export const changePasswordSuccess = message => ({
  type: AUTH_ACTIONS.CHANGE_PASSWORD_SUCCESS,
  payload: message,
});

export const changePasswordFailure = error => ({
  type: AUTH_ACTIONS.CHANGE_PASSWORD_FAILURE,
  payload: error,
});

export const clearChangePasswordError = () => ({
  type: AUTH_ACTIONS.CLEAR_CHANGE_PASSWORD_ERROR,
});

export const clearChangePasswordSuccess = () => ({
  type: AUTH_ACTIONS.CLEAR_CHANGE_PASSWORD_SUCCESS,
});

// Thunk Actions (Async Actions)
export const login = (email, password) => {
  return async dispatch => {
    dispatch(loginRequest());

    try {
      const result = await AuthService.login(email, password);

      if (result.success) {
        dispatch(loginSuccess(result.data));

        // Load user profile after login
        try {
          const profileResult = await UserService.getProfile();
          if (profileResult.success && profileResult.data) {
            dispatch(setUserInfo(profileResult.data));
          }
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }

        return {success: true, message: result.message};
      } else {
        const message =
          result.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        dispatch(loginFailure(message));
        return {success: false, message};
      }
    } catch (error) {
      const message =
        'Đăng nhập thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.';
      dispatch(loginFailure(message));
      return {success: false, message};
    }
  };
};

let isLoggingOut = false;

export const logoutUser = () => {
  return async (dispatch, getState) => {
    // Prevent multiple simultaneous logout attempts
    if (isLoggingOut) {
      console.log('Logout already in progress, skipping...');
      return;
    }
    
    isLoggingOut = true;
    
    try {
      console.log('Starting logout process...');
      // Call logout API
      await AuthService.logout();
      
      // Dispatch logout action to update state
      dispatch(logout());
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Logout error occurred but still dispatch logout to update state
      dispatch(logout());
    } finally {
      isLoggingOut = false;
    }
  };
};

// Helper function to check if user is staff (copied from jwtUtils to avoid circular dependencies)
const isStaffUser = (token) => {
  try {
    // Handle null, undefined, or non-string token
    if (!token || typeof token !== 'string') return false;
    
    // Decode JWT token
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload);
    const parsedPayload = JSON.parse(decodeURIComponent(escape(decodedPayload)));
    
    // Check for role in different possible locations
    const role = parsedPayload.role || parsedPayload.Role || parsedPayload.roles || parsedPayload.Roles || null;
    
    if (!role) return false;
    
    // Handle both string and array roles
    if (Array.isArray(role)) {
      return role.some(r => typeof r === 'string' && r.toLowerCase() === 'staff');
    }
    
    return typeof role === 'string' && role.toLowerCase() === 'staff';
  } catch (error) {
    console.error('Error checking staff role:', error);
    return false;
  }
};

export const checkAuth = () => {
  return async dispatch => {
    try {
      const isLoggedIn = await AuthService.isLoggedIn();
      dispatch(checkAuthStatus(isLoggedIn));

      // If logged in, load user profile
      if (isLoggedIn) {
        try {
          const profileResult = await UserService.getProfile();
          if (profileResult.success && profileResult.data) {
            dispatch(setUserInfo(profileResult.data));
          }
        } catch (err) {
          console.error('Failed to load user profile on app start:', err);
        }
      }

      return isLoggedIn;
    } catch (error) {
      dispatch(checkAuthStatus(false));
      return false;
    }
  };
};

export const changePassword = (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  return async dispatch => {
    dispatch(changePasswordRequest());

    try {
      const result = await AuthService.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );

      if (result.success) {
        dispatch(changePasswordSuccess(result.message));
        return {success: true, message: result.message};
      } else {
        const message =
          result.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
        dispatch(changePasswordFailure(message));
        return {success: false, message};
      }
    } catch (error) {
      const message =
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.';
      dispatch(changePasswordFailure(message));
      return {success: false, message};
    }
  };
};

export const loadUserProfile = () => {
  return async dispatch => {
    try {
      const profileResult = await UserService.getProfile();
      if (profileResult.success && profileResult.data) {
        dispatch(setUserInfo(profileResult.data));
        return {success: true, data: profileResult.data};
      } else {
        return {success: false, message: profileResult.message};
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      return {success: false, message: error.message};
    }
  };
};

// Wallet Actions
export const WALLET_ACTIONS = {
  FETCH_WALLET_REQUEST: 'FETCH_WALLET_REQUEST',
  FETCH_WALLET_SUCCESS: 'FETCH_WALLET_SUCCESS',
  FETCH_WALLET_FAILURE: 'FETCH_WALLET_FAILURE',
  FETCH_TRANSACTIONS_REQUEST: 'FETCH_TRANSACTIONS_REQUEST',
  FETCH_TRANSACTIONS_SUCCESS: 'FETCH_TRANSACTIONS_SUCCESS',
  FETCH_TRANSACTIONS_FAILURE: 'FETCH_TRANSACTIONS_FAILURE',
  CREATE_TOPUP_REQUEST: 'CREATE_TOPUP_REQUEST',
  CREATE_TOPUP_SUCCESS: 'CREATE_TOPUP_SUCCESS',
  CREATE_TOPUP_FAILURE: 'CREATE_TOPUP_FAILURE',
  CLEAR_WALLET_ERROR: 'CLEAR_WALLET_ERROR',
  CLEAR_WALLET: 'CLEAR_WALLET',
  CLEAR_TRANSACTIONS_ERROR: 'CLEAR_TRANSACTIONS_ERROR',
  CLEAR_TOPUP_ERROR: 'CLEAR_TOPUP_ERROR',
  CLEAR_TOPUP_PAYMENT: 'CLEAR_TOPUP_PAYMENT',
};

// Wallet Action Creators
export const fetchUserWallet = () => {
  return async dispatch => {
    dispatch({type: WALLET_ACTIONS.FETCH_WALLET_REQUEST});

    try {
      const response = await walletAPI.getUserWallet();
      dispatch({
        type: WALLET_ACTIONS.FETCH_WALLET_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: WALLET_ACTIONS.FETCH_WALLET_FAILURE,
        payload: error.response ? error.response.data : error.message,
      });
    }
  };
};

export const fetchWalletTransactions = ({walletId, params}) => {
  return async dispatch => {
    dispatch({type: WALLET_ACTIONS.FETCH_TRANSACTIONS_REQUEST});

    try {
      const response = await walletAPI.getWalletTransactions(walletId, params);
      dispatch({
        type: WALLET_ACTIONS.FETCH_TRANSACTIONS_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: WALLET_ACTIONS.FETCH_TRANSACTIONS_FAILURE,
        payload: error.response ? error.response.data : error.message,
      });
    }
  };
};

export const createTopupPayment = amount => {
  return async dispatch => {
    dispatch({type: WALLET_ACTIONS.CREATE_TOPUP_REQUEST});

    try {
      const response = await walletAPI.createTopupPayment(amount);
      dispatch({
        type: WALLET_ACTIONS.CREATE_TOPUP_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: WALLET_ACTIONS.CREATE_TOPUP_FAILURE,
        payload: error.response ? error.response.data : error.message,
      });
    }
  };
};

export const clearWalletError = () => ({
  type: WALLET_ACTIONS.CLEAR_WALLET_ERROR,
});

export const clearWallet = () => ({
  type: WALLET_ACTIONS.CLEAR_WALLET,
});

export const clearTransactionsError = () => ({
  type: WALLET_ACTIONS.CLEAR_TRANSACTIONS_ERROR,
});

export const clearTopupError = () => ({
  type: WALLET_ACTIONS.CLEAR_TOPUP_ERROR,
});

export const clearTopupPayment = () => ({
  type: WALLET_ACTIONS.CLEAR_TOPUP_PAYMENT,
});