import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import categoriesReducer from "./slices/categoriesSlice";
import tagsReducer from "./slices/tagsSlice";
import appReducer from "./slices/appSlice";
import interestsReducer from "./slices/interestsSlice";
import eventsReducer from "./slices/eventsSlice";
import userProfileReducer from "./slices/userProfileSlice";
import walletReducer from "./slices/walletSlice";
import bookingReducer from "./slices/bookingSlice";
import organizersReducer from "./slices/organizersSlice";
import userManagementReducer from "./slices/userManagementSlice";
import favoriteEventsReducer from "./slices/favoriteEventsSlice";
import endEventRequestsReducer from "./slices/endEventRequestsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    tags: tagsReducer,
    app: appReducer,
    interests: interestsReducer,
    events: eventsReducer,
    userProfile: userProfileReducer,
    wallet: walletReducer,
    booking: bookingReducer,
    organizers: organizersReducer,
    userManagement: userManagementReducer,
    favoriteEvents: favoriteEventsReducer,
    endEventRequests: endEventRequestsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for file uploads
        ignoredActions: ["tags/create/pending", "categories/create/pending"],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: ["app.notifications"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// TypeScript types would go here if using .ts file
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;