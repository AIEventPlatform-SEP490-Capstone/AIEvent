import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class WalletService {
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

  static async getWalletTransactions(walletId, params = {}) {
    try {
      const queryParams = {
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 5,
        ...params,
      };

      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      const baseUrl = EndUrls.WALLET_TRANSACTIONS.replace('{walletId}', walletId);
      const url = `${baseUrl}?${queryString}`;

      const data = await BaseApiService.get(url);
      
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

  static async createTopupPayment(amount) {
    try {
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

  static async getPaymentInformations(params = {}) {
    try {
      const queryParams = {
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 10,
        ...params,
      };

      const queryString = Object.keys(queryParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
        .join('&');
      const url = `${EndUrls.PAYMENT_INFORMATIONS}?${queryString}`;

      const data = await BaseApiService.get(url);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Payment informations fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch payment informations',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch payment informations',
        error: error.message,
      };
    }
  }

  static async createPaymentInformation(paymentInfo) {
    try {
      const data = await BaseApiService.post(EndUrls.PAYMENT_INFORMATION, paymentInfo);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001" || data.statusCode === "AIE20100") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Payment information created successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to create payment information',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create payment information',
        error: error.message,
      };
    }
  }
    
  static async deletePaymentInformation(id) {
    try {
      const data = await BaseApiService.delete(EndUrls.PAYMENT_INFORMATION_DELETE(id));
      
      if (data.statusCode === "AIE20000" || data.statusCode === "AIE20001" || data.statusCode === "AIE20400") {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Payment information deleted successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to delete payment information',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to delete payment information',
        error: error.message,
      };
    }
  }

  static async withdraw(withdrawData) {
    try {
      if (withdrawData.amount < 10000) {
        throw new Error('Số tiền rút ít nhất phải là: 10.000 VNĐ');
      }
      
      const data = await BaseApiService.post(EndUrls.PAYMENT_WITHDRAW, withdrawData);
      
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001" || data.statusCode === "AIE20100") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Withdraw request created successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to create withdraw request',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create withdraw request',
        error: error.message,
      };
    }
  }
}

export default WalletService;
