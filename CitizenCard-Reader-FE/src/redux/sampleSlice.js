import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notification } from 'antd';
import axios from 'axios';

const apiURL = 'http://localhost:5000/samples';

export const fetchSamples = createAsyncThunk(
    'samples/fetchSamples',
    async ({ page = 0, size = 10 }, { rejectWithValue }) => {
        try {
            const response = await axios.get(apiURL, { params: { page, size } });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    },
);

export const fetchSample = createAsyncThunk('samples/fetchSample', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${apiURL}/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const deleteSample = createAsyncThunk('samples/deleteSample', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.delete(`${apiURL}/${id}`);
        notification.success({
            message: 'Thành công',
            description: 'Xóa mẫu thành công',
        });
        return response.data;
    } catch (error) {
        notification.error({
            message: 'Thất bại',
            description: 'Xóa mẫu thất bại',
        });
        return rejectWithValue(error.response.data);
    }
});

export const createSample = createAsyncThunk(
    'samples/createSample',
    async ({ imageFile, labelFile }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('label', labelFile);

            const response = await axios.post(apiURL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            notification.success({
                message: 'Thành công',
                description: 'Tạo thêm mẫu thành công',
            });
            return response.data;
        } catch (error) {
            notification.error({
                message: 'Thất bại',
                description: `Thêm mẫu thất bại - ${error.response.data.message || 'Lỗi bất định'}`,
            });
            return rejectWithValue(error.response.data);
        }
    },
);

export const updateSample = createAsyncThunk(
    'samples/updateSample',
    async ({ sampleId, labelFile }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('label', labelFile);

            const response = await axios.put(`${apiURL}/${sampleId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            notification.success({
                message: 'Thành công',
                description: 'Cập nhật thành công',
            });
            return response.data;
        } catch (error) {
            notification.error({
                message: 'Thất bại',
                description: `Cập nhật thất bại - ${error.response.data.message || 'Lỗi bất định'}`,
            });
            return rejectWithValue(error.response.data);
        }
    },
);

const sampleSlice = createSlice({
    name: 'samples',
    initialState: {
        samples: [],
        totalSamples: 0,
        totalPages: 0,
        sample: null,
        loading: false,
        error: null,
        success: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSamples.pending, (state) => {
                state.loading = true;
                state.samples = [];
                state.totalSamples = 0;
                state.totalPages = 0;
                state.error = null;
            })
            .addCase(fetchSamples.fulfilled, (state, action) => {
                state.loading = false;
                state.samples = action.payload.samples;
                state.totalSamples = action.payload.total_samples;
                state.totalPages = action.payload.total_pages;
            })
            .addCase(fetchSamples.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchSample.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
                state.sample = null;
            })
            .addCase(fetchSample.fulfilled, (state, action) => {
                state.loading = false;
                state.sample = action.payload;
                state.success = true;
            })
            .addCase(fetchSample.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteSample.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deleteSample.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(deleteSample.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createSample.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createSample.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(createSample.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateSample.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateSample.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(updateSample.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default sampleSlice.reducer;
