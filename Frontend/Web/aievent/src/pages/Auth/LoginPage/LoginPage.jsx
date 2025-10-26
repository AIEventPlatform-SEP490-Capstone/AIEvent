import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PATH } from "../../../routes/path";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import AIEventLogo from "../../../assets/AIEventLogo.png";
import LoginPanelBackground from "../../../assets/loginpanel.jpg";
import { login } from "../../../store/slices/authSlice";
import GoogleSignInButton from "../../../components/Auth/GoogleSignInButton";
import {
  validationMessages,
  showError,
  showSuccess,
  authMessages,
  handleApiError,
} from "../../../lib/toastUtils";
import {
  saveRememberedEmail,
  getRememberedEmail,
  clearRememberedEmail,
} from "../../../lib/rememberMeUtils";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isLoading: authLoading,
    isAuthenticated,
    user,
  } = useSelector((state) => state.auth);

  // Effect to handle redirection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect về home, RoleBasedRedirect sẽ xử lý redirect theo role
      navigate(PATH.HOME, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Effect to load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return validationMessages.required("Email");
    }
    if (!formData.password.trim()) {
      return validationMessages.required("Mật khẩu");
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return validationMessages.email;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const result = await dispatch(
        login({ ...formData, rememberMe })
      ).unwrap();
      if (result) {
        showSuccess(
          authMessages.loginSuccess(
            result.user.unique_name || result.user.email || "Bạn"
          )
        );

        // Handle remember me functionality
        if (rememberMe) {
          saveRememberedEmail(formData.email);
        } else {
          clearRememberedEmail();
        }

        // Redirection will be handled by useEffect when isAuthenticated becomes true
      }
    } catch (err) {
      console.error("Login error:", err);

      // Hiển thị thông báo lỗi chung cho tất cả các lỗi đăng nhập
      if (
        err.response?.status === 401 ||
        err.response?.status === 403 ||
        err.response?.status === 423
      ) {
        showError(authMessages.loginInvalidCredentials);
      } else if (err.response?.status >= 500) {
        showError(authMessages.loginServerError);
      } else if (
        err.code === "ECONNABORTED" ||
        err.message?.includes("Network Error")
      ) {
        showError(authMessages.loginNetworkError);
      } else {
        showError(authMessages.loginInvalidCredentials);
      }
    }
  };

  const handleGoogleLoadingChange = (loading) => {
    setIsGoogleLoading(loading);
  };

  // If user is authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-[100svh] w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${LoginPanelBackground})`,
          opacity: 0.3, // 70% transparency
        }}
      />
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 min-h-[100svh] flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-2600 to-indigo-700 opacity-95" />

          <div className="relative z-10 max-w-lg">
            <div className="mb-8">
              <Link to={PATH.HOME}>
                <img
                  src={AIEventLogo}
                  alt="AIEvent logo"
                  className="h-[420px] w-[420px] object-contain mb-12 drop-shadow-8xl hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
                Chào mừng đến với AIEvent
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Nền tảng quản lý sự kiện thông minh với công nghệ AI tiên tiến
              </p>
            </div>

            <div className="space-y-6 mt-12">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Tự động hóa thông minh
                  </h3>
                  <p className="text-blue-100">
                    Tối ưu hóa quy trình tổ chức sự kiện với AI
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Quản lý linh hoạt
                  </h3>
                  <p className="text-blue-100">
                    Theo dõi và điều phối mọi khía cạnh sự kiện
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Phân tích chi tiết
                  </h3>
                  <p className="text-blue-100">
                    Báo cáo và thống kê thời gian thực
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to={PATH.HOME}>
                <img
                  src={AIEventLogo}
                  alt="AIEvent logo"
                  className="h-[200px] w-[200px] mx-auto mb-4 object-contain drop-shadow-lg"
                />
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AIEvent
              </h1>
            </div>

            {/* Login card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Đăng nhập
                </h2>
                <p className="text-gray-600">
                  Nhập thông tin tài khoản của bạn
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors"
                    />
                    <span className="text-gray-600 group-hover:text-gray-700 transition-colors">
                      Ghi nhớ đăng nhập
                    </span>
                    <div className="relative group/tooltip">
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Lưu email và giữ đăng nhập trong 30 ngày
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang đăng nhập...
                    </div>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      Hoặc
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="relative w-full max-w-[200px]">
                    {isGoogleLoading && (
                      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <GoogleSignInButton onLoadingChange={handleGoogleLoadingChange} />
                  </div>
                </div>
              </form>

              <p className="text-center text-gray-600 mt-6 text-sm">
                Chưa có tài khoản?{" "}
                <Link
                  to={PATH.REGISTER}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <Link
                to="/terms"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link
                to="/privacy"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                Chính sách bảo mật
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
