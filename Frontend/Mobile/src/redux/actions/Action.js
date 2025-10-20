//Quản lý state của authentication trên toàn app
//Thunk actions để xử lý async operations
//Centralized state management cho auth status

import AuthService from '../../services/AuthService';

// Action Types
export const AUTH_ACTIONS = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  CHECK_AUTH_STATUS: 'CHECK_AUTH_STATUS',
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