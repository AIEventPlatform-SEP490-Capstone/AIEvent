import fetcher from "./fetcher";

export const aiChatAPI = {
  // POST: Send a chat message
  sendMessage: async (userPrompt, sessionId = null) => {
    const response = await fetcher.post("/ai/chat", {
      userPrompt,
      sessionId,
    });
    return response.data;
  },

  // GET: Get chat history by sessionId
  getChatHistory: async (sessionId, pageNumber = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    params.append("sessionId", sessionId);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await fetcher.get(`/ai/chat/history?${params.toString()}`);
    return response.data;
  },

  // GET: Get all chat sessions
  getChatSessions: async (pageNumber = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());

    const response = await fetcher.get(`/ai/chat/sessions?${params.toString()}`);
    return response.data;
  },

  // DELETE: Delete a chat session
  deleteSession: async (sessionId) => {
    const response = await fetcher.delete(`/ai/chat/sessions/${sessionId}`);
    return response.data;
  },
};

export default aiChatAPI;

