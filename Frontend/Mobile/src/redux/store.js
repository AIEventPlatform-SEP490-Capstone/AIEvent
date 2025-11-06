import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/Reducer';
import eventsReducer from './slices/eventsSlice';
import categoriesReducer from './slices/categoriesSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    categories: categoriesReducer,
  },
});

export default store;