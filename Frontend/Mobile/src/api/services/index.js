import BaseApiService from './BaseApiService';
import UserService from './UserService';
import EventService from './EventService';
import AuthService from './AuthService';
import WalletService from './WalletService';
import BookingService from './BookingService';
import FriendService from './FriendService';
import RatingService from './RatingService';

export const walletAPI = {
  getUserWallet: async () => {
    const result = await WalletService.getUserWallet();
    return result.success
      ? {data: result.data}
      : Promise.reject(new Error(result.message));
  },
  getWalletTransactions: async (walletId, params = {}) => {
    const result = await WalletService.getWalletTransactions(walletId, params);
    return result.success
      ? {data: result.data}
      : Promise.reject(new Error(result.message));
  },
  createTopupPayment: async amount => {
    const result = await WalletService.createTopupPayment(amount);
    return result.success ? result : Promise.reject(new Error(result.message));
  },
  getPaymentInformations: async (params = {}) => {
    const result = await WalletService.getPaymentInformations(params);
    return result.success
      ? {data: result.data}
      : Promise.reject(new Error(result.message));
  },
  createPaymentInformation: async paymentInfo => {
    const result = await WalletService.createPaymentInformation(paymentInfo);
    return result.success ? result : Promise.reject(new Error(result.message));
  },
  deletePaymentInformation: async id => {
    const result = await WalletService.deletePaymentInformation(id);
    return result.success ? result : Promise.reject(new Error(result.message));
  },
  withdraw: async withdrawData => {
    const result = await WalletService.withdraw(withdrawData);
    return result.success ? result : Promise.reject(new Error(result.message));
  },
};

export {
  BaseApiService,
  UserService,
  EventService,
  AuthService,
  WalletService,
  BookingService,
  FriendService,
  RatingService,
};

export default {
  BaseApiService,
  UserService,
  EventService,
  AuthService,
  WalletService,
  BookingService,
  FriendService,
  RatingService,
};
