import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageKeys from '../../constants/StorageKeys';
import EndUrls from '../EndUrls';
import {NETWORK_CONFIG} from '../../config/NetworkConfig';

let isLoggingOut = false;

class AuthService {
  //Login method
  static async login(email, password) {
    try {
      const response = await fetch(EndUrls.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        // Bỏ qua chứng chỉ SSL cho development
        // timeout: 10000, // 10 seconds timeout
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 'AIE20000' || data.statusCode === 'AIE20001')
      ) {
        await AsyncStorage.setItem(
          StorageKeys.ACCESS_TOKEN,
          data.data.accessToken,
        );
        await AsyncStorage.setItem(
          StorageKeys.REFRESH_TOKEN,
          data.data.refreshToken,
        );
        await AsyncStorage.setItem(
          StorageKeys.TOKEN_EXPIRES_AT,
          data.data.expiresAt,
        );
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
          message: 'Email hoặc mật khẩu không đúng!',
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
      const refreshToken = await AsyncStorage.getItem(
        StorageKeys.REFRESH_TOKEN,
      );

      if (!refreshToken) {
        throw new Error('Không tìm thấy refresh token');
      }

      const response = await fetch(EndUrls.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 'AIE20000' || data.statusCode === 'AIE20001')
      ) {
        await AsyncStorage.setItem(
          StorageKeys.ACCESS_TOKEN,
          data.data.accessToken,
        );
        await AsyncStorage.setItem(
          StorageKeys.TOKEN_EXPIRES_AT,
          data.data.expiresAt,
        );
        await AsyncStorage.setItem(
          StorageKeys.REFRESH_TOKEN,
          data.data.refreshToken,
        );

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
    // Prevent multiple simultaneous logout attempts
    if (isLoggingOut) {
      console.log('Logout already in progress in AuthService, skipping...');
      return;
    }
    
    isLoggingOut = true;
    
    try {
      console.log('AuthService logout started...');
      const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);

      if (accessToken) {
        // Gọi API revoke token with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          await fetch(EndUrls.REVOKE_TOKEN, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          });
        } catch (fetchError) {
          // Ignore fetch errors during logout
          console.warn('Failed to revoke token:', fetchError);
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      // Revoke token error occurred
      console.warn('Error during token revocation:', error);
    } finally {
      // Xóa tất cả auth data khỏi storage
      console.log('Clearing auth data from AsyncStorage...');
      await AsyncStorage.multiRemove([
        StorageKeys.ACCESS_TOKEN,
        StorageKeys.REFRESH_TOKEN,
        StorageKeys.USER_DATA,
        StorageKeys.IS_LOGGED_IN,
        StorageKeys.TOKEN_EXPIRES_AT,
      ]);
      
      isLoggingOut = false;
      console.log('AuthService logout completed');
    }
  }

  // Kiểm tra xem người dùng đã đăng nhập hay chưa
  static async isLoggedIn() {
    try {
      const isLoggedIn = await AsyncStorage.getItem(StorageKeys.IS_LOGGED_IN);
      const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN);
      const expiresAt = await AsyncStorage.getItem(
        StorageKeys.TOKEN_EXPIRES_AT,
      );

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
      const expiresAt = await AsyncStorage.getItem(
        StorageKeys.TOKEN_EXPIRES_AT,
      );

      // Handle case where token or expiration is missing
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
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Register 
  static async register(registerData) {
    try {
      const {
        fullName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        userInterests = [],
        interestedCities = [],
        participationFrequency = 'Weekly',
        budgetOption = 'Flexible',
        isEmailNotificationEnabled = true,
        isPushNotificationEnabled = true,
        isSmsNotificationEnabled = true,
      } = registerData;

      // Process userInterests - handle both array of strings and array of objects
      const processedInterests = Array.isArray(userInterests)
        ? userInterests
            .map(interest => {
              if (typeof interest === 'string') {
                return {interestName: interest};
              } else if (interest && interest.interestName) {
                return {interestName: interest.interestName};
              }
              return null;
            })
            .filter(Boolean)
        : [];

      // Process interestedCities - handle both array of strings and array of objects
      const processedCities = Array.isArray(interestedCities)
        ? interestedCities
            .map(city => {
              if (typeof city === 'string') {
                return {districtName: city};
              } else if (city && city.districtName) {
                return {districtName: city.districtName};
              }
              return null;
            })
            .filter(Boolean)
        : [];

      // Validate required fields before building request
      if (!fullName || !fullName.trim()) {
        return {
          success: false,
          data: null,
          message: 'Họ và tên không được để trống!',
        };
      }

      if (!email || !email.trim()) {
        return {
          success: false,
          data: null,
          message: 'Email không được để trống!',
        };
      }

      if (!password || password.length < 6) {
        return {
          success: false,
          data: null,
          message: 'Mật khẩu phải có ít nhất 8 ký tự!',
        };
      }

      if (!confirmPassword || password !== confirmPassword) {
        return {
          success: false,
          data: null,
          message: 'Mật khẩu xác nhận không khớp!',
        };
      }

      if (!phoneNumber || !phoneNumber.trim()) {
        return {
          success: false,
          data: null,
          message: 'Số điện thoại không được để trống!',
        };
      }

      // Build request body - ensure all fields are properly formatted
      const requestBody = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        confirmPassword: confirmPassword,
        phoneNumber: phoneNumber.trim(),
        userInterests: processedInterests.length > 0 ? processedInterests : [],
        interestedCities: processedCities.length > 0 ? processedCities : [],
        participationFrequency: participationFrequency || 'Weekly',
        budgetOption: budgetOption || 'Flexible',
        isEmailNotificationEnabled: Boolean(isEmailNotificationEnabled),
        isPushNotificationEnabled: Boolean(isPushNotificationEnabled),
        isSmsNotificationEnabled: Boolean(isSmsNotificationEnabled),
      };

      // Log request data for debugging - use JSON.stringify to see full object structure
      console.log('Register API Request URL:', EndUrls.REGISTER);
      console.log(
        'Register API Request Body (stringified):',
        JSON.stringify(requestBody, null, 2),
      );
      console.log('Register API Request Body (object):', requestBody);
      console.log(
        'userInterests detail:',
        JSON.stringify(requestBody.userInterests, null, 2),
      );
      console.log(
        'interestedCities detail:',
        JSON.stringify(requestBody.interestedCities, null, 2),
      );

      const response = await fetch(EndUrls.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const textData = await response.text();
        console.error('Response text:', textData);
        return {
          success: false,
          data: null,
          message: 'Lỗi không xác định từ server. Vui lòng thử lại!',
        };
      }

      // If error, try to get more details
      if (!response.ok && data.errors) {
        console.log('Validation Errors:', JSON.stringify(data.errors, null, 2));
      }
      if (!response.ok && data.error) {
        console.log('Error Details:', JSON.stringify(data.error, null, 2));
      }

      // Check if request was successful
      if (response.ok && response.status === 200) {
        // Check for success status codes
        const isSuccess =
          data.statusCode === 'AIE20000' ||
          data.statusCode === 'AIE20001' ||
          data.statusCode === 200 ||
          data.statusCode === '200';

        // Also check if message contains success keywords
        const messageSuccess =
          data.message &&
          (data.message.toLowerCase().includes('success') ||
            data.message.toLowerCase().includes('thành công') ||
            data.message.toLowerCase().includes('successfully'));

        if (isSuccess || messageSuccess) {
          return {
            success: true,
            data: data.data,
            message:
              data.message || 'Đăng ký thành công! Vui lòng xác thực email.',
          };
        }
      }

      // Handle error response
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại!';

      if (data.message) {
        errorMessage = data.message;
      } else if (data.statusCode === 'AIE40001') {
        errorMessage =
          'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin!';
      } else if (response.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!';
      } else if (response.status === 409) {
        errorMessage = 'Email hoặc số điện thoại đã được sử dụng!';
      } else if (response.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau!';
      }

      return {
        success: false,
        data: null,
        message: errorMessage,
        statusCode: data.statusCode,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Lỗi kết nối, vui lòng thử lại!',
        error: error.message,
      };
    }
  }

  // Verify OTP 
  static async verifyOtp(email, otpCode) {
    try {
      const response = await fetch(EndUrls.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          otpCode,
        }),
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 'AIE20000' || data.statusCode === 'AIE20001')
      ) {
        // If verification successful and tokens are returned, save them
        if (data.data && data.data.accessToken) {
          await AsyncStorage.setItem(
            StorageKeys.ACCESS_TOKEN,
            data.data.accessToken,
          );
          await AsyncStorage.setItem(
            StorageKeys.REFRESH_TOKEN,
            data.data.refreshToken,
          );
          await AsyncStorage.setItem(
            StorageKeys.TOKEN_EXPIRES_AT,
            data.data.expiresAt,
          );
          await AsyncStorage.setItem(StorageKeys.IS_LOGGED_IN, 'true');
        }

        return {
          success: true,
          data: data.data,
          message: data.message || 'Xác thực OTP thành công!',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Lỗi kết nối, vui lòng thử lại!',
        error: error.message,
      };
    }
  }

  // Resend OTP
  static async resendOtp(email) {
    try {
      const response = await fetch(EndUrls.RESEND_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(email), // API mong đợi email dưới dạng chuỗi đơn giản
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 'AIE20000' ||
          data.statusCode === 'AIE20001' ||
          data.statusCode === 'AIE20100')
      ) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Mã OTP đã được gửi lại đến email của bạn!',
        };
      } else {
        return {
          success: false,
          data: null,
          message:
            data.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại!',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Lỗi kết nối, vui lòng thử lại!',
        error: error.message,
      };
    }
  }

