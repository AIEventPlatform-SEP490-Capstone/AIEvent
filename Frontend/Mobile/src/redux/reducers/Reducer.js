//Immutable state updates theo Redux pattern
//Centralized state cho auth data
//Predictable state changes thông qua actions

import { AUTH_ACTIONS, WALLET_ACTIONS } from '../actions/Action';

const initialState = {
  // Auth State
  isLoggedIn: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  error: null,
  
  // Wallet State
  wallet: null,
  transactions: {
    items: [],
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 5,
    hasPreviousPage: false,
    hasNextPage: false,
  },
  topupPayment: null,
  isWalletLoading: false,
  isTransactionsLoading: false,
  isTopupLoading: false,
  walletError: null,
  transactionsError: null,
  topupError: null,
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

    // Wallet Actions
    case WALLET_ACTIONS.FETCH_WALLET_REQUEST:
      return {
        ...state,
        isWalletLoading: true,
        walletError: null,
      };

    case WALLET_ACTIONS.FETCH_WALLET_SUCCESS:
      return {
        ...state,
        isWalletLoading: false,
        wallet: action.payload,
        walletError: null,
      };

    case WALLET_ACTIONS.FETCH_WALLET_FAILURE:
      return {
        ...state,
        isWalletLoading: false,
        walletError: action.payload,
      };

    case WALLET_ACTIONS.FETCH_TRANSACTIONS_REQUEST:
      return {
        ...state,
        isTransactionsLoading: true,
        transactionsError: null,
      };

    case WALLET_ACTIONS.FETCH_TRANSACTIONS_SUCCESS:
      return {
        ...state,
        isTransactionsLoading: false,
        transactions: action.payload,
        transactionsError: null,
      };

    case WALLET_ACTIONS.FETCH_TRANSACTIONS_FAILURE:
      return {
        ...state,
        isTransactionsLoading: false,
        transactionsError: action.payload,
      };

    case WALLET_ACTIONS.CREATE_TOPUP_REQUEST:
      return {
        ...state,
        isTopupLoading: true,
        topupError: null,
      };

    case WALLET_ACTIONS.CREATE_TOPUP_SUCCESS:
      return {
        ...state,
        isTopupLoading: false,
        topupPayment: action.payload,
        topupError: null,
      };

    case WALLET_ACTIONS.CREATE_TOPUP_FAILURE:
      return {
        ...state,
        isTopupLoading: false,
        topupError: action.payload,
      };

    case WALLET_ACTIONS.CLEAR_WALLET_ERROR:
      return {
        ...state,
        walletError: null,
      };

    case WALLET_ACTIONS.CLEAR_WALLET:
      return {
        ...state,
        wallet: null,
        walletError: null,
      };

    case WALLET_ACTIONS.CLEAR_TRANSACTIONS_ERROR:
      return {
        ...state,
        transactionsError: null,
      };

    case WALLET_ACTIONS.CLEAR_TOPUP_ERROR:
      return {
        ...state,
        topupError: null,
      };

    case WALLET_ACTIONS.CLEAR_TOPUP_PAYMENT:
      return {
        ...state,
        topupPayment: null,
        topupError: null,
      };

    default:
      return state;
  }
};

export default authReducer;