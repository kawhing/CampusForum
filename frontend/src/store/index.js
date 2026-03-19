import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import questionsReducer from './slices/questionsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    questions: questionsReducer,
  },
});

export default store;
