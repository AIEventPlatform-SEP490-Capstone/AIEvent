import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { walletAPI } from "../../api/walletAPI";

export const fetchUserWallet = createAsyncThunk(
  "wallet/fetchUserWallet",
  async (_, { rejectWithValue }) => {
    try {
      const response = await walletAPI.getUserWallet();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const fetchWalletTransactions = createAsyncThunk(
  "wallet/fetchWalletTransactions",
  async ({ walletId, params }, { rejectWithValue }) => {
    try {
      const response = await walletAPI.getWalletTransactions(walletId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const createTopupPayment = createAsyncThunk(
  "wallet/createTopupPayment",
  async (amount, { rejectWithValue }) => {
    try {
      const response = await walletAPI.createTopupPayment(amount);
      return response;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
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
    isLoading: false,
    isTransactionsLoading: false,
    isTopupLoading: false,
    error: null,
    transactionsError: null,
    topupError: null,
  },
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    clearWallet: (state) => {
      state.wallet = null;
      state.error = null;
    },
    clearTransactionsError: (state) => {
      state.transactionsError = null;
    },
    clearTopupError: (state) => {
      state.topupError = null;
    },
    clearTopupPayment: (state) => {
      state.topupPayment = null;
      state.topupError = null;
    },
    setTransactionFilter: (state, action) => {
      state.transactionFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Wallet
      .addCase(fetchUserWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallet = action.payload;
        state.error = null;
      })
      .addCase(fetchUserWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Transactions
      .addCase(fetchWalletTransactions.pending, (state) => {
        state.isTransactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.isTransactionsLoading = false;
        state.transactions = action.payload;
        state.transactionsError = null;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.isTransactionsLoading = false;
        state.transactionsError = action.payload;
      })
      // Topup Payment
      .addCase(createTopupPayment.pending, (state) => {
        state.isTopupLoading = true;
        state.topupError = null;
      })
      .addCase(createTopupPayment.fulfilled, (state, action) => {
        state.isTopupLoading = false;
        state.topupPayment = action.payload;
        state.topupError = null;
      })
      .addCase(createTopupPayment.rejected, (state, action) => {
        state.isTopupLoading = false;
        state.topupError = action.payload;
      });
  },
});

export const { 
  clearWalletError, 
  clearWallet, 
  clearTransactionsError, 
  clearTopupError,
  clearTopupPayment,
  setTransactionFilter 
} = walletSlice.actions;
export default walletSlice.reducer;