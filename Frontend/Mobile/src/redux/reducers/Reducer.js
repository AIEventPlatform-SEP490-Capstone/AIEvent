//Immutable state updates theo Redux pattern
//Centralized state cho auth data
//Predictable state changes thông qua actions

import { AUTH_ACTIONS } from '../actions/Action';

const initialState = {
  // Auth State
  isLoggedIn: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isLoggedIn: true,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        expiresAt: action.payload.expiresAt,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        isLoggedIn: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        error: null,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        expiresAt: action.payload.expiresAt,
      };

    case AUTH_ACTIONS.CHECK_AUTH_STATUS:
      return {
        ...state,
        isLoggedIn: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;