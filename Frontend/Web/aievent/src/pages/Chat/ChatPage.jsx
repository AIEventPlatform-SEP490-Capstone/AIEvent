import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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
  Mic,
  Square,
  MoreVertical,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAiChat } from "../../hooks/useAiChat";
import { parseEventFromResponse } from "../../utils/aiResponseParser";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis";
import userAvt from "../../assets/user.png";

export default function ChatPage() {
  const { user } = useSelector((state) => state.auth);
  const {
    isLoading,
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
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const newChatPendingRef = useRef(false);

  // Suggested questions
  const suggestedQuestions = [
    "Tìm các sự kiện thể thao sắp tới",
    "Các sự kiện công nghệ tháng này",
    "Tìm các sự kiện mức giá trong khoảng 500k - 1 triệu đồng",
    "Tìm sự kiện gần khu vực Thủ Đức",
    "Các workshop sắp tới",
  ];

  const renderLineWithLink = (line) => {
    const parts = [];

    // 1) Bắt markdown link [text](url)
    const markdownRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

    // 2) Bắt plain URL (url không có markdown)
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    let lastIndex = 0;
    let match;

    // Ưu tiên markdown link
    while ((match = markdownRegex.exec(line)) !== null) {
      const before = line.slice(lastIndex, match.index);
      if (before) parts.push(before);

      const text = match[1];
      const url = match[2];

      parts.push(
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {text}
          <ExternalLink className="h-4 w-4" />
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Nếu không có markdown link → kiểm tra plain URL
    if (parts.length === 0 && urlRegex.test(line)) {
      return line.split(urlRegex).map((part, index) => {
        if (part.startsWith("https://") || part.startsWith("http://")) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Xem chi tiết
              <ExternalLink className="h-4 w-4" />
            </a>
          );
        }
        return part;
      });
    }

    // Phần còn lại sau markdown
    const remaining = line.slice(lastIndex);
    if (remaining) parts.push(remaining);

    return parts;
  };

  const cleanMarkdownAsterisks = (text) => {
    if (!text) return text;

    return text
      .replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '$1') // ****text**** → text
      .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')     // ***text*** → text (italic + bold)
      .replace(/\*\*([^*]+)\*\*/g, '$1')         // **text** → text
      .replace(/\*([^*]+)\*/g, '$1')             // *text* → text
      .replace(/\\\*/g, '*');                    // bỏ escape nếu có \*
  };

  const handleSpeechResult = useCallback((text) => {
    if (!text) return;
    setInputValue((prev) => {
      if (!prev) return text;
      return `${prev.trim()} ${text}`.trim();
    });
  }, []);

  const {
    isSupported: isSpeechSupported,
    isRecording,
    interimTranscript,
    error: speechError,
    startRecording,
    stopRecording,
  } = useSpeechToText({
    lang: "vi-VN",
    onResult: handleSpeechResult,
  });

  const {
    isSupported: isSpeechSynthesisSupported,
    speak,
    stop,
  } = useSpeechSynthesis({
    lang: "vi-VN",
  });

  const handleSpeakMessage = useCallback(
    (messageId, text) => {
      if (!text) return;
      speak(text, {
        onStart: () => setSpeakingMessageId(messageId),
        onEnd: () =>
          setSpeakingMessageId((current) =>
            current === messageId ? null : current
          ),
        onError: () =>
          setSpeakingMessageId((current) =>
            current === messageId ? null : current
          ),
      });
    },
    [speak]
  );

  const handleStopSpeaking = useCallback(() => {
    stop();
    setSpeakingMessageId(null);
  }, [stop]);

  const loadSessions = useCallback(
    async (options = {}) => {
      const {
        disableAutoSelect = false,
        silent = false,
        forceAutoSelect = false,
      } = options;
      try {
        if (!silent) {
          setLoadingSessions(true);
        }
        const response = await getChatSessions(1, 50);
        const sessionsList = response?.data?.items || response?.items || [];
        setSessions(sessionsList);

        // Auto-select first session if available
        if (
          sessionsList.length > 0 &&
          !selectedSessionId &&
          (autoSelectEnabled || forceAutoSelect) &&
          !disableAutoSelect
        ) {
          setSelectedSessionId(sessionsList[0].sessionId);
        }
        return sessionsList;
      } catch (error) {
        console.error("Error loading sessions:", error);
        return [];
      } finally {
        if (!silent) {
          setLoadingSessions(false);
        }
      }
    },
    [getChatSessions, selectedSessionId, autoSelectEnabled]
  );

  const upsertSession = useCallback((session) => {
    if (!session?.sessionId) return;
    setSessions((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.sessionId === session.sessionId
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...session,
        };
        return updated;
      }
      return [session, ...prev];
    });
  }, []);

  const loadChatHistory = useCallback(
    async (sessionId) => {
      try {
        setLoadingHistory(true);
        const response = await getChatHistory(sessionId, 1, 100);
        const historyItems = response?.data?.items || response?.items || [];

        // Sort items by createdAt timestamp (oldest first) to ensure correct order
        const sortedItems = [...historyItems].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeA - timeB;
        });

        // Add user prompts as messages
        const messagesWithPrompts = [];
        sortedItems.forEach((item, index) => {
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
            content: cleanMarkdownAsterisks(item.response || ""),
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
    },
    [getChatHistory]
  );

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadChatHistory(selectedSessionId);
      setCurrentSessionId(selectedSessionId);
      newChatPendingRef.current = false;
    } else {
      setCurrentSessionId(null);
      if (newChatPendingRef.current) {
        return;
      }
      setMessages([]);
    }
  }, [selectedSessionId, loadChatHistory, setCurrentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestedQuestion = async (question) => {
    if (isLoading) return;
    await handleSendMessage(question);
  };

  const handleSendMessage = async (customPrompt = null) => {
    const promptToSend = customPrompt || inputValue;
    if (!promptToSend.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: promptToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userPrompt = promptToSend;
    setInputValue("");

    const wasNewSession = !selectedSessionId;
    const previousSessionCount = sessions.length;

    try {
      // API response structure: { statusCode, message, data: "response text" }
      const response = await sendMessage(userPrompt, selectedSessionId);

      // Extract response text - data is a string, not an object
      const responseText = response?.data || response?.message || "";
      const cleanedResponseText = cleanMarkdownAsterisks(responseText);
      const eventInfo = parseEventFromResponse(responseText);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: cleanedResponseText,
        sender: "ai",
        timestamp: new Date(),
        eventInfo: eventInfo,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Reload sessions to get the new sessionId (if new session was created)
      // The API doesn't return sessionId in the POST response
      const updatedSessions = await loadSessions({
        disableAutoSelect: !wasNewSession,
        forceAutoSelect: wasNewSession,
        silent: true,
      });

      // If this was a new session, find the newest session and select it
      if (wasNewSession && updatedSessions && updatedSessions.length > previousSessionCount) {
        // Find the newest session (first in the list, as API returns newest first)
        const newestSession = updatedSessions[0];
        if (newestSession?.sessionId) {
          setSelectedSessionId(newestSession.sessionId);
          setAutoSelectEnabled(true);
          setCurrentSessionId(newestSession.sessionId);
        }
      } else if (!wasNewSession && selectedSessionId) {
        // Update existing session's lastMessageAt
        const currentSession = updatedSessions?.find(
          (s) => s.sessionId === selectedSessionId
        );
        if (currentSession) {
          upsertSession({
            sessionId: selectedSessionId,
            lastMessageAt: currentSession.lastMessageAt,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleNewChat = () => {
    // Prevent creating new chat while a message is being sent
    if (isLoading) {
      return;
    }
    newChatPendingRef.current = true;
    setAutoSelectEnabled(false);
    setSelectedSessionId(null);
    setMessages([
      {
        id: "1",
        content:
          "Xin chào! 👋 Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện theo nhu cầu của bạn, hoặc trả lời các câu hỏi về sự kiện bạn quan tâm. Bạn cần hỗ trợ gì?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    resetSession();
  };

  const handleSelectSession = (sessionId) => {
    setAutoSelectEnabled(true);
    setSelectedSessionId(sessionId);
  };

  const openDeleteDialog = (session, e) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setIsDeletingSession(true);
      await deleteSession(sessionToDelete.sessionId);
      if (selectedSessionId === sessionToDelete.sessionId) {
        handleNewChat();
      }
      await loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setIsDeletingSession(false);
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleCloseDeleteDialog = useCallback(() => {
    if (isDeletingSession) return;
    setIsDeleteDialogOpen(false);
    setSessionToDelete(null);
  }, [isDeletingSession]);


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
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Sessions Sidebar */}
        <div className="w-64 border-r border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl flex flex-col shadow-sm">
          <div className="p-3 border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Tin nhắn
              </h2>
              <Button
                onClick={handleNewChat}
                disabled={isLoading}
                size="sm"
                className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                Mới
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chưa có cuộc trò chuyện nào</p>
                <p className="text-base mt-1">Bắt đầu cuộc trò chuyện mới!</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => handleSelectSession(session.sessionId)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all ${selectedSessionId === session.sessionId
                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-600/50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate mb-0.5 ${selectedSessionId === session.sessionId
                          ? "text-slate-800 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300"
                          }`}>
                          {session.sessionName || "Cuộc trò chuyện mới"}
                        </p>
                        <p className={`text-xs ${selectedSessionId === session.sessionId
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-400 dark:text-slate-500"
                          }`}>
                          {formatDate(
                            session.lastMessageAt || session.createdAt
                          )}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="h-6 w-6 rounded-lg hover:bg-white/60 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-2 text-red-600 focus:text-red-700 text-base"
                            onClick={(e) => openDeleteDialog(session, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col m-3 rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-0 relative">
            {/* Header */}
            <CardHeader className="px-4 py-3 !pb-3 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-gray-800/50 dark:to-gray-700/30">
              <div className="flex h-12 items-center">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md opacity-20" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-2 shadow-sm">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                      AI Assistant
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      Luôn sẵn sàng hỗ trợ
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <ScrollArea
                  className="flex-1 pr-2 overflow-y-auto max-h-full"
                  ref={scrollAreaRef}
                >
                  <div className="space-y-4 pb-2">
                    {/* Show messages if any */}
                    {messages.length > 0 && messages.map((message) => {
                      const isUserMessage = message.sender === "user";
                      const isSpeakingThisMessage =
                        speakingMessageId === message.id;

                      return (
                        <div
                          key={message.id}
                          className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                        >
                          <div
                            className={`flex ${isUserMessage ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div
                              className={`flex items-start gap-2 ${isUserMessage ? "flex-row-reverse" : ""
                                } max-w-[85%]`}
                            >
                              {message.sender === "ai" && (
                                <div className="relative flex-shrink-0">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-md opacity-20" />
                                  <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-500 flex items-center justify-center shadow-md ring-2 ring-blue-200/50 dark:ring-blue-800/50">
                                    <Bot className="h-5 w-5 text-white drop-shadow-sm" />
                                  </div>
                                </div>
                              )}
                              {isUserMessage && (
                                <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-slate-200/50 dark:ring-slate-700/50">
                                  {user?.avatar || user?.avatarImgUrl ? (
                                    <img
                                      src={user.avatar || user.avatarImgUrl}
                                      alt={user.name || user.fullName || "User"}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = userAvt;
                                      }}
                                    />
                                  ) : (
                                    <img
                                      src={userAvt}
                                      alt="User"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                <div className="flex items-start gap-2">
                                  <div
                                    className={`rounded-xl break-words shadow-sm relative overflow-hidden ${isUserMessage
                                      ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-tr-md px-2 py-1.5"
                                      : "bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 rounded-tl-md px-2 py-1.5 shadow-md backdrop-blur-sm"
                                      }`}
                                  >
                                    {/* Subtle gradient overlay for AI messages */}
                                    {!isUserMessage && (
                                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                                    )}
                                    <div className="text-base leading-relaxed space-y-1">
                                      {message.content.split("\n").map((line, index) => {
                                        const trimmedLine = line.trim();

                                        if (!trimmedLine) {
                                          return null;
                                        }

                                        if (
                                          trimmedLine.match(/^\d+\.\s*\*\*.*\*\*$/) ||
                                          (trimmedLine.startsWith("**") && trimmedLine.endsWith("**"))
                                        ) {
                                          const title = trimmedLine
                                            .replace(/^\d+\.\s*\*\*/, "")
                                            .replace(/\*\*$/, "")
                                            .trim();

                                          return (
                                            <h5
                                              key={index}
                                              className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-2"
                                            >
                                              {title}
                                            </h5>
                                          );
                                        }

                                        // Bullet points
                                        if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("• ")) {
                                          const content = trimmedLine.replace(/^[-•]\s*/, "").trim();

                                          const boldLabelMatch = content.match(/^\*\*(.*?):\*\*\s*(.*)/);
                                          if (boldLabelMatch) {
                                            const label = boldLabelMatch[1] + ":";
                                            const value = boldLabelMatch[2];

                                            return (
                                              <div key={index} className="flex gap-3 my-1.5">
                                                <span className="text-sm mt-0.5 flex-shrink-0 text-slate-500">•</span>
                                                <div>
                                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {label}
                                                  </span>{" "}
                                                  <span className="{textColorClass}">
                                                    {renderLineWithLink(value)}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div key={index} className="flex gap-3 my-1.5">
                                              <span className="text-sm mt-0.5 flex-shrink-0 text-slate-500">•</span>
                                              <span className="{textColorClass}">
                                                {renderLineWithLink(content)}
                                              </span>
                                            </div>
                                          );
                                        }

                                        return (
                                          <p key={index} className="my-2 ${textColorClass}">
                                            {renderLineWithLink(trimmedLine)}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Show voice */}
                                  {message.sender === "ai" && (
                                    <button className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center">
                                            <MoreVertical className="h-3 w-3" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          className="w-44"
                                        >
                                          {isSpeechSynthesisSupported ? (
                                            <DropdownMenuItem
                                              className="gap-2 text-base"
                                              onClick={() =>
                                                isSpeakingThisMessage
                                                  ? handleStopSpeaking()
                                                  : handleSpeakMessage(
                                                    message.id,
                                                    message.content
                                                  )
                                              }
                                            >
                                              {isSpeakingThisMessage ? (
                                                <>
                                                  <VolumeX className="h-4 w-4 text-red-500" />
                                                  Dừng đọc
                                                </>
                                              ) : (
                                                <>
                                                  <Volume2 className="h-4 w-4 text-blue-500" />
                                                  Đọc to
                                                </>
                                              )}
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem
                                              disabled
                                              className="gap-2 opacity-70 text-base"
                                            >
                                              <VolumeX className="h-4 w-4" />
                                              Không hỗ trợ đọc
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {/* Show suggested questions when no messages or only welcome message */}
                    {(messages.length === 0 || (messages.length === 1 && messages[0].sender === "ai")) && (
                      <div className="flex flex-col items-center justify-center px-4 py-6">
                        {messages.length === 0 ? (
                          <div className="mb-6 text-center">
                            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-slate-400" />
                            <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                              Chào mừng đến với AI Chat!
                            </p>
                            <p className="text-base mt-2 text-slate-600 dark:text-slate-400">
                              Bắt đầu cuộc trò chuyện mới hoặc chọn một cuộc trò
                              chuyện từ danh sách
                            </p>
                          </div>
                        ) : (
                          <div className="mb-4 text-center">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              Ví dụ như:
                            </p>
                          </div>
                        )}
                        {/* Suggested Questions */}
                        <div className="w-full max-w-2xl">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestedQuestions.map((question, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestedQuestion(question)}
                                disabled={isLoading}
                                className="text-left px-4 py-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">💡</span>
                                  <span className="flex-1">{question}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="flex gap-2 justify-start">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-sm opacity-15" />
                          <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl rounded-tl-md px-3 py-2 shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce"
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
              <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-gray-800/50 flex-shrink-0">
                <div className="flex gap-1.5 items-center">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Nhập câu hỏi..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoading) {
                          handleSendMessage();
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-gray-800 focus:border-blue-400 dark:focus:border-blue-600 focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {isSpeechSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading}
                      className={`h-9 w-9 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex-shrink-0 ${isRecording
                        ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-600"
                        : ""
                        }`}
                    >
                      {isRecording ? (
                        <Square className="h-3.5 w-3.5" />
                      ) : (
                        <Mic className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      if (!isLoading) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading || !inputValue.trim()}
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {isSpeechSupported && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    {isRecording && interimTranscript
                      ? `Đang nghe: "${interimTranscript}"`
                      : speechError
                        ? `Không thể thu âm: ${speechError}`
                        : "Nhấn mic để nói câu hỏi của bạn"}
                  </p>
                )}
                {!isSpeechSupported && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    Trình duyệt hiện không hỗ trợ ghi âm giọng nói.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !open && handleCloseDeleteDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Xóa cuộc trò chuyện?</DialogTitle>
            <DialogDescription>
              Bạn sắp xóa{" "}
              <span className="font-semibold">
                {sessionToDelete?.sessionName || "cuộc trò chuyện này"}
              </span>
              . Thao tác không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-purple-200/50 dark:border-purple-900/40 p-4 bg-purple-50/40 dark:bg-purple-900/20 space-y-2">
            <div className="text-base text-muted-foreground flex items-center justify-between">
              <span>Số tin nhắn</span>
              <span className="font-semibold text-foreground">
                {sessionToDelete?.messageCount ?? 0}
              </span>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={isDeletingSession}
              className="text-base"
            >
              Giữ lại
            </Button>
            <Button
              onClick={handleDeleteSession}
              disabled={isDeletingSession}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              {isDeletingSession ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </span>
              ) : (
                "Xóa cuộc trò chuyện"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
