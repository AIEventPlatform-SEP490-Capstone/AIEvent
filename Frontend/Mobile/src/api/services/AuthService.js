import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageKeys from '../../constants/StorageKeys';
import EndUrls from '../EndUrls';
import { NETWORK_CONFIG } from '../../config/NetworkConfig';

class AuthService {
  //Login method
  static async login(email, password) {
    try {
      
      const response = await fetch(EndUrls.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        // Bỏ qua chứng chỉ SSL cho development
        // timeout: 10000, // 10 seconds timeout
      });

      
      const data = await response.json();

      if (response.ok && data.statusCode === 'AIE20000') {
        await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, data.data.accessToken);
        await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, data.data.refreshToken);
        await AsyncStorage.setItem(StorageKeys.TOKEN_EXPIRES_AT, data.data.expiresAt);
        await AsyncStorage.setItem(StorageKeys.IS_LOGGED_IN, 'true');

        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      } else if (response.ok) {
        // Chuẩn hóa lỗi sai thông tin đăng nhập
        return {
          success: false,
          data: null,
          message: 'Email hoặc mật khẩu không đúng!',
        };
      } else {
        // Lỗi kết nối hoặc máy chủ
        return {
          success: false,
          data: null,
          message: 'Email hoặc mật khẩu không đúng!'
        };
      }
    } catch (error) {
      // Login error occurred
      
      return {
        success: false,
        data: null,
        message: 'Lỗi kết nối, vui lòng thử lại!',
        error: error.message,
      };
    }
  }

  static async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error('Không tìm thấy refresh token');
      }

      const response = await fetch(EndUrls.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 'AIE20000') {
        await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, data.data.accessToken);
        await AsyncStorage.setItem(StorageKeys.TOKEN_EXPIRES_AT, data.data.expiresAt);
        await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, data.data.refreshToken);

        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      } else {
        await this.logout();
        throw new Error(data.message || 'Lỗi khi làm mới token');
      }
    } catch (error) {
      await this.logout();
      return {
        success: false,
        data: null,
        message: 'Token refresh failed',
        error: error.message,
      };
    }
  }

  static async logout() {
    try {
      const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      
      if (accessToken) {
        // Gọi API revoke token
        await fetch(EndUrls.REVOKE_TOKEN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      // Revoke token error occurred
    } finally {
      // Xóa tất cả auth data khỏi storage
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER_DATA,
        StorageKeys.IS_LOGGED_IN,
        StorageKeys.TOKEN_EXPIRES_AT,
      ]);
    }
  }

  // Kiểm tra xem người dùng đã đăng nhập hay chưa
  static async isLoggedIn() {
    try {
      const isLoggedIn = await AsyncStorage.getItem(StorageKeys.IS_LOGGED_IN);
      const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(StorageKeys.TOKEN_EXPIRES_AT);
      
      if (!isLoggedIn || !accessToken || !expiresAt) {
        return false;
      }

      // Check if token is expired
      const now = new Date();
      const expirationDate = new Date(expiresAt);
      
      if (now >= expirationDate) {
        // Token expired, try to refresh
        const refreshResult = await this.refreshToken();
        return refreshResult.success;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Lấy access token
  static async getAccessToken() {
    try {
      const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(StorageKeys.TOKEN_EXPIRES_AT);
      
      if (!accessToken || !expiresAt) {
        return null;
      }

      // Check if token is expired
      const now = new Date();
      const expirationDate = new Date(expiresAt);
      
      if (now >= expirationDate) {
        // Token expired, try to refresh
        const refreshResult = await this.refreshToken();
        return refreshResult.success ? refreshResult.data.accessToken : null;
      }

      return accessToken;
    } catch (error) {
      return null;
    }
  }
  
}

export default AuthService;