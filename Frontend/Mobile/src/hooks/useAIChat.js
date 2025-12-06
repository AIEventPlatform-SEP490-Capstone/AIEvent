import { useDispatch, useSelector } from 'react-redux';
import {
  sendChatMessage,
  fetchChatHistory,
  fetchChatSessions,
  deleteChatSession,
  setCurrentSession,
  addMessage,
  clearMessages,
  clearCurrentSession,
  clearError,
  selectCurrentSessionId,
  selectMessages,
  selectChatHistory,
  selectChatSessions,
  selectAIChatLoading,
  selectAIChatSending,
  selectAIChatError,
} from '../redux/slices/aiChatSlice';

export const useAIChat = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const currentSessionId = useSelector(selectCurrentSessionId);
  const messages = useSelector(selectMessages);
  const chatHistory = useSelector(selectChatHistory);
  const chatSessions = useSelector(selectChatSessions);
  const loading = useSelector(selectAIChatLoading);
  const sending = useSelector(selectAIChatSending);
  const error = useSelector(selectAIChatError);

  // Actions
  const sendMessage = async (userPrompt, sessionId = null) => {
    try {
      const response = await dispatch(sendChatMessage({ userPrompt, sessionId: sessionId || currentSessionId })).unwrap();
      
      // Extract sessionId from response if it's a new session
      if (response && response.success && response.data) {
        // The API might return sessionId in the response
        // We'll need to handle this based on actual API response
        // For now, we'll use the sessionId from the request
        if (!currentSessionId && sessionId) {
          dispatch(setCurrentSession(sessionId));
        }
      }
      
      return response;
    } catch (err) {
      console.error('Failed to send chat message:', err);
      return null;
    }
  };

  const getChatHistory = async (sessionId, params = {}) => {
    try {
      const response = await dispatch(fetchChatHistory({ sessionId, params })).unwrap();
      
      if (response && response.success) {
        dispatch(setCurrentSession(sessionId));
      }
      
      return response;
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
      return null;
    }
  };

  const getChatSessions = async (params = {}) => {
    try {
      const response = await dispatch(fetchChatSessions(params)).unwrap();
      return response;
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
      return null;
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const response = await dispatch(deleteChatSession(sessionId)).unwrap();
      return response;
    } catch (err) {
      console.error('Failed to delete chat session:', err);
      return null;
    }
  };

  const setSession = (sessionId) => {
    dispatch(setCurrentSession(sessionId));
  };

  const clearSession = () => {
    dispatch(clearCurrentSession());
  };

  const clearMessagesList = () => {
    dispatch(clearMessages());
  };

  const clearErrorState = () => {
    dispatch(clearError());
  };

  return {
    // State
    currentSessionId,
    messages,
    chatHistory,
    chatSessions,
    loading,
    sending,
    error,
    
    // Actions
    sendMessage,
    getChatHistory,
    getChatSessions,
    deleteSession,
    setSession,
    clearSession,
    clearMessagesList,
    clearErrorState,
  };
};

export default useAIChat;

