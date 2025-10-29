import BaseApiService from './BaseApiService';
import UserService from './UserService';
import EventService from './EventService';
import AuthService from './AuthService';
import WalletService from './WalletService';

// Create walletAPI object similar to web version
export const walletAPI = {
  getUserWallet: async () => {
    const result = await WalletService.getUserWallet();
    return result.success ? { data: result.data } : Promise.reject(new Error(result.message));
  },
  getWalletTransactions: async (walletId, params = {}) => {
    const result = await WalletService.getWalletTransactions(walletId, params);
    return result.success ? { data: result.data } : Promise.reject(new Error(result.message));
  },
  createTopupPayment: async (amount) => {
    const result = await WalletService.createTopupPayment(amount);
    return result.success ? result : Promise.reject(new Error(result.message));
  }
};

export {
  BaseApiService,
  UserService,
  EventService,
  AuthService,
  WalletService,
};

// Default export for backward compatibility
export default {
  BaseApiService,
  UserService,
  EventService,
  AuthService,
  WalletService,
};
