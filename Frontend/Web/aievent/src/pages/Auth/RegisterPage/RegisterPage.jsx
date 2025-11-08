import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { PATH } from "../../../routes/path";
import { register } from "../../../store/slices/authSlice";
import { showError, showSuccess, authMessages } from "../../../lib/toastUtils";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Bell,
} from "lucide-react";
import AIEventLogo from "../../../assets/AIEventLogo.png";
import LoginPanelBackground from "../../../assets/loginpanel.jpg";

const REGISTRATION_STEPS = {
  BASIC_INFO: 1,
  PREFERENCES: 2,
  CONFIRMATION: 3,
};

const CITIES = [
  "Quận 1",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Quận Bình Tân",
  "Quận Bình Thạnh",
  "Quận Gò Vấp",
  "Quận Phú Nhuận",
  "Quận Tân Bình",
  "Quận Tân Phú",
  "Thành phố Thủ Đức",
  "Huyện Bình Chánh",
  "Huyện Cần Giờ",
  "Huyện Củ Chi",
  "Huyện Hóc Môn",
  "Huyện Nhà Bè",
];

const FREQUENCY_OPTIONS = [
  { value: "Weekly", label: "Hàng tuần" },
  { value: "Monthly", label: "Hàng tháng" },
  { value: "Quarterly", label: "Hàng quý" },
  { value: "Yearly", label: "Hàng năm" },
];

