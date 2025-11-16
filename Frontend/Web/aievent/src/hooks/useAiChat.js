import { useState, useCallback } from "react";
import { aiChatAPI } from "../api/aiChatAPI";
import { toast } from "react-hot-toast";

export const useAiChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const sendMessage = useCallback(async (userPrompt, sessionId = null) => {
    setIsLoading(true);
    setError(null);
    
    // Use currentSessionId if sessionId is not provided
    const sessionToUse = sessionId !== null ? sessionId : currentSessionId;
    
    try {
      const response = await aiChatAPI.sendMessage(userPrompt, sessionToUse);
      
      // Extract sessionId from response if available (usually in response.data or response.data.data)
      const newSessionId = response?.data?.sessionId || response?.sessionId || sessionToUse || null;
      if (newSessionId && newSessionId !== currentSessionId) {
        setCurrentSessionId(newSessionId);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể gửi tin nhắn. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId]);

  const getChatHistory = useCallback(async (sessionId, pageNumber = 1, pageSize = 10) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await aiChatAPI.getChatHistory(sessionId, pageNumber, pageSize);
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể tải lịch sử chat.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getChatSessions = useCallback(async (pageNumber = 1, pageSize = 10) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await aiChatAPI.getChatSessions(pageNumber, pageSize);
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể tải danh sách phiên chat.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await aiChatAPI.deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      toast.success("Đã xóa phiên chat thành công!");
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể xóa phiên chat.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSession = useCallback(() => {
    setCurrentSessionId(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    currentSessionId,
    sendMessage,
    getChatHistory,
    getChatSessions,
    deleteSession,
    clearError,
    resetSession,
    setCurrentSessionId,
  };
};

export default useAiChat;

