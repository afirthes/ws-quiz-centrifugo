import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ConnectionState {
    status: 'connected' | 'disconnected' | 'connecting';
}

const initialState: ConnectionState = {
    status: 'disconnected',
};

const connectionSlice = createSlice({
    name: 'connection',
    initialState,
    reducers: {
        setStatus(state, action: PayloadAction<ConnectionState['status']>) {
            state.status = action.payload;
        },
    },
});

export const { setStatus } = connectionSlice.actions;
export default connectionSlice.reducer;