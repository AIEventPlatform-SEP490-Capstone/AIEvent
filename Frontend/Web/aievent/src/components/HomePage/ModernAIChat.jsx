import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import userAvt from "../../assets/user.png";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  ExternalLink,
  Sparkles,
  Zap,
  Calendar,
  MapPin,
  Tag,
  Mic,
  Square,
  MoreVertical,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAiChat } from "../../hooks/useAiChat";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis";
import { parseEventFromResponse } from "../../utils/aiResponseParser";
import aiChatGif from "../../assets/ai-chat-2.gif";

export default function ModernAIChat() {

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      content:
        "Xin chào! 👋 Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện theo nhu cầu của bạn, hoặc trả lời các câu hỏi về sự kiện bạn quan tâm. Bạn cần hỗ trợ gì?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Suggested questions
  const suggestedQuestions = [
    "Tìm sự kiện âm nhạc",
    "Sự kiện công nghệ",
    "Hướng dẫn đặt vé",
    "Sự kiện miễn phí",
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


  const { sendMessage, isLoading, resetSession, setCurrentSessionId: setHookSessionId, getChatSessions } = useAiChat();

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
  } = useSpeechSynthesis({ lang: "vi-VN" });

  const handleSpeakMessage = useCallback(
    (messageId, text) => {
      if (!text) return;
      speak(text, {
        onStart: () => setSpeakingMessageId(messageId),
        onEnd: () =>
          setSpeakingMessageId((current) => (current === messageId ? null : current)),
        onError: () =>
          setSpeakingMessageId((current) => (current === messageId ? null : current)),
      });
    },
    [speak]
  );

  const handleStopSpeaking = useCallback(() => {
    stop();
    setSpeakingMessageId(null);
  }, [stop]);

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

    // Store the session ID we're using before sending
    const sessionIdToUse = currentSessionId;
    const wasNewSession = !currentSessionId;

    try {
      // API response structure: { statusCode, message, data: "response text" }
      const response = await sendMessage(userPrompt, sessionIdToUse);

      // Extract response text - data is a string, not an object
      const responseText = response?.data || response?.message || "";

      // Parse event information if available
      const eventInfo = parseEventFromResponse(responseText);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        sender: "ai",
        timestamp: new Date(),
        eventInfo: eventInfo,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If this was a new session, reload sessions to get the new sessionId
      // The API doesn't return sessionId in the POST response
      if (wasNewSession && getChatSessions) {
        try {
          const sessionsResponse = await getChatSessions(1, 10);
          const sessionsList = sessionsResponse?.data?.items || sessionsResponse?.items || [];

          // Get the newest session (first in list, as API returns newest first)
          if (sessionsList.length > 0) {
            const newestSession = sessionsList[0];
            if (newestSession?.sessionId) {
              setCurrentSessionId(newestSession.sessionId);
              setHookSessionId(newestSession.sessionId);
            }
          }
        } catch (sessionError) {
          console.error("Error loading sessions after message:", sessionError);
          // Don't fail the whole flow if session loading fails
        }
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


  // Không hiển thị icon nếu user chưa đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  // Reset session and messages when closing the chat
  const handleCloseChat = () => {
    // Only reset if not currently loading (no ongoing request)
    if (!isLoading) {
      setCurrentSessionId(null);
      resetSession();
      // Optionally reset messages to welcome message
      setMessages([
        {
          id: "1",
          content:
            "Xin chào! 👋 Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện theo nhu cầu của bạn, hoặc trả lời các câu hỏi về sự kiện bạn quan tâm. Bạn cần hỗ trợ gì?",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="p-0 h-auto w-auto bg-transparent hover:bg-transparent shadow-none focus-visible:ring-0"
          size="icon"
        >
          <img
            src={aiChatGif}
            alt="Modern AI Chat trigger"
            className="relative z-10 h-40 w-40 rounded-full object-cover"
          />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[360px] h-[520px] shadow-xl z-50 flex flex-col border border-slate-200/60 dark:border-slate-700/60 overflow-hidden p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl">
      {/* Header */}
      <CardHeader className="px-4 py-3 !pb-3 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-gray-800/50 dark:to-gray-700/30">
        <div className="flex h-12 items-center justify-between">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseChat}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 pr-2 overflow-y-auto max-h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pb-2">
            {/* Show suggested questions only when there's only the welcome message */}
            {messages.length === 1 && messages[0].sender === "ai" && (
              <div className="px-2 py-3">
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 text-xs text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => {
              const isUserMessage = message.sender === "user";
              const isSpeakingThisMessage = speakingMessageId === message.id;

              return (
                <div key={message.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start gap-2 ${isUserMessage ? "flex-row-reverse" : ""} max-w-[85%]`}>
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
                              ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-tr-md px-3 py-2.5"
                              : "bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 rounded-tl-md px-3.5 py-2.5 shadow-md backdrop-blur-sm"
                              }`}
                          >
                            {/* Subtle gradient overlay for AI messages */}
                            {!isUserMessage && (
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                            )}
                            <div className={`relative ${isUserMessage ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
                              <div className="text-sm leading-relaxed space-y-2">
                                {message.content.split("\n").map((line, index) => {
                                  const trimmedLine = line.trim();

                                  // Tiêu đề sự kiện: **Tên sự kiện**
                                  if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) {
                                    const title = trimmedLine.slice(2, -2).trim();
                                    return (
                                      <div
                                        key={index}
                                        className="font-bold text-lg mt-4 mb-4 flex items-center gap-3 text-blue-700 dark:text-blue-300"
                                      >
                                        <Sparkles className="h-5 w-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                                        <span>{title}</span>
                                      </div>
                                    );
                                  }

                                  // Bullet points: bắt đầu bằng - hoặc •
                                  if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("• ")) {
                                    let bulletText = trimmedLine.slice(2).trim();
                                    let icon = null;
                                    let iconColor = "";

                                    // Phát hiện loại thông tin để chọn icon phù hợp
                                    const lowerText = bulletText.toLowerCase();

                                    if (lowerText.includes("địa điểm") || lowerText.includes("tại") || lowerText.includes("thành phố") || lowerText.includes("quận")) {
                                      icon = <MapPin className="h-4.5 w-4.5" />;
                                      iconColor = "text-red-500 dark:text-red-400";
                                    }
                                    else if (lowerText.includes("thời gian") || lowerText.includes("ngày") || lowerText.includes("giờ") || bulletText.includes(":")) {
                                      icon = <Calendar className="h-4.5 w-4.5" />;
                                      iconColor = "text-green-600 dark:text-green-400";
                                    }
                                    else if (lowerText.includes("giá vé") || lowerText.includes("vé") || lowerText.includes("vnd") || lowerText.includes("đồng")) {
                                      icon = <Zap className="h-4.5 w-4.5" />;
                                      iconColor = "text-orange-500 dark:text-orange-400";
                                    }
                                    else if (lowerText.includes("xem chi tiết") || lowerText.includes("tại đây") || lowerText.includes("link")) {
                                      icon = <ExternalLink className="h-4.5 w-4.5" />;
                                      iconColor = "text-blue-600 dark:text-blue-400";
                                    }
                                    else {
                                      // Mặc định: chấm tròn hoặc ngôi sao nhỏ
                                      icon = <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5" />;
                                      iconColor = "";
                                    }

                                    return (
                                      <div key={index} className="flex items-start gap-3 my-2.5">
                                        <div className={`flex-shrink-0 ${iconColor}`}>
                                          {icon}
                                        </div>
                                        <span className="flex-1 leading-relaxed">
                                          {renderLineWithLink(bulletText)}
                                        </span>
                                      </div>
                                    );
                                  }

                                  // Dòng văn bản thường (không phải bullet)
                                  if (trimmedLine) {
                                    return (
                                      <div key={index} className="my-2">
                                        {renderLineWithLink(trimmedLine)}
                                      </div>
                                    );
                                  }

                                  // Dòng trống → khoảng cách
                                  return <div key={index} className="h-4" />;
                                })}
                              </div>
                            </div>
                          </div>
                          {message.sender === "ai" && (
                            <button className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center">
                                    <MoreVertical className="h-3 w-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  {isSpeechSynthesisSupported ? (
                                    <DropdownMenuItem
                                      className="gap-2 text-base"
                                      onClick={() =>
                                        isSpeakingThisMessage
                                          ? handleStopSpeaking()
                                          : handleSpeakMessage(message.id, message.content)
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
                                    <DropdownMenuItem disabled className="gap-2 opacity-70 text-base">
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
                {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
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
  );
}