// Forgot password - Step 1: Request OTP
static async forgotPassword(email) {
  try {
    const response = await fetch(EndUrls.FORGOT_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    });

    const data = await response.json();

    if (
      response.ok &&
      (data.statusCode === 'AIE20000' || data.statusCode === 'AIE20001')
    ) {
      return {
        success: true,
        data: data.data,
        message: data.message || 'Mã OTP đã được gửi đến email của bạn!',
      };
    } else {
      return {
        success: false,
        data: null,
        message: data.message || 'Không thể gửi mã OTP. Vui lòng thử lại!',
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'Lỗi kết nối, vui lòng thử lại!',
      error: error.message,
    };
  }
}

// Forgot password - Step 2: Verify OTP
static async verifyForgotPasswordOtp(email, otp) {
  try {
    const response = await fetch(EndUrls.FORGOT_PASSWORD_VERIFY_OTP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    });

    const data = await response.json();

    if (
      response.ok &&
      (data.statusCode === 'AIE20000' || data.statusCode === 'AIE20001')
    ) {
      return {
        success: true,
        data: data.data,
        message: data.message || 'Xác thực OTP thành công!',
      };
    } else {
      return {
        success: false,
        data: null,
        message: data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!',
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'Lỗi kết nối, vui lòng thử lại!',
      error: error.message,
    };
  }
}

