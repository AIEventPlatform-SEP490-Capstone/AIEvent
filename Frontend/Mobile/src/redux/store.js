import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/Reducer';
import eventsReducer from './slices/eventsSlice';
import categoriesReducer from './slices/categoriesSlice';
import favoriteEventsReducer from './slices/favoriteEventsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    categories: categoriesReducer,
    favoriteEvents: favoriteEventsReducer,
  },
});

export default store;