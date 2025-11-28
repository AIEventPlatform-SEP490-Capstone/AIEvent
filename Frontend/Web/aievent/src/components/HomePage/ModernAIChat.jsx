import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      content:
        "Xin chào! 👋 Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện, đặt vé, hoặc trả lời các câu hỏi về nền tảng. Bạn cần hỗ trợ gì?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  
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
          className="inline-flex items-center gap-1 text-purple-600 font-medium hover:underline hover:text-purple-700"
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
              className="inline-flex items-center gap-1 text-purple-600 font-medium hover:underline hover:text-purple-700"
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
  
  
  const { sendMessage, isLoading } = useAiChat();

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
      const response = await sendMessage(userPrompt);
      
      // Extract response data from API response
      // Response structure: { statusCode, message, data: "response text" }
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

  const handleEventClick = (eventInfo) => {
    // Navigate to search page with event title or location as query
    if (eventInfo.title) {
      navigate(`/search?q=${encodeURIComponent(eventInfo.title)}`);
    } else if (eventInfo.location) {
      navigate(`/search?q=${encodeURIComponent(eventInfo.location)}`);
    }
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
<Card className="fixed bottom-8 right-8 w-[420px] h-[600px] shadow-2xl z-50 flex flex-col border-2 border-purple-200/50 dark:border-purple-900/50 overflow-hidden p-0">
  {/* Gradient Background Layer - FULL BLEED */}
  <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 pointer-events-none" />
  
  {/* Animated subtle overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 opacity-50 pointer-events-none" />

  {/* Header with gradient */}
  <CardHeader
  className={`
    relative flex flex-row items-center justify-between
    py-4                     /* <-- padding đều trên-dưới */
    border-b border-purple-200/50 dark:border-purple-900/50
    bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10
  `}
>
  <CardTitle className="text-lg font-bold flex items-center gap-2">
    {/* Icon */}
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-md opacity-50" />
      <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full p-2">
        <Bot className="h-5 w-5 text-white" />
      </div>
    </div>

    {/* Text */}
    <div className="flex flex-col gap-0 leading-tight">
      <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
        AI Assistant
      </span>
      <span className="text-xs text-muted-foreground font-normal">
        Luôn sẵn sàng hỗ trợ bạn
      </span>
    </div>
  </CardTitle>

  {/* Right side */}
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
        Online
      </span>
    </div>

    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsOpen(false)}
      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600 transition-colors"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
</CardHeader>
      <CardContent className="relative flex-1 flex flex-col p-6 pt-0 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 overflow-y-auto max-h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pb-2">
            {messages.map((message) => {
              const isUserMessage = message.sender === "user";
              const isSpeakingThisMessage = speakingMessageId === message.id;

              return (
                <div key={message.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-start gap-2 ${isUserMessage ? "flex-row-reverse" : ""}`}>
                      {message.sender === "ai" && (
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-sm opacity-30" />
                          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      {isUserMessage && (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm break-words shadow-lg ${
                          isUserMessage
                            ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-md"
                            : "bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/50 rounded-bl-md"
                        }`}
                      >
                        <div className="whitespace-pre-line leading-relaxed">
                          {message.content.split("\n").map((line, index) => {
                            if (line.startsWith("**") && line.endsWith("**")) {
                              return (
                                <div key={index} className="font-bold text-base mb-1 flex items-center gap-2">
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
                            return line ? <div key={index} className="my-1"> {renderLineWithLink(line)}</div> : <div key={index} className="h-2" />;
                          })}
                        </div>
                        {isSpeechSynthesisSupported && isSpeakingThisMessage && (
                          <div className="mt-3 text-xs text-purple-500 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            <span>Đang đọc câu trả lời...</span>
                          </div>
                        )}
                      </div>
                      {message.sender === "ai" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-purple-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {isSpeechSynthesisSupported ? (
                              <DropdownMenuItem
                                className="gap-2"
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
                                    <Volume2 className="h-4 w-4 text-purple-500" />
                                    Đọc to
                                  </>
                                )}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="gap-2 opacity-70">
                                <VolumeX className="h-4 w-4" />
                                Không hỗ trợ đọc
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                {/* Event card display if event info is available */}
                {message.eventInfo && (
  <div className="ml-12 mt-2">
    <div
      className="group bg-white dark:bg-gray-800 border border-purple-200/60 dark:border-purple-900/40 rounded-2xl p-5 
      hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer 
      hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 backdrop-blur-sm"
      onClick={() => handleEventClick(message.eventInfo)}
    >
      <div className="flex items-start justify-between">
        {/* ----- LEFT CONTENT ----- */}
        <div className="flex-1 space-y-3">
          
          {/* TITLE */}
          {message.eventInfo.title && (
            <h4 className="font-semibold text-[15px] leading-snug text-gray-900 dark:text-gray-100
            group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
              {message.eventInfo.title}
            </h4>
          )}

          {/* INFO LIST */}
          <div className="space-y-2">

            {/* DATE + TIME */}
            {(message.eventInfo.date || message.eventInfo.time) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="font-medium">
                  {message.eventInfo.date}
                  {message.eventInfo.time ? ` – ${message.eventInfo.time}` : ""}
                </span>
              </div>
            )}

            {/* LOCATION */}
            {(message.eventInfo.location || message.eventInfo.address) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  {message.eventInfo.location || message.eventInfo.address}
                </span>
              </div>
            )}

          </div>

          {/* PRICE SECTION */}
          {message.eventInfo.price && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <span
                className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 
                bg-clip-text text-transparent"
              >
                {message.eventInfo.price}
              </span>
            </div>
          )}

        </div>

        {/* ----- ARROW ----- */}
        <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 ml-3 flex-shrink-0 transition-colors" />
      </div>
    </div>
  </div>
)}

              </div>
            );
            })}

            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full blur-sm opacity-30" />
                  <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
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
          {isSpeechSupported && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`rounded-xl border-2 ${
                isRecording
                  ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-purple-200 text-purple-600 hover:bg-purple-50"
              }`}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isSpeechSupported && (
          <div className="mt-2 text-xs text-muted-foreground min-h-[1.5rem]">
            {isRecording && interimTranscript
              ? `Đang nghe: “${interimTranscript}”`
              : speechError
              ? `Không thể thu âm: ${speechError}`
              : "Nhấn mic để nói câu hỏi của bạn"}
          </div>
        )}
        {!isSpeechSupported && (
          <div className="mt-2 text-xs text-muted-foreground">
            Trình duyệt hiện không hỗ trợ ghi âm giọng nói.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

