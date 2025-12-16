import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Send, Bot, User, Mic, MicOff, Maximize2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAIChat } from '../../../hooks/useAIChat';
import { useVoiceRecording } from '../../../hooks/useVoiceRecording';
import CustomText from '../../common/customTextRN';
import Colors from '../../../constants/Colors';
import ScreenNames from '../../../constants/ScreenNames';
import Images from '../../../constants/Images';
import { styles } from './styles';

const { width } = Dimensions.get('window');

const AIChatFloating = () => {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    messages,
    sending,
    sendMessage,
    currentSessionId,
    clearSession,
  } = useAIChat();

  const {
    isRecording,
    startRecording,
    stopRecording,
    transcribeAudio,
  } = useVoiceRecording();

  useEffect(() => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const prompt = inputValue.trim();
    setInputValue('');

    await sendMessage(prompt, currentSessionId);
  };

  const handleStartNewChat = () => {
    clearSession();
    setInputValue('');
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
    
    // Split by newlines and format
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

  const handleLinkPress = (link) => {
    if (!link) {
      return;
    }
    const eventMatch = link.match(/event\/([A-Za-z0-9-]+)/i) || link.match(/eventId=([^&]+)/i);
    if (eventMatch && eventMatch[1]) {
      navigation.navigate(ScreenNames.EVENT_DETAIL_SCREEN, { eventId: eventMatch[1] });
      setIsOpen(false);
      return;
    }
    Linking.openURL(link).catch(() => {});
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Image
          source={Images.aiChatGif}
          style={styles.floatingButtonGif}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsOpen(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <Animated.View
          style={[
            styles.chatContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[Colors.primary, '#1D77D5', '#0D47A1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.botIconContainer}>
                  <Bot size={20} color="#FFFFFF" />
                </View>
                <View>
                  <CustomText variant="h3" color="white" style={styles.headerTitle}>
                    AI Assistant
                  </CustomText>
                  <View style={styles.onlineStatus}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={() => {
                    setIsOpen(false);
                    navigation.navigate(ScreenNames.AI_CHAT_SCREEN);
                  }}
                  style={styles.expandButton}
                >
                  <Maximize2 size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartNewChat}
                  style={styles.newChatButton}
                >
                  <Text style={styles.newChatText}>Mới</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  style={styles.closeButton}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Bot size={48} color={Colors.primary} />
                <CustomText variant="h3" color="primary" style={styles.emptyTitle}>
                  Xin chào! 👋
                </CustomText>
                <CustomText variant="body" color="secondary" style={styles.emptyText} align="center">
               Tôi là AI Assistant của AIEvent. Tôi có thể giúp bạn tìm kiếm sự kiện theo nhu cầu của bạn, hoặc trả lời các câu hỏi về sự kiện bạn quan tâm. Bạn cần hỗ trợ gì?
                </CustomText>
              </View>
            )}

            {messages.map((message, index) => (
              <View
                key={message.id || index}
                style={[
                  styles.messageWrapper,
                  message.sender === 'user' && styles.userMessageWrapper,
                ]}
              >
                {message.sender === 'ai' && (
                  <View style={styles.aiAvatar}>
                    <Bot size={16} color="#FFFFFF" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    message.sender === 'user' && styles.userMessageBubble,
                  ]}
                >
                   {formatMessage(message.content).map((item, idx) => {
                    if (item.type === 'bold') {
                      return (
                        <Text key={idx} style={styles.boldText}>
                          {item.text}
                        </Text>
                      );
                    }
                     if (item.type === 'link' && item.link) {
                       return (
                         <TouchableOpacity key={idx} onPress={() => handleLinkPress(item.link)}>
                           <Text style={styles.linkText}>
                             {item.text}: {item.link}
                           </Text>
                         </TouchableOpacity>
                       );
                     }
                    if (item.type === 'bullet') {
                      return (
                        <View key={idx} style={styles.bulletItem}>
                          <Text style={styles.bullet}>• </Text>
                          {item.label && (
                            <Text style={styles.bulletLabel}>{item.label}: </Text>
                          )}
                          <Text style={styles.bulletText}>{item.text}</Text>
                        </View>
                      );
                    }
                    return (
                      <Text key={idx} style={styles.messageText}>
                        {item.text}
                      </Text>
                    );
                  })}
                </View>

                {message.sender === 'user' && (
                  <View style={styles.userAvatar}>
                    <User size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
            ))}

            {sending && (
              <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
                <View style={styles.aiAvatar}>
                  <Bot size={16} color="#FFFFFF" />
                </View>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                  <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AIChatFloating;