// Forgot password - Step 3: Reset password
static async resetPassword(email, resetCode, newPassword) {
  try {
    const response = await fetch(EndUrls.RESET_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        resetCode,
        newPassword,
      }),
    });

    const data = await response.json();

    if (
      response.ok &&
      (data.statusCode === 'AIE20000' || data.statusCode === 'AIE20001')
    ) {
      return {
        success: true,
        data: data.data,
        message: data.message || 'Đặt lại mật khẩu thành công!',
      };
    } else {
      return {
        success: false,
        data: null,
        message: data.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại!',
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'Lỗi kết nối, vui lòng thử lại!',
      error: error.message,
    };
  }
}


  // Change password method
  static async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          data: null,
          message: 'Vui lòng đăng nhập lại để thực hiện thao tác này',
        };
      }

      const response = await fetch(EndUrls.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 'AIE20001') {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Đổi mật khẩu thành công',
        };
      } else {
        // Handle different error cases
        let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu';

        if (
          data.statusCode === 'AIE40001' ||
          data.message?.includes('current password') ||
          data.message?.includes('mật khẩu hiện tại')
        ) {
          errorMessage = 'Mật khẩu hiện tại không chính xác';
        } else if (
          data.message?.includes('new password') ||
          data.message?.includes('mật khẩu mới')
        ) {
          errorMessage = 'Mật khẩu mới không hợp lệ';
        } else if (
          data.message?.includes('confirm') ||
          data.message?.includes('xác nhận')
        ) {
          errorMessage = 'Mật khẩu xác nhận không khớp';
        } else if (response.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
        } else if (data.message) {
          errorMessage = data.message;
        }

        return {
          success: false,
          data: null,
          message: errorMessage,
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Lỗi kết nối, vui lòng thử lại!',
        error: error.message,
      };
    }
  }
}

export default AuthService;