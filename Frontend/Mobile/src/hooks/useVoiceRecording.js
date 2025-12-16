import {useState, useRef, useEffect} from 'react';
import {Audio} from 'expo-av';
import {Alert, Platform} from 'react-native';
import recordingManager from '../utils/recordingManager';

/**
 * Hook for voice recording and speech-to-text conversion
 * Note: For full speech-to-text functionality, you may need to integrate
 * with a service like Google Speech-to-Text API or use a library like
 * @react-native-voice/voice (requires native modules)
 *
 * Sử dụng global RecordingManager để đảm bảo chỉ có một Recording object active tại một thời điểm
 */
export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Subscribe to recording manager để sync state
    const unsubscribe = recordingManager.subscribe(recordingState => {
      setIsRecording(recordingState);
    });

    // Sync initial state
    setIsRecording(recordingManager.getIsRecording());

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Không cleanup recording ở đây vì có thể component khác đang sử dụng
      // RecordingManager sẽ tự quản lý cleanup
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const {status} = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
      } else {
        Alert.alert(
          'Quyền truy cập',
          'Ứng dụng cần quyền truy cập microphone để ghi âm giọng nói.',
          [{text: 'OK'}],
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

      // Sử dụng RecordingManager để bắt đầu recording
      // Manager sẽ tự động cleanup recording cũ nếu có
      const recording = await recordingManager.startRecording();

      // State sẽ được update tự động qua subscription
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);

      // Parse error message để hiển thị thông báo phù hợp
      let errorMessage = 'Không thể bắt đầu ghi âm. Vui lòng thử lại.';
      if (error.message && error.message.includes('Only one Recording')) {
        errorMessage =
          'Đang có một bản ghi âm khác đang chạy. Vui lòng đợi hoặc dừng bản ghi âm đó trước.';
      }

      Alert.alert('Lỗi', errorMessage);
      return false;
    }
  };

  const stopRecording = async () => {
    try {
      // Sử dụng RecordingManager để dừng recording
      const uri = await recordingManager.stopRecording();

      if (uri) {
        setAudioUri(uri);
      }

      // State sẽ được update tự động qua subscription
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
  const transcribeAudio = async audioUri => {
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
        'Tính năng chuyển đổi giọng nói thành văn bản đang được phát triển. Vui lòng nhập văn bản trực tiếp.',
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
