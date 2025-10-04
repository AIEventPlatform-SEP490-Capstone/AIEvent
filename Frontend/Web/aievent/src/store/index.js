import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";  // Slice ban đầu

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Thêm các reducer khác sau
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export default store;