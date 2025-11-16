import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  ExternalLink,
  Sparkles,
  Zap,
  Calendar,
  MapPin,
  Trash2,
  Plus,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useAiChat } from "../../hooks/useAiChat";
import { parseEventFromResponse } from "../../components/HomePage/ModernAIChat";

// Re-export parseEventFromResponse for easier access

export default function ChatPage() {
  const navigate = useNavigate();
  const {
    isLoading,
    currentSessionId,
    sendMessage,
    getChatHistory,
    getChatSessions,
    deleteSession,
    setCurrentSessionId,
    resetSession,
  } = useAiChat();

  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadChatHistory(selectedSessionId);
      setCurrentSessionId(selectedSessionId);
    } else {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [selectedSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await getChatSessions(1, 50);
      const sessionsList = response?.data?.items || response?.items || [];
      setSessions(sessionsList);
      
      // Auto-select first session if available
      if (sessionsList.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessionsList[0].sessionId);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadChatHistory = async (sessionId) => {
    try {
      setLoadingHistory(true);
      const response = await getChatHistory(sessionId, 1, 100);
      const historyItems = response?.data?.items || response?.items || [];
      
      // Convert history items to message format
      const formattedMessages = historyItems.map((item, index) => ({
        id: item.id || `history-${index}`,
        content: item.response || "",
        sender: "ai",
        timestamp: new Date(item.createdAt),
        eventInfo: parseEventFromResponse(item.response || ""),
      }));

      // Add user prompts as messages
      const messagesWithPrompts = [];
      historyItems.forEach((item, index) => {
        // Add user message
        messagesWithPrompts.push({
          id: `user-${item.id || index}`,
          content: item.prompt || "",
          sender: "user",
          timestamp: new Date(item.createdAt),
        });
        
        // Add AI response
        messagesWithPrompts.push({
          id: item.id || `ai-${index}`,
          content: item.response || "",
          sender: "ai",
          timestamp: new Date(item.createdAt),
          eventInfo: parseEventFromResponse(item.response || ""),
        });
      });

      setMessages(messagesWithPrompts);
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userPrompt = inputValue;
    setInputValue("");

    try {
      const response = await sendMessage(userPrompt, selectedSessionId);
      
      const responseText = response?.data || response?.message || "";
      const eventInfo = parseEventFromResponse(responseText);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        sender: "ai",
        timestamp: new Date(),
        eventInfo: eventInfo,
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // Update session ID and refresh sessions list
      if (response?.data?.sessionId || response?.sessionId) {
        const newSessionId = response?.data?.sessionId || response?.sessionId;
        if (!selectedSessionId) {
          setSelectedSessionId(newSessionId);
        }
        await loadSessions();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleNewChat = () => {
    setSelectedSessionId(null);
    setMessages([
      {
        id: "1",
        content:
          "Xin chào! 👋 Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện, đặt vé, hoặc trả lời các câu hỏi về nền tảng. Bạn cần hỗ trợ gì?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    resetSession();
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa phiên chat này?")) return;

    try {
      await deleteSession(sessionId);
      if (selectedSessionId === sessionId) {
        handleNewChat();
      }
      await loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleEventClick = (eventInfo) => {
    if (eventInfo.title) {
      navigate(`/search?q=${encodeURIComponent(eventInfo.title)}`);
    } else if (eventInfo.location) {
      navigate(`/search?q=${encodeURIComponent(eventInfo.location)}`);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return d.toLocaleDateString("vi-VN");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-cyan-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sessions Sidebar */}
      <div className="w-80 border-r border-purple-200/50 dark:border-purple-900/50 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-purple-200/50 dark:border-purple-900/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Cuộc trò chuyện
            </h2>
            <Button
              onClick={handleNewChat}
              size="sm"
              className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Mới
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có cuộc trò chuyện nào</p>
              <p className="text-sm mt-1">Bắt đầu cuộc trò chuyện mới!</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => setSelectedSessionId(session.sessionId)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedSessionId === session.sessionId
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border-2 border-purple-300 dark:border-purple-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {session.sessionName || "Cuộc trò chuyện mới"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(session.lastMessageAt || session.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.messageCount || 0} tin nhắn
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600"
                      onClick={(e) => handleDeleteSession(session.sessionId, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
      <Card className="flex-1 flex flex-col m-4 shadow-xl border-2 border-purple-200/50 dark:border-purple-900/50 overflow-hidden bg-white dark:bg-gray-800 p-0 relative">

  {/* Header */}
  <CardHeader className="relative flex flex-row items-center justify-between py-4 border-b border-purple-200/50 dark:border-purple-900/50 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10">
    <CardTitle className="text-xl font-bold flex items-center gap-3 m-0">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-md opacity-50" />
        <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full p-2">
          <Bot className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="flex flex-col gap-0 leading-tight">
        <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
          AI Assistant
        </span>
        <span className="text-xs text-muted-foreground font-normal">
          Luôn sẵn sàng hỗ trợ bạn
        </span>
      </div>
    </CardTitle>

    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          Online
        </span>
      </div>
    </div>
  </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 flex flex-col p-6 pt-0 min-h-0 overflow-hidden">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4 overflow-y-auto max-h-full" ref={scrollAreaRef}>
                <div className="space-y-4 pb-2">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                      <div>
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Chào mừng đến với AI Chat!</p>
                        <p className="text-sm mt-2">
                          Bắt đầu cuộc trò chuyện mới hoặc chọn một cuộc trò chuyện từ danh sách
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <div
                          className={`flex gap-3 ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.sender === "ai" && (
                            <div className="relative flex-shrink-0">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-sm opacity-30" />
                              <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm break-words shadow-lg ${
                              message.sender === "user"
                                ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md"
                                : "bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/50 rounded-bl-md"
                            }`}
                          >
                            <div className="whitespace-pre-line leading-relaxed">
                              {message.content.split("\n").map((line, index) => {
                                if (line.startsWith("**") && line.endsWith("**")) {
                                  return (
                                    <div
                                      key={index}
                                      className="font-bold text-base mb-1 flex items-center gap-2"
                                    >
                                      <Sparkles className="h-4 w-4 text-yellow-500" />
                                      {line.slice(2, -2)}
                                    </div>
                                  );
                                }
                                if (line.startsWith("• ") || line.startsWith("- ")) {
                                  return (
                                    <div key={index} className="ml-2 flex items-start gap-2 my-1">
                                      <Zap className="h-3 w-3 mt-1 flex-shrink-0 text-purple-500" />
                                      <span>{line.slice(2)}</span>
                                    </div>
                                  );
                                }
                                return line ? (
                                  <div key={index} className="my-1">{line}</div>
                                ) : (
                                  <div key={index} className="h-2" />
                                );
                              })}
                            </div>
                          </div>
                          {message.sender === "user" && (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Event card display */}
                        {message.eventInfo && (
                          <div className="ml-14 space-y-2">
                            <div
                              className="group bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-900/50 rounded-xl p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
                              onClick={() => handleEventClick(message.eventInfo)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  {message.eventInfo.title && (
                                    <h4 className="font-semibold text-base mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                                      {message.eventInfo.title}
                                    </h4>
                                  )}
                                  <div className="flex flex-col gap-2">
                                    {(message.eventInfo.date || message.eventInfo.time) && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 text-purple-500" />
                                        <span>
                                          {message.eventInfo.date && `${message.eventInfo.date} `}
                                          {message.eventInfo.time}
                                        </span>
                                      </div>
                                    )}
                                    {(message.eventInfo.location ||
                                      message.eventInfo.address) && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                        <span>
                                          {message.eventInfo.location || message.eventInfo.address}
                                        </span>
                                      </div>
                                    )}
                                    {message.eventInfo.price && (
                                      <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900/30">
                                        <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                          {message.eventInfo.price}
                                        </span>
                                        {message.eventInfo.tickets.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                            {message.eventInfo.tickets.map((ticket, idx) => (
                                              <div
                                                key={idx}
                                                className="text-xs text-muted-foreground"
                                              >
                                                {ticket.name}: {ticket.price}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 ml-3 flex-shrink-0 transition-colors" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isLoading && (
                    <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-sm opacity-30" />
                        <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/50 rounded-2xl rounded-bl-md px-5 py-3 shadow-lg">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}

            {/* Input */}
            <div className="flex gap-2 mt-4 flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-lg blur-xl -z-10" />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 border-2 border-purple-200 dark:border-purple-900/50 focus:border-purple-400 dark:focus:border-purple-700 rounded-xl bg-white dark:bg-gray-800 transition-colors"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

