//Quản lý state của authentication trên toàn app
//Thunk actions để xử lý async operations
//Centralized state management cho auth status

import AuthService from '../../api/services/AuthService';
import { walletAPI } from '../../api/services';

// Action Types
export const AUTH_ACTIONS = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  CHECK_AUTH_STATUS: 'CHECK_AUTH_STATUS',
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

export const loginSuccess = (userData) => ({
  type: AUTH_ACTIONS.LOGIN_SUCCESS,
  payload: userData,
});

export const loginFailure = (error) => ({
  type: AUTH_ACTIONS.LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: AUTH_ACTIONS.LOGOUT,
});

export const refreshTokenSuccess = (tokens) => ({
  type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS,
  payload: tokens,
});

export const checkAuthStatus = (isLoggedIn) => ({
  type: AUTH_ACTIONS.CHECK_AUTH_STATUS,
  payload: isLoggedIn,
});

export const changePasswordRequest = () => ({
  type: AUTH_ACTIONS.CHANGE_PASSWORD_REQUEST,
});

export const changePasswordSuccess = (message) => ({
  type: AUTH_ACTIONS.CHANGE_PASSWORD_SUCCESS,
  payload: message,
});

export const changePasswordFailure = (error) => ({
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
  return async (dispatch) => {
    dispatch(loginRequest());
    
    try {
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        dispatch(loginSuccess(result.data));
        return { success: true, message: result.message };
      } else {
        const message = result.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        dispatch(loginFailure(message));
        return { success: false, message };
      }
    } catch (error) {
      const message = 'Đăng nhập thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.';
      dispatch(loginFailure(message));
      return { success: false, message };
    }
  };
};

export const logoutUser = () => {
  return async (dispatch) => {
    try {
      await AuthService.logout();
      dispatch(logout());
    } catch (error) {
      // Logout error occurred
      dispatch(logout()); // Vẫn logout ngay cả khi có lỗi
    }
  };
};

export const checkAuth = () => {
  return async (dispatch) => {
    try {
      const isLoggedIn = await AuthService.isLoggedIn();
      dispatch(checkAuthStatus(isLoggedIn));
      return isLoggedIn;
    } catch (error) {
      dispatch(checkAuthStatus(false));
      return false;
    }
  };
};

export const changePassword = (currentPassword, newPassword, confirmPassword) => {
  return async (dispatch) => {
    dispatch(changePasswordRequest());
    
    try {
      const result = await AuthService.changePassword(currentPassword, newPassword, confirmPassword);
      
      if (result.success) {
        dispatch(changePasswordSuccess(result.message));
        return { success: true, message: result.message };
      } else {
        const message = result.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
        dispatch(changePasswordFailure(message));
        return { success: false, message };
      }
    } catch (error) {
      const message = 'Đổi mật khẩu thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.';
      dispatch(changePasswordFailure(message));
      return { success: false, message };
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
  return async (dispatch) => {
    dispatch({ type: WALLET_ACTIONS.FETCH_WALLET_REQUEST });
    
    try {
      const response = await walletAPI.getUserWallet();
      dispatch({ 
        type: WALLET_ACTIONS.FETCH_WALLET_SUCCESS, 
        payload: response.data 
      });
    } catch (error) {
      dispatch({ 
        type: WALLET_ACTIONS.FETCH_WALLET_FAILURE, 
        payload: error.response ? error.response.data : error.message 
      });
    }
  };
};

export const fetchWalletTransactions = ({ walletId, params }) => {
  return async (dispatch) => {
    dispatch({ type: WALLET_ACTIONS.FETCH_TRANSACTIONS_REQUEST });
    
    try {
      const response = await walletAPI.getWalletTransactions(walletId, params);
      dispatch({ 
        type: WALLET_ACTIONS.FETCH_TRANSACTIONS_SUCCESS, 
        payload: response.data 
      });
    } catch (error) {
      dispatch({ 
        type: WALLET_ACTIONS.FETCH_TRANSACTIONS_FAILURE, 
        payload: error.response ? error.response.data : error.message 
      });
    }
  };
};

export const createTopupPayment = (amount) => {
  return async (dispatch) => {
    dispatch({ type: WALLET_ACTIONS.CREATE_TOPUP_REQUEST });
    
    try {
      const response = await walletAPI.createTopupPayment(amount);
      dispatch({ 
        type: WALLET_ACTIONS.CREATE_TOPUP_SUCCESS, 
        payload: response.data
      });
    } catch (error) {
      dispatch({ 
        type: WALLET_ACTIONS.CREATE_TOPUP_FAILURE, 
        payload: error.response ? error.response.data : error.message 
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