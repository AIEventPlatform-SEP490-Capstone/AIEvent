import {Audio} from 'expo-av';

/**
 * Global Recording Manager
 * Đảm bảo chỉ có một Recording object được active tại một thời điểm
 * Giải quyết lỗi "Only one Recording object can be prepared at a given time"
 */
class RecordingManager {
  constructor() {
    this.currentRecording = null;
    this.isRecording = false;
    this.listeners = new Set();
    this.isStarting = false; // Lock để đảm bảo chỉ một startRecording được thực thi
    this.allRecordings = new Set(); // Track tất cả Recording objects đã được tạo
  }

  /**
   * Subscribe để nhận thông báo khi recording state thay đổi
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify tất cả listeners về state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(this.isRecording);
      }
    });
  }

  /**
   * Cleanup một recording object cụ thể
   */
  async cleanupRecording(recording) {
    if (!recording) return;

    try {
      const status = await recording.getStatusAsync();
      if (status.isRecording) {
        // Đang recording, cần stop và unload
        await recording.stopAndUnloadAsync();
      } else {
        // Đã stop rồi, chỉ cần unload
        try {
          await recording.unloadAsync();
        } catch (unloadError) {
          console.log('Error unloading recording:', unloadError);
        }
      }
    } catch (error) {
      console.log('Error cleaning up recording:', error);
      // Tiếp tục cleanup ngay cả khi có lỗi
      try {
        // Thử unload trực tiếp nếu có lỗi
        await recording.unloadAsync();
      } catch (unloadError) {
        console.log('Error force unloading recording:', unloadError);
      }
    } finally {
      // Remove khỏi tracking set
      this.allRecordings.delete(recording);
    }
  }

  /**
   * Cleanup recording hiện tại nếu có
   */
  async cleanupCurrentRecording() {
    if (this.currentRecording) {
      const recordingToCleanup = this.currentRecording;
      this.currentRecording = null;
      this.isRecording = false;
      this.notifyListeners();

      await this.cleanupRecording(recordingToCleanup);
    }
  }

  /**
   * Force cleanup tất cả recording objects có thể tồn tại
   * Sử dụng để đảm bảo không còn recording nào đang được prepared
   */
  async forceCleanupAllRecordings() {
    // Cleanup recording hiện tại
    await this.cleanupCurrentRecording();

    // Cleanup tất cả recordings đã được track
    const recordingsToCleanup = Array.from(this.allRecordings);
    this.allRecordings.clear();

    // Cleanup song song tất cả recordings
    await Promise.allSettled(
      recordingsToCleanup.map(recording => this.cleanupRecording(recording)),
    );

    // Reset audio mode để đảm bảo không còn recording nào được prepared
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    } catch (error) {
      console.log('Error resetting audio mode in force cleanup:', error);
    }

    // Delay lâu hơn để đảm bảo native cleanup hoàn tất
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Bắt đầu recording mới
   */
  async startRecording() {
    // Kiểm tra lock - nếu đang start thì đợi hoặc reject
    if (this.isStarting) {
      console.log('Recording is already being started, please wait...');
      // Đợi một chút và kiểm tra lại
      await new Promise(resolve => setTimeout(resolve, 500));
      if (this.isStarting) {
        throw new Error('Another recording is being started. Please wait.');
      }
    }

    this.isStarting = true;

    try {
      // Force cleanup tất cả recording objects có thể tồn tại
      await this.forceCleanupAllRecordings();

      // Configure audio mode cho recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Delay nhỏ để đảm bảo audio mode được set đúng
      await new Promise(resolve => setTimeout(resolve, 150));

      // Tạo recording mới
      const {recording} = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      // Track recording mới
      this.allRecordings.add(recording);
      this.currentRecording = recording;
      this.isRecording = true;
      this.isStarting = false;
      this.notifyListeners();

      return recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isStarting = false;

      // Nếu lỗi là "Only one Recording", thử cleanup lại và retry với delay tăng dần
      if (error.message && error.message.includes('Only one Recording')) {
        console.log('Retrying after force cleanup...');

        // Retry với delay tăng dần (tối đa 3 lần)
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          await this.forceCleanupAllRecordings();

          // Delay tăng dần: 500ms, 1000ms, 1500ms
          const delay = 500 * attempt;
          console.log(
            `Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));

          this.isStarting = true;
          try {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            const {recording} = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );

            // Track recording mới
            this.allRecordings.add(recording);
            this.currentRecording = recording;
            this.isRecording = true;
            this.isStarting = false;
            this.notifyListeners();

            console.log(`Recording started successfully on attempt ${attempt}`);
            return recording;
          } catch (retryError) {
            console.error(`Error on retry attempt ${attempt}:`, retryError);
            this.isStarting = false;

            // Nếu không phải lỗi "Only one Recording" hoặc đã hết retry, throw error
            if (
              !retryError.message ||
              !retryError.message.includes('Only one Recording') ||
              attempt === maxRetries
            ) {
              await this.forceCleanupAllRecordings();
              throw retryError;
            }
            // Tiếp tục retry nếu vẫn là lỗi "Only one Recording"
          }
        }

        // Nếu đã hết retry mà vẫn lỗi
        await this.forceCleanupAllRecordings();
        throw new Error(
          'Không thể tạo recording sau nhiều lần thử. Vui lòng thử lại sau.',
        );
      } else {
        await this.forceCleanupAllRecordings();
        throw error;
      }
    }
  }

  /**
   * Dừng recording hiện tại
   */
  async stopRecording() {
    if (!this.currentRecording) {
      return null;
    }

    try {
      const status = await this.currentRecording.getStatusAsync();
      let uri = null;

      // Nếu đang recording thì stop và unload trước, rồi lấy URI sau
      if (status.isRecording) {
        await this.currentRecording.stopAndUnloadAsync();
        try {
          uri = this.currentRecording.getURI();
        } catch (error) {
          console.log('Error getting recording URI after stop:', error);
        }
      } else {
        // Nếu đã stop rồi, cố lấy URI (nếu có) rồi unload
        try {
          uri = this.currentRecording.getURI();
        } catch (error) {
          console.log('Error getting recording URI before unload:', error);
        }

        try {
          await this.currentRecording.unloadAsync();
        } catch (error) {
          console.log('Error unloading recording:', error);
        }
      }

      this.currentRecording = null;
      this.isRecording = false;
      this.notifyListeners();

      // Reset audio mode
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
        });
      } catch (error) {
        console.log('Error resetting audio mode:', error);
      }

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      await this.cleanupCurrentRecording();
      return null;
    }
  }

  /**
   * Lấy recording hiện tại
   */
  getCurrentRecording() {
    return this.currentRecording;
  }

  /**
   * Kiểm tra đang recording hay không
   */
  getIsRecording() {
    return this.isRecording;
  }
}

// Export singleton instance
const recordingManager = new RecordingManager();
export default recordingManager;
