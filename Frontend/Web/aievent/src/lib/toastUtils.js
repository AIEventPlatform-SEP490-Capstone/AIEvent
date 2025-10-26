import toast from "react-hot-toast";

/**
 * Toast utility functions for consistent messaging across the app
 */

// Success messages
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: "#10b981",
      color: "#ffffff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#10b981",
    },
    ...options,
  });
};

// Error messages
export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    position: "top-right",
    style: {
      background: "#ef4444",
      color: "#ffffff",
      fontWeight: "500",
    },
    iconTheme: {
      primary: "#ffffff",
      secondary: "#ef4444",
    },
    ...options,
  });
};

// Warning messages
export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    position: "top-right",
    icon: "⚠️",
    style: {
      background: "#f59e0b",
      color: "#ffffff",
      fontWeight: "500",
    },
    ...options,
  });
};

// Info messages
export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    position: "top-right",
    icon: "ℹ️",
    style: {
      background: "#3b82f6",
      color: "#ffffff",
      fontWeight: "500",
    },
    ...options,
  });
};

// Loading messages
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    position: "top-right",
    style: {
      background: "#6b7280",
      color: "#ffffff",
      fontWeight: "500",
    },
    ...options,
  });
};

// Dismiss toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Auth specific messages
export const authMessages = {
  // Login messages
  loginSuccess: (userName) =>
    `Chào mừng ${userName}! Đăng nhập thành công rồi!.`,
  loginError: "Đăng nhập thất bại rồi. Kiểm tra lại thông tin đi.",
  loginInvalidCredentials:
    "Tài khoản hoặc mật khẩu không chính xác, vui lòng nhập cho kỹ!",
  loginAccountLocked: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
  loginAccountInactive: "Tài khoản chưa được kích hoạt.",
  loginNetworkError: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
  loginServerError: "Lỗi server. Vui lòng thử lại sau.",
  loginValidationError: "Vui lòng nhập đầy đủ thông tin.",

  // Logout messages
  logoutSuccess: "Đăng xuất thành công. Hẹn gặp lại!",
  logoutError: "Có lỗi xảy ra khi đăng xuất.",
  logoutSessionExpired: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",

  // Register messages
  registerSuccess: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
  registerError: "Đăng ký thất bại. Vui lòng thử lại.",
  registerEmailExists: "Email đã được sử dụng. Vui lòng chọn email khác.",
  registerWeakPassword: "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.",

  // Password reset messages
  passwordResetSuccess: "Đã gửi link đặt lại mật khẩu đến email của bạn.",
  passwordResetError: "Không thể gửi email đặt lại mật khẩu.",
  passwordResetInvalidEmail: "Email không tồn tại trong hệ thống.",
};

// Form validation messages
export const validationMessages = {
  required: (field) => `${field} là bắt buộc.`,
  email: "Email không hợp lệ.",
  password: "Mật khẩu phải có ít nhất 8 ký tự.",
  passwordMatch: "Mật khẩu xác nhận không khớp.",
  phone: "Số điện thoại không hợp lệ.",
  minLength: (field, length) => `${field} phải có ít nhất ${length} ký tự.`,
  maxLength: (field, length) => `${field} không được vượt quá ${length} ký tự.`,
};

// API error messages
export const apiMessages = {
  networkError: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
  serverError: "Lỗi server. Vui lòng thử lại sau.",
  unauthorized: "Bạn không có quyền truy cập.",
  forbidden: "Truy cập bị từ chối.",
  notFound: "Không tìm thấy dữ liệu.",
  timeout: "Yêu cầu hết thời gian. Vui lòng thử lại.",
  unknownError: "Có lỗi không xác định xảy ra.",
};

/**
 * Handle API errors and show appropriate toast messages
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message if error type is unknown
 */
export const handleApiError = (
  error,
  defaultMessage = apiMessages.unknownError
) => {
  console.error("API Error:", error);

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error;

    switch (status) {
      case 400:
        showError(message || "Dữ liệu không hợp lệ.");
        break;
      case 401:
        showError(message || apiMessages.unauthorized);
        break;
      case 403:
        showError(message || apiMessages.forbidden);
        break;
      case 404:
        showError(message || apiMessages.notFound);
        break;
      case 500:
        showError(message || apiMessages.serverError);
        break;
      default:
        showError(message || defaultMessage);
    }
  } else if (error.request) {
    showError(apiMessages.networkError);
  } else if (error.code === "ECONNABORTED") {
    showError(apiMessages.timeout);
  } else {
    showError(error.message || defaultMessage);
  }
};