const BUDGET_OPTIONS = [
  { value: "Low", label: "Thấp (dưới 500k)" },
  { value: "Medium", label: "Trung bình (500k - 2tr)" },
  { value: "High", label: "Cao (trên 2tr)" },
  { value: "Flexible", label: "Linh hoạt" },
];
const INTERESTS = [
  "Công nghệ",
  "Kinh doanh",
  "Âm nhạc",
  "Thể thao",
  "Nghệ thuật",
  "Du lịch",
  "Ẩm thực",
  "Giáo dục",
  "Sức khỏe",
  "Thời trang",
  "Gaming",
  "Khởi nghiệp",
  "Marketing",
  "Thiết kế",
  "Nhiếp ảnh",
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(REGISTRATION_STEPS.BASIC_INFO);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    agreeTerms: false,
    preferences: {
      userInterests: [],
      interestedDistricts: [],
      participationFrequency: "Weekly",
      budgetOption: "Flexible",
      notifications: {
        isEmailNotificationEnabled: true,
        isPushNotificationEnabled: true,
        isSmsNotificationEnabled: true,
      },
    },
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    isLoading: authLoading,
    isAuthenticated,
    user,
  } = useSelector((state) => state.auth);
  const interests = INTERESTS;
  // Effect to handle redirection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(PATH.HOME, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Vui lòng nhập email.";
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Vui lòng nhập đúng định dạng email.";
    }
    return null;
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return "Vui lòng nhập số điện thoại.";
    }
    if (!/^\d{10,11}$/.test(phone)) {
      return "Số điện thoại chỉ có thể là 10 hoặc 11 số.";
    }
    return null;
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword.trim()) {
      return "Vui lòng xác nhận mật khẩu.";
    }
    if (password !== confirmPassword) {
      return "Xác nhận mật khẩu không khớp. Vui lòng nhập lại.";
    }
    return null;
  };

  const isValidBasic = () => {
    if (!formData.fullName.trim()) return false;
    if (validateEmail(formData.email)) return false;
    if (!formData.password.trim()) return false;
    if (formData.password.length < 8) return false;
    if (!/[A-Z]/.test(formData.password)) return false;
    if (!/[a-z]/.test(formData.password)) return false;
    if (!/[0-9]/.test(formData.password)) return false;
    if (!/[!@#$%^&*]/.test(formData.password)) return false;
    if (validateConfirmPassword(formData.password, formData.confirmPassword))
      return false;
    if (validatePhone(formData.phoneNumber)) return false;
    if (!formData.agreeTerms) return false;
    return true;
  };

  const isValidPreferences = () => {
    return (
      formData.preferences.userInterests.length >= 3 &&
      formData.preferences.interestedDistricts.length > 0
    );
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case REGISTRATION_STEPS.BASIC_INFO:
        return isValidBasic();
      case REGISTRATION_STEPS.PREFERENCES:
        return isValidPreferences();
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: null }));

    // Real-time validation for specific fields
    let newErrors = { ...errors };
    if (name === "email") {
      newErrors.email = validateEmail(value);
    } else if (name === "phoneNumber") {
      newErrors.phoneNumber = validatePhone(value);
    } else if (name === "confirmPassword") {
      newErrors.confirmPassword = validateConfirmPassword(
        formData.password,
        value
      );
    }
    setErrors(newErrors);
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      password: value,
    }));

    // Clear password error and update confirm error
    let newErrors = { ...errors, password: null };
    if (formData.confirmPassword) {
      newErrors.confirmPassword = validateConfirmPassword(
        value,
        formData.confirmPassword
      );
    }
    setErrors(newErrors);
  };

  const handlePreferenceChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const handleNotificationChange = (key) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [key]: !prev.preferences.notifications[key],
        },
      },
    }));
  };

  const toggleInterest = (interest) => {
    const selected = formData.preferences.userInterests;
    if (selected.includes(interest)) {
      handlePreferenceChange(
        "userInterests",
        selected.filter((item) => item !== interest)
      );
    } else {
      handlePreferenceChange("userInterests", [...selected, interest]);
    }
  };

  const toggleCity = (city) => {
    const interestedDistricts = formData.preferences.interestedDistricts;
    if (interestedDistricts.includes(city)) {
      handlePreferenceChange(
        "interestedDistricts",
        interestedDistricts.filter((c) => c !== city)
      );
    } else {
      handlePreferenceChange("interestedDistricts", [...interestedDistricts, city]);
    }
  };

  const toggleTerms = () => {
    setFormData((prev) => ({ ...prev, agreeTerms: !prev.agreeTerms }));
    setErrors((prev) => ({ ...prev, agreeTerms: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic info validation
    if (currentStep === REGISTRATION_STEPS.BASIC_INFO) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Vui lòng nhập họ và tên.";
      }
      newErrors.email = validateEmail(formData.email);
      if (!formData.password.trim()) {
        newErrors.password = "Vui lòng nhập mật khẩu.";
      } else if (formData.password.length < 8) {
        newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = "Mật khẩu phải chứa ít nhất một chữ hoa.";
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = "Mật khẩu phải chứa ít nhất một chữ thường.";
      } else if (!/[!@#$%^&*]/.test(formData.password)) {
        newErrors.password = "Mật khẩu phải chứa ít nhất một ký tự đặc biệt.";
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = "Mật khẩu phải chứa ít nhất một số.";
      }
      newErrors.confirmPassword = validateConfirmPassword(
        formData.password,
        formData.confirmPassword
      );
      newErrors.phoneNumber = validatePhone(formData.phoneNumber);
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = "Bạn phải đồng ý với điều khoản dịch vụ.";
      }
    }
    // Preferences validation
    if (currentStep === REGISTRATION_STEPS.PREFERENCES) {
      if (formData.preferences.userInterests.length < 3) {
        newErrors.userInterests = "Vui lòng chọn ít nhất 3 sở thích.";
      }
      if (formData.preferences.interestedDistricts.length === 0) {
        newErrors.interestedDistricts = "Vui lòng chọn ít nhất một khu vực.";
      }
    }

    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some((error) => error);
    return hasErrors ? "Vui lòng sửa các lỗi trước khi tiếp tục." : null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    const registerPayload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phoneNumber: formData.phoneNumber,
      userInterests: formData.preferences.userInterests.map((name) => ({
        interestName: name,
      })),
      interestedDistricts: formData.preferences.interestedDistricts.map((city) => ({
        districtName: city,
      })),
      participationFrequency: formData.preferences.participationFrequency,
      budgetOption: formData.preferences.budgetOption,
      isEmailNotificationEnabled:
        formData.preferences.notifications.isEmailNotificationEnabled,
      isPushNotificationEnabled:
        formData.preferences.notifications.isPushNotificationEnabled,
      isSmsNotificationEnabled:
        formData.preferences.notifications.isSmsNotificationEnabled,
    };

    try {
      const result = await dispatch(register(registerPayload)).unwrap();

      // Nếu backend trả token (hiếm) thì register thunk đã lưu token và user
      if (result?.tokens?.accessToken) {
        showSuccess(authMessages.registerSuccess || "Đăng ký thành công.");
        // Nếu muốn có redirect khác, useEffect sẽ xử lý hoặc navigate home
        // Đi thẳng Home
        navigate(PATH.HOME || "/");
        return;
      }

      // Nếu backend KHÔNG trả token => thường case OTP flow
      try {
        localStorage.setItem("pendingEmail", formData.email);
      } catch (err) {
        console.warn("Could not write pendingEmail to localStorage", err);
      }

      showSuccess(
        authMessages.registerSuccess ||
          "Đăng ký thành công. Vui lòng kiểm tra email để nhận mã OTP."
      );

      // Chuyển sang trang nhập OTP
      navigate(PATH.VERIFY_OTP || "/verify-otp");
    } catch (err) {
      console.error("Register error:", err);
      if (err.response?.status === 409) {
        showError(authMessages.registerEmailExists);
      } else if (err.response?.status === 400) {
        showError(authMessages.registerWeakPassword);
      } else if (err.response?.status >= 500) {
        showError(authMessages.registerError);
      } else if (
        err.code === "ECONNABORTED" ||
        err.message?.includes("Network Error")
      ) {
        showError("Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.");
      } else if (err?.message || err?.data?.message) {
        showError(err.message || err.data?.message);
      } else {
        showError(authMessages.registerError);
      }
    }
  };

  const nextStep = () => {
    if (currentStep < REGISTRATION_STEPS.CONFIRMATION) {
      const validationError = validateForm();
      if (validationError) {
        showError(validationError);
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > REGISTRATION_STEPS.BASIC_INFO) {
      setCurrentStep(currentStep - 1);
    }
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

      <div className="relative z-10 min-h-[100svh] flex items-stretch">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-start items-center p-12 text-white relative">
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

        {/* Right side - Form */}
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
            {/* Register card */}
            <Card className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
              <CardHeader className="text-center pb-0">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStep === 1 && "Đăng ký tài khoản"}
                  {currentStep === 2 && "Thiết lập sở thích"}
                  {currentStep === 3 && "Hoàn tất đăng ký"}
                </CardTitle>
                <div className="flex justify-center mt-4 text-sm font-medium text-gray-600">
                  <span>
                    {currentStep === 1 && "Thông tin cơ bản"}
                    {currentStep === 2 && "Sở thích & Preferences"}
                    {currentStep === 3 && "Xác nhận"}
                  </span>
                </div>

                {/* Step progress */}
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            step < currentStep
                              ? "bg-blue-500 text-white shadow-lg"
                              : step === currentStep
                              ? "bg-blue-500 text-white shadow-lg ring-4 ring-blue-100"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {step < currentStep ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div
                            className={`w-16 h-1 mx-3 rounded-full transition-all duration-300 ${
                              step < currentStep ? "bg-blue-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 pt-6">
                <form onSubmit={handleRegister}>
                  {/* Step 1: Basic Information */}
                  {currentStep === REGISTRATION_STEPS.BASIC_INFO && (
                    <div className="space-y-5">
                      <div>
                        <Label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Họ và tên đầy đủ{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="Nguyễn Văn An"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`pl-10 h-11 rounded-lg focus:ring-blue-500 ${
                              errors.fullName
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            required
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="phoneNumber"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Số điện thoại <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            placeholder="0123456789"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={`pl-10 h-11 rounded-lg focus:ring-blue-500 ${
                              errors.phoneNumber
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            required
                          />
                        </div>
                        {errors.phoneNumber && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.phoneNumber}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={`pl-10 h-11 rounded-lg focus:ring-blue-500 ${
                              errors.email
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            }`}
                            required
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Mật khẩu <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={handlePasswordChange}
                              className={`pl-10 pr-10 h-11 rounded-lg focus:ring-blue-500 ${
                                errors.password
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-300 focus:border-blue-500"
                              }`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.password}
                            </p>
                          )}
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            <div className="flex items-center">
                              <CheckCircle2
                                className={`w-3 h-3 mr-2 ${
                                  formData.password.length >= 8
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }`}
                              />
                              <span>Ít nhất 8 ký tự</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2
                                className={`w-3 h-3 mr-2 ${
                                  /[A-Z]/.test(formData.password)
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }`}
                              />
                              <span>Chữ hoa</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2
                                className={`w-3 h-3 mr-2 ${
                                  /[a-z]/.test(formData.password)
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }`}
                              />
                              <span>Chữ thường</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2
                                className={`w-3 h-3 mr-2 ${
                                  /[0-9]/.test(formData.password)
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }`}
                              />
                              <span>Số</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2
                                className={`w-3 h-3 mr-2 ${
                                  /[!@#$%^&*]/.test(formData.password)
                                    ? "text-green-500"
                                    : "text-gray-300"
                                }`}
                              />
                              <span>Ký tự đặc biệt</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Xác nhận mật khẩu{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className={`pl-10 pr-10 h-11 rounded-lg focus:ring-blue-500 ${
                                errors.confirmPassword
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-300 focus:border-blue-500"
                              }`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`mt-0.5 h-5 w-5 border-2 rounded border-blue-300 flex items-center justify-center cursor-pointer ${
                              formData.agreeTerms ? "bg-blue-500" : ""
                            }`}
                            onClick={toggleTerms}
                          >
                            {formData.agreeTerms && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={toggleTerms}
                          >
                            <span className="text-red-500 mr-1 font-bold">
                              *
                            </span>
                            Tôi đồng ý với{" "}
                            <Link
                              to="/terms"
                              className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300"
                            >
                              điều khoản sử dụng
                            </Link>{" "}
                            và{" "}
                            <Link
                              to="/privacy"
                              className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300"
                            >
                              chính sách bảo mật
                            </Link>
                            <p className="text-xs text-gray-500 mt-2">
                              Bắt buộc để hoàn tất đăng ký tài khoản
                            </p>
                          </div>
                        </div>
                        {errors.agreeTerms && (
                          <p className="text-red-500 text-xs mt-2">
                            {errors.agreeTerms}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Preferences */}
                  {currentStep === REGISTRATION_STEPS.PREFERENCES && (
                    <div className="space-y-6">
                      <>
                        <div className="space-y-4">
                          <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              Sở thích của bạn
                            </h3>
                            <p className="text-gray-600">
                              Chọn ít nhất 3 lĩnh vực bạn quan tâm để nhận gợi ý
                              phù hợp
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-center">
                            {INTERESTS.map((interest) => (
                              <div
                                key={interest}
                                className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-full ${
                                  formData.preferences.userInterests.includes(
                                    interest
                                  )
                                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                                    : "border border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                                }`}
                                onClick={() => toggleInterest(interest)}
                              >
                                {interest}
                              </div>
                            ))}
                          </div>

                          {errors.userInterests && (
                            <p className="text-red-500 text-xs mt-2 text-center">
                              {errors.userInterests}
                            </p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              Khu vực quan tâm
                            </h3>
                            <p className="text-gray-600">
                              Chọn các khu vực bạn muốn tham gia sự kiện
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-center">
                            {CITIES.map((city) => (
                              <div
                                key={city}
                                className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-full ${
                                  formData.preferences.interestedDistricts.includes(
                                    city
                                  )
                                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                                    : "border border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                                }`}
                                onClick={() => toggleCity(city)}
                              >
                                {city}
                              </div>
                            ))}
                          </div>
                          {errors.interestedDistricts && (
                            <p className="text-red-500 text-xs mt-2 text-center">
                              {errors.interestedDistricts}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                              Tần suất tham gia{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={
                                formData.preferences.participationFrequency
                              }
                              onValueChange={(value) =>
                                handlePreferenceChange(
                                  "participationFrequency",
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn tần suất" />
                              </SelectTrigger>
                              <SelectContent>
                                {FREQUENCY_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                              Ngân sách <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.preferences.budgetOption}
                              onValueChange={(value) =>
                                handlePreferenceChange("budgetOption", value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn ngân sách" />
                              </SelectTrigger>
                              <SelectContent>
                                {BUDGET_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 text-center">
                            Cài đặt thông báo
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              {
                                key: "isEmailNotificationEnabled",
                                label: "Email",
                                icon: "📧",
                              },
                              {
                                key: "isPushNotificationEnabled",
                                label: "Push",
                                icon: "🔔",
                              },
                              {
                                key: "isSmsNotificationEnabled",
                                label: "SMS",
                                icon: "📱",
                              },
                            ].map((notif) => {
                              const isChecked =
                                formData.preferences.notifications[notif.key];
                              return (
                                <div
                                  key={notif.key}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer"
                                  onClick={() =>
                                    handleNotificationChange(notif.key)
                                  }
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg">
                                      {notif.icon}
                                    </span>
                                    <div className="font-medium text-gray-700">
                                      {notif.label}
                                    </div>
                                  </div>
                                  <div
                                    className={`w-5 h-5 border-2 rounded border-blue-300 flex items-center justify-center ${
                                      isChecked ? "bg-blue-500" : ""
                                    }`}
                                  >
                                    {isChecked && (
                                      <CheckCircle2 className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    </div>
                  )}

                  {/* Step 3: Confirmation */}
                  {currentStep === REGISTRATION_STEPS.CONFIRMATION && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          Xác nhận thông tin
                        </h3>
                        <p className="text-gray-600">
                          Vui lòng kiểm tra lại thông tin trước khi hoàn tất
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                            <User className="w-5 h-5 mr-2 text-blue-600" />
                            Thông tin cơ bản
                          </h4>
                          <div className="space-y-2 text-gray-700">
                            <p>
                              <span className="font-medium">Họ tên:</span>{" "}
                              {formData.fullName}
                            </p>
                            <p>
                              <span className="font-medium">
                                Số điện thoại:
                              </span>{" "}
                              {formData.phoneNumber}
                            </p>
                            <p>
                              <span className="font-medium">Email:</span>{" "}
                              {formData.email}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="font-bold text-gray-800 mb-3">
                            Sở thích (
                            {formData.preferences.userInterests.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.preferences.userInterests
                              .slice(0, 8)
                              .map((interest) => (
                                <div
                                  key={interest}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {interest}
                                </div>
                              ))}

                            {formData.preferences.userInterests.length > 8 && (
                              <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{formData.preferences.userInterests.length - 8}{" "}
                                khác
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-2">
                              Khu vực
                            </h4>
                            <p className="text-gray-600">
                              {formData.preferences.interestedDistricts.join(", ")}
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-2">
                              Tần suất & Ngân sách
                            </h4>
                            <p className="text-gray-600">
                              {
                                FREQUENCY_OPTIONS.find(
                                  (f) =>
                                    f.value ===
                                    formData.preferences.participationFrequency
                                )?.label
                              }{" "}
                              -{" "}
                              {
                                BUDGET_OPTIONS.find(
                                  (b) =>
                                    b.value ===
                                    formData.preferences.budgetOption
                                )?.label
                              }
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                          <h4 className="font-bold text-indigo-800 mb-3">
                            Thông báo
                          </h4>
                          <div className="space-y-1 text-sm text-gray-700">
                            <p>
                              ✅ Email:{" "}
                              {formData.preferences.notifications
                                .isEmailNotificationEnabled
                                ? "Bật"
                                : "Tắt"}
                            </p>
                            <p>
                              🔔 Push:{" "}
                              {formData.preferences.notifications
                                .isPushNotificationEnabled
                                ? "Bật"
                                : "Tắt"}
                            </p>
                            <p>
                              📱 SMS:{" "}
                              {formData.preferences.notifications
                                .isSmsNotificationEnabled
                                ? "Bật"
                                : "Tắt"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep < REGISTRATION_STEPS.CONFIRMATION && (
                    <div className="flex gap-3 mt-6">
                      {currentStep > REGISTRATION_STEPS.BASIC_INFO && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="flex-1 h-11 border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Quay lại
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={!canProceedToNext()}
                      >
                        Tiếp tục
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {currentStep === REGISTRATION_STEPS.CONFIRMATION && (
                    <div className="flex gap-3 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 h-11 border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                      </Button>
                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="flex-1 h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {authLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Đang đăng ký...
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Hoàn tất đăng ký
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </form>

                {currentStep === REGISTRATION_STEPS.BASIC_INFO && (
                  <p className="text-center text-gray-600 mt-6 text-sm">
                    Đã có tài khoản?{" "}
                    <Link
                      to={PATH.LOGIN}
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Đăng nhập ngay
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

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

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
