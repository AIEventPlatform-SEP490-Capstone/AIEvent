import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class WalletService {
  /**
   * Get user wallet
   */
  static async getUserWallet() {
    try {
      const data = await BaseApiService.get(EndUrls.WALLET_USER);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Wallet fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch wallet',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch wallet',
        error: error.message,
      };
    }
  }

  /**
   * Get wallet transactions
   */
  static async getWalletTransactions(walletId, params = {}) {
    try {
      const queryParams = {
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 5,
        ...params,
      };

      const data = await BaseApiService.get(`${EndUrls.WALLET_TRANSACTIONS.replace('{walletId}', walletId)}`, queryParams);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Transactions fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch transactions',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch transactions',
        error: error.message,
      };
    }
  }

  /**
   * Create topup payment
   */
  static async createTopupPayment(amount) {
    try {
      // Validate amount is at least 10000
      if (amount < 10000) {
        throw new Error('Số tiền nạp ít nhất phải là: 10.000 VNĐ');
      }
      
      const data = await BaseApiService.post(EndUrls.PAYMENT_TOPUP, amount);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001" || data.statusCode === "AIE20100") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Topup payment created successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to create topup payment',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create topup payment',
        error: error.message,
      };
    }
  }
}

export default WalletService;
