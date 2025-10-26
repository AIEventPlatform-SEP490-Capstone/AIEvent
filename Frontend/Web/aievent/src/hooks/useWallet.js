import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  fetchUserWallet, 
  fetchWalletTransactions,
  createTopupPayment,
  clearWalletError, 
  clearWallet,
  clearTransactionsError,
  clearTopupError,
  clearTopupPayment,
  setTransactionFilter
} from '../store/slices/walletSlice';

export const useWallet = () => {
  const dispatch = useDispatch();
  const { 
    wallet, 
    transactions,
    topupPayment,
    isLoading, 
    isTransactionsLoading,
    isTopupLoading,
    error, 
    transactionsError,
    topupError
  } = useSelector((state) => state.wallet);

  const getWallet = useCallback(() => dispatch(fetchUserWallet()), [dispatch]);
  
  const getTransactions = useCallback((walletId, params = {}) => 
    dispatch(fetchWalletTransactions({ walletId, params })), [dispatch]);
  
  const createTopup = useCallback((amount) => 
    dispatch(createTopupPayment(amount)), [dispatch]);
  
  const clearError = useCallback(() => dispatch(clearWalletError()), [dispatch]);
  const clearWalletData = useCallback(() => dispatch(clearWallet()), [dispatch]);
  const clearTransactionsErrorCallback = useCallback(() => dispatch(clearTransactionsError()), [dispatch]);
  const clearTopupErrorCallback = useCallback(() => dispatch(clearTopupError()), [dispatch]);
  const clearTopupPaymentCallback = useCallback(() => dispatch(clearTopupPayment()), [dispatch]);
  const setFilter = useCallback((filter) => dispatch(setTransactionFilter(filter)), [dispatch]);

  return {
    wallet,
    transactions,
    topupPayment,
    isLoading,
    isTransactionsLoading,
    isTopupLoading,
    error,
    transactionsError,
    topupError,
    getWallet,
    getTransactions,
    createTopup,
    clearError,
    clearWalletData,
    clearTransactionsError: clearTransactionsErrorCallback,
    clearTopupError: clearTopupErrorCallback,
    clearTopupPayment: clearTopupPaymentCallback,
    setFilter,
  };
};