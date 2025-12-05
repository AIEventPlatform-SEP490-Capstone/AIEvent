import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

/**
 * Hook for voice recording and speech-to-text conversion
 * Note: For full speech-to-text functionality, you may need to integrate
 * with a service like Google Speech-to-Text API or use a library like
 * @react-native-voice/voice (requires native modules)
 */
export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const recordingRef = useRef(null);

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Cleanup on unmount
    return () => {
      if (recordingRef.current) {
        stopRecording();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
      } else {
        Alert.alert(
          'Quyền truy cập',
          'Ứng dụng cần quyền truy cập microphone để ghi âm giọng nói.',
          [{ text: 'OK' }]
        );
        setPermissionGranted(false);
      }
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setPermissionGranted(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!permissionGranted) {
        await requestPermissions();
        if (!permissionGranted) {
          return false;
        }
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      recordingRef.current = newRecording;

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm. Vui lòng thử lại.');
      return false;
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        return null;
      }

      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      recordingRef.current = null;

      // Here you would typically send the audio to a speech-to-text service
      // For now, we'll return the URI so it can be processed elsewhere
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Lỗi', 'Không thể dừng ghi âm.');
      return null;
    }
  };

  /**
   * Convert audio to text using a speech-to-text service
   * This is a placeholder - you'll need to implement actual STT service integration
   * Options:
   * 1. Google Cloud Speech-to-Text API
   * 2. Azure Speech Services
   * 3. AWS Transcribe
   * 4. @react-native-voice/voice (for on-device recognition)
   */
  const transcribeAudio = async (audioUri) => {
    try {
      // TODO: Implement actual speech-to-text conversion
      // Example with Google Cloud Speech-to-Text:
      /*
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch('YOUR_STT_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: {
            content: audioData,
          },
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 44100,
            languageCode: 'vi-VN',
          },
        }),
      });

      const result = await response.json();
      const text = result.results[0].alternatives[0].transcript;
      setTranscription(text);
      return text;
      */

      // Placeholder: Return empty string for now
      // In production, replace this with actual STT service call
      Alert.alert(
        'Thông báo',
        'Tính năng chuyển đổi giọng nói thành văn bản đang được phát triển. Vui lòng nhập văn bản trực tiếp.'
      );
      return '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Lỗi', 'Không thể chuyển đổi giọng nói thành văn bản.');
      return '';
    }
  };

  const clearRecording = () => {
    setAudioUri(null);
    setTranscription('');
  };

  return {
    isRecording,
    audioUri,
    transcription,
    permissionGranted,
    startRecording,
    stopRecording,
    transcribeAudio,
    clearRecording,
    requestPermissions,
  };
};

export default useVoiceRecording;

