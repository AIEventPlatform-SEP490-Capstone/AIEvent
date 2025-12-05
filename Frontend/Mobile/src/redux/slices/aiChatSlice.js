import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AIChatService from '../../api/services/AIChatService';

// Async thunks
export const sendChatMessage = createAsyncThunk(
  'aiChat/sendChatMessage',
  async ({ userPrompt, sessionId }, { rejectWithValue }) => {
    try {
      const response = await AIChatService.sendChatMessage(userPrompt, sessionId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send chat message');
    }
  }
);

export const fetchChatHistory = createAsyncThunk(
  'aiChat/fetchChatHistory',
  async ({ sessionId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await AIChatService.getChatHistory(sessionId, params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch chat history');
    }
  }
);

export const fetchChatSessions = createAsyncThunk(
  'aiChat/fetchChatSessions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await AIChatService.getChatSessions(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch chat sessions');
    }
  }
);

export const deleteChatSession = createAsyncThunk(
  'aiChat/deleteChatSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await AIChatService.deleteChatSession(sessionId);
      return { ...response, sessionId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete chat session');
    }
  }
);

// Initial state
const initialState = {
  // Current chat session
  currentSessionId: null,
  messages: [],
  
  // Chat history for current session
  chatHistory: {
    items: [],
    pagination: null,
  },
  
  // All chat sessions
  sessions: {
    items: [],
    pagination: null,
  },
  
  // UI state
  loading: false,
  sending: false,
  error: null,
};

// Slice
const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    setCurrentSession: (state, action) => {
      state.currentSessionId = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearCurrentSession: (state) => {
      state.currentSessionId = null;
      state.messages = [];
      state.chatHistory = {
        items: [],
        pagination: null,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send chat message
      .addCase(sendChatMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sending = false;
        if (action.payload && action.payload.success) {
          const responseData = action.payload.data;
          const { userPrompt, sessionId: requestSessionId } = action.meta.arg;
          
          // If we don't have a current session and didn't send one, create a new one
          // The API should return sessionId in the response, but if not, we'll generate one
          if (!state.currentSessionId && !requestSessionId) {
            // Generate a temporary sessionId - the real one should come from API
            // In production, extract from API response if available
            state.currentSessionId = `temp-${Date.now()}`;
          } else if (requestSessionId && !state.currentSessionId) {
            state.currentSessionId = requestSessionId;
          }
          
          // Add user message
          state.messages.push({
            id: Date.now().toString(),
            content: userPrompt,
            sender: 'user',
            timestamp: new Date(),
          });
          
          // Add AI response
          state.messages.push({
            id: (Date.now() + 1).toString(),
            content: responseData || '',
            sender: 'ai',
            timestamp: new Date(),
          });
        } else {
          state.error = action.payload?.message || 'Failed to send message';
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      // Fetch chat history
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          state.chatHistory = action.payload.data;
          
          // Convert history items to messages format
          const historyMessages = action.payload.data.items.map(item => [
            {
              id: item.id || Math.random().toString(),
              content: item.prompt || '',
              sender: 'user',
              timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
            {
              id: (item.id || Math.random().toString()) + '_response',
              content: item.response || '',
              sender: 'ai',
              timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
          ]).flat();
          
          state.messages = historyMessages;
        } else {
          state.error = action.payload?.message || 'Failed to fetch history';
        }
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch chat sessions
      .addCase(fetchChatSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatSessions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          state.sessions = action.payload.data;
        } else {
          state.error = action.payload?.message || 'Failed to fetch sessions';
        }
      })
      .addCase(fetchChatSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete chat session
      .addCase(deleteChatSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChatSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.success) {
          // Remove session from list
          state.sessions.items = state.sessions.items.filter(
            session => session.sessionId !== action.payload.sessionId
          );
          
          // If deleted session was current, clear it
          if (state.currentSessionId === action.payload.sessionId) {
            state.currentSessionId = null;
            state.messages = [];
            state.chatHistory = {
              items: [],
              pagination: null,
            };
          }
        } else {
          state.error = action.payload?.message || 'Failed to delete session';
        }
      })
      .addCase(deleteChatSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  setCurrentSession,
  addMessage,
  clearMessages,
  clearCurrentSession,
  clearError,
} = aiChatSlice.actions;

// Export selectors
export const selectCurrentSessionId = (state) => state.aiChat.currentSessionId;
export const selectMessages = (state) => state.aiChat.messages;
export const selectChatHistory = (state) => state.aiChat.chatHistory;
export const selectChatSessions = (state) => state.aiChat.sessions;
export const selectAIChatLoading = (state) => state.aiChat.loading;
export const selectAIChatSending = (state) => state.aiChat.sending;
export const selectAIChatError = (state) => state.aiChat.error;

export default aiChatSlice.reducer;

