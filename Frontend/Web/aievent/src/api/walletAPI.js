import fetcher from "./fetcher";

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
    }
};