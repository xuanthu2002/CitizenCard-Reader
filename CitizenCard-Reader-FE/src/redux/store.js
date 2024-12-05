import { configureStore } from '@reduxjs/toolkit';
import sampleReducer from './sampleSlice';

const store = configureStore({
    reducer: {
        samples: sampleReducer,
    },
});

export default store;
