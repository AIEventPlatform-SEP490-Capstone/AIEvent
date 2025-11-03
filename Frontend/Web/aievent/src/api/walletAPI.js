import fetcher from "./fetcher";
import axios from "axios";

export const walletAPI = {
    getUserWallet: async () => {
        const response = await fetcher.get("/wallet/user");
        return response.data;
    },

    getWalletTransactions: async (walletId, params = {}) => {
        try {
            const response = await fetcher.get(`/wallet/${walletId}/transactions`, {
                 params: {
                    pageNumber: params.pageNumber || 1,
                    pageSize: params.pageSize || 5,
                    ...params,
                 }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createTopupPayment: async (amount) => {
        try {
            // Validate amount is at least 10000
            if (amount < 10000) {
                throw new Error('Số tiền nạp ít nhất phải là: 10.000 VNĐ');
            }
            
            const response = await fetcher.post("/payment/topup", amount);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getPaymentInformations: async (params = {}) => {
        try {
            const response = await fetcher.get("/payment/informations", {
                params: {
                    pageNumber: params.pageNumber || 1,
                    pageSize: params.pageSize || 5,
                    ...params
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deletePaymentInformation: async (id) => {
        try {
            const response = await fetcher.delete(`/payment/information/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createPaymentInformation: async (paymentInfo) => {
        try {
            const response = await fetcher.post("/payment/information", paymentInfo);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getBanksFromVietnamQR: async () => {
        try {
            const response = await axios.get("https://api.vietqr.io/v2/banks");
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    withdraw: async (withdrawData) => {
        try {
            // Validate amount is at least 10000
            if (withdrawData.amount < 10000) {
                throw new Error('Số tiền rút ít nhất phải là: 10.000 VNĐ');
            }
            
            const response = await fetcher.post("/payment/withdraw", withdrawData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};