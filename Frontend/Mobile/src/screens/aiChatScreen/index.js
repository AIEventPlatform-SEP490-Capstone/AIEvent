import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, User, Send, Mic, MicOff, Trash2, MessageSquare, ArrowLeft, Plus } from 'lucide-react-native';
import { useAIChat } from '../../hooks/useAIChat';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import ScreenNames from '../../constants/ScreenNames';
import { styles } from './styles';

const AIChatScreen = () => {
  const navigation = useNavigation();
  const [inputValue, setInputValue] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef(null);

  const {
    messages,
    sending,
    loading,
    chatSessions,
    currentSessionId,
    sendMessage,
    getChatHistory,
    getChatSessions,
    deleteSession,
    setSession,
    clearSession,
  } = useAIChat();

  const {
    isRecording,
    startRecording,
    stopRecording,
    transcribeAudio,
  } = useVoiceRecording();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadSessions = async () => {
    await getChatSessions({ pageNumber: 1, pageSize: 50 });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const prompt = inputValue.trim();
    setInputValue('');

    const response = await sendMessage(prompt, currentSessionId);
    
    // If this is a new session and we got a sessionId from the response
    // We might need to extract it from the response structure
    // For now, the Redux slice should handle it
  };

  const handleStartNewChat = async () => {
    clearSession();
    setInputValue('');
    setShowSessions(false);
  };

  const handleSelectSession = async (sessionId) => {
    setSession(sessionId);
    await getChatHistory(sessionId);
    setShowSessions(false);
  };

  const handleDeleteSession = async (sessionId) => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc chắn muốn xóa cuộc trò chuyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(sessionId);
            if (currentSessionId === sessionId) {
              clearSession();
            }
            await loadSessions();
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    if (currentSessionId) {
      await getChatHistory(currentSessionId);
    }
    setRefreshing(false);
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const audioUri = await stopRecording();
      if (audioUri) {
        const text = await transcribeAudio(audioUri);
        if (text) {
          setInputValue(text);
        }
      }
    } else {
      const started = await startRecording();
      if (!started) {
        // Permission denied or error
        return;
      }
    }
  };

  const handleLinkPress = (link) => {
    if (!link) {
      return;
    }
    const eventMatch = link.match(/event\/([A-Za-z0-9-]+)/i) || link.match(/eventId=([^&]+)/i);
    if (eventMatch && eventMatch[1]) {
      navigation.navigate(ScreenNames.EVENT_DETAIL_SCREEN, { eventId: eventMatch[1] });
      return;
    }
    Linking.openURL(link).catch(() => {});
  };

  const cleanMarkdownAsterisks = (text) => {
    if (!text) return text;
    return text
      .replace(/\*\*\*\*([^*]+)\*\*\*\*/g, "$1") // ****text**** → text
      .replace(/\*\*\*([^*]+)\*\*\*/g, "$1") // ***text*** → text (italic + bold)
      .replace(/\*\*([^*]+)\*\*/g, "$1") // **text** → text
      .replace(/\*([^*]+)\*/g, "$1") // *text* → text
      .replace(/\\\*/g, "*"); // bỏ escape nếu có \*
  };

  const formatMessage = (content) => {
    if (!content) return [];
    
    // Clean markdown asterisks first
    const cleanedContent = cleanMarkdownAsterisks(content);
    
    return cleanedContent.split('\n').map((line, index) => {
      if (line.toLowerCase().startsWith('xem chi tiết')) {
        const parts = line.split(':');
        const link = parts[1]?.trim();
        return { type: 'link', text: parts[0], link };
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return { type: 'bold', text: line.slice(2, -2) };
      }
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
        if (match) {
          return { type: 'bullet', label: match[1], text: match[2] };
        }
      }
      if (line.startsWith('- ')) {
        return { type: 'bullet', text: line.slice(2) };
      }
      return { type: 'text', text: line };
    });
  };

  const renderMessage = (message, index) => {
    const isUser = message.sender === 'user';
    
    return (
      <View
        key={message.id || index}
        style={[
          styles.messageWrapper,
          isUser && styles.userMessageWrapper,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Bot size={16} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser && styles.userMessageBubble,
          ]}
        >
          {formatMessage(message.content).map((item, idx) => {
            if (item.type === 'bold') {
              return (
                <Text key={idx} style={[styles.messageText, styles.boldText, isUser && styles.userMessageText]}>
                  {item.text}
                </Text>
              );
            }
            if (item.type === 'link' && item.link) {
              return (
                <TouchableOpacity key={idx} onPress={() => handleLinkPress(item.link)}>
                  <Text style={[styles.linkText, isUser && styles.userMessageText]}>
                    {item.text}: {item.link}
                  </Text>
                </TouchableOpacity>
              );
            }
            if (item.type === 'bullet') {
              return (
                <View key={idx} style={styles.bulletItem}>
                  <Text style={[styles.bullet, isUser && styles.userMessageText]}>• </Text>
                  {item.label && (
                    <Text style={[styles.bulletLabel, isUser && styles.userMessageText]}>
                      {item.label}:{' '}
                    </Text>
                  )}
                  <Text style={[styles.bulletText, isUser && styles.userMessageText]}>
                    {item.text}
                  </Text>
                </View>
              );
            }
            return (
              <Text key={idx} style={[styles.messageText, isUser && styles.userMessageText]}>
                {item.text}
              </Text>
            );
          })}
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <User size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };

  const renderSessionItem = ({ item }) => {
    const isActive = item.sessionId === currentSessionId;
    
    return (
      <TouchableOpacity
        style={[styles.sessionItem, isActive && styles.sessionItemActive]}
        onPress={() => handleSelectSession(item.sessionId)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionContent}>
          <View style={styles.sessionIcon}>
            <MessageSquare size={20} color={isActive ? '#FFFFFF' : Colors.primary} />
          </View>
          <View style={styles.sessionInfo}>
            <CustomText
              variant="body"
              color={isActive ? 'white' : 'primary'}
              style={styles.sessionName}
              numberOfLines={1}
            >
              {item.sessionName || 'Cuộc trò chuyện mới'}
            </CustomText>
            <CustomText variant="caption" color={isActive ? 'white' : 'secondary'}>
              {item.messageCount || 0} tin nhắn
            </CustomText>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteSession(item.sessionId)}
          style={styles.deleteSessionButton}
        >
          <Trash2 size={18} color={isActive ? '#FFFFFF' : Colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#1D77D5', '#0D47A1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <CustomText variant="h2" color="white" style={styles.headerTitle}>
              AI Chat
            </CustomText>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowSessions(!showSessions)}
              style={styles.sessionsButton}
            >
              <MessageSquare size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStartNewChat}
              style={styles.newChatButton}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Sessions Sidebar */}
      {showSessions && (
        <View style={styles.sessionsContainer}>
          <View style={styles.sessionsHeader}>
            <CustomText variant="h3" color="primary">
              Cuộc trò chuyện
            </CustomText>
            <TouchableOpacity onPress={() => setShowSessions(false)}>
              <Text style={styles.closeSessionsText}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={chatSessions.items}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.sessionId}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptySessions}>
                <MessageSquare size={48} color={Colors.textLight} />
                <CustomText variant="body" color="secondary" style={styles.emptySessionsText}>
                  Chưa có cuộc trò chuyện nào
                </CustomText>
              </View>
            }
          />
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {messages.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Bot size={64} color={Colors.primary} />
            <CustomText variant="h2" color="primary" style={styles.emptyTitle}>
              Xin chào! 👋
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyText} align="center">
            Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện theo nhu cầu của bạn, hoặc trả lời các câu hỏi về sự kiện bạn quan tâm. Bạn cần hỗ trợ gì?
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyText} align="center">
              Bắt đầu cuộc trò chuyện bằng cách nhập câu hỏi của bạn!
            </CustomText>
          </View>
        )}

        {loading && messages.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <CustomText variant="body" color="secondary" style={styles.loadingText}>
              Đang tải...
            </CustomText>
          </View>
        )}

        {messages.map((message, index) => renderMessage(message, index))}

        {sending && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={styles.aiAvatar}>
              <Bot size={16} color="#FFFFFF" />
            </View>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { marginLeft: 4 }]} />
              <View style={[styles.typingDot, { marginLeft: 4 }]} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['rgba(33, 150, 243, 0.12)', 'rgba(25, 118, 210, 0.12)', 'rgba(13, 71, 161, 0.12)']}
          style={styles.inputWrapper}
        >
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor={Colors.textLight}
            value={inputValue}
            onChangeText={setInputValue}
            multiline
            maxLength={500}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              onPress={handleVoiceRecord}
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            >
              {isRecording ? (
                <MicOff size={20} color="#FFFFFF" />
              ) : (
                <Mic size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputValue.trim() || sending}
              style={[
                styles.sendButton,
                (!inputValue.trim() || sending) && styles.sendButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={[Colors.primary, '#1565C0']}
                style={styles.sendButtonGradient}
              >
                <Send size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AIChatScreen;

