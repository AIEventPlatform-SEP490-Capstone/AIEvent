import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/Reducer';
import eventsReducer from './slices/eventsSlice';
import categoriesReducer from './slices/categoriesSlice';
import favoriteEventsReducer from './slices/favoriteEventsSlice';
import aiChatReducer from './slices/aiChatSlice';
import notificationsReducer from './slices/notificationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    categories: categoriesReducer,
    favoriteEvents: favoriteEventsReducer,
    aiChat: aiChatReducer,
    notifications: notificationsReducer,
  },
});

export default store;