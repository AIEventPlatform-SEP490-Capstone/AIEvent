import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AIEventLogo from "../../../assets/AIEventLogo.png";
import LoginPanelBackground from "../../../assets/loginpanel.jpg";
import { PATH } from "../../../routes/path";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { authAPI } from "../../../api/fetcher";
import { Eye, EyeOff } from "lucide-react";
import {
  validationMessages,
  showError,
  showSuccess,
  handleApiError,
} from "../../../lib/toastUtils";

const steps = [
  { id: 1, label: "Email" },
  { id: 2, label: "OTP" },
  { id: 3, label: "Mật khẩu" },
];

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const otpRefs = useRef([]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (step === 2) {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const validateEmail = () => {
    if (!email.trim()) {
      showError(validationMessages.required("Email"));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError(validationMessages.email);
      return false;
    }
    return true;
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (!validateEmail()) return;

    setSending(true);
    try {
      const response = await authAPI.forgotPassword({
        email: email.trim(),
      });
      showSuccess(response?.message || "Đã gửi OTP.");
      setStep(2);
      setOtpDigits(Array(6).fill(""));
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setResetCompleted(false);
    } catch (error) {
      handleApiError(error, "Không thể gửi OTP.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (step < 2) return;
    const code = otpDigits.join("");
    if (!code) {
      showError(validationMessages.required("OTP"));
      return;
    }
    if (code.length < 6) {
      showError("OTP cần 6 số.");
      return;
    }

    setVerifying(true);
    try {
      const response = await authAPI.verifyForgotPasswordOtp({
        email: email.trim(),
        otp: code,
      });
      const token = response?.data?.resetToken;
      if (!token) {
        showError("Thiếu mã đặt lại. Vui lòng thử lại.");
        return;
      }
      setResetToken(token);
      showSuccess(response?.message || "OTP hợp lệ.");
      setStep(3);
    } catch (error) {
      handleApiError(error, "OTP không đúng.");
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const nextDigits = Array(6)
      .fill("")
      .map((_, idx) => pasted[idx] || "");
    setOtpDigits(nextDigits);

    const lastIndex = Math.min(pasted.length, 6) - 1;
    if (lastIndex >= 0) {
      otpRefs.current[lastIndex]?.focus();
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!resetToken) {
      showError("Vui lòng xác minh OTP trước.");
      return;
    }
    if (!newPassword.trim()) {
      showError(validationMessages.required("Mật khẩu mới"));
      return;
    }
    if (newPassword.trim().length < 8) {
      showError(validationMessages.password);
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(validationMessages.passwordMatch);
      return;
    }

    setResetting(true);
    try {
      const response = await authAPI.resetPassword({
        email: email.trim(),
        resetCode: resetToken,
        newPassword: newPassword.trim(),
      });
      showSuccess(response?.message || "Đặt lại thành công.");
      setResetCompleted(true);
    } catch (error) {
      handleApiError(error, "Không thể đặt lại mật khẩu.");
    } finally {
      setResetting(false);
    }
  };

  const renderActiveForm = () => {
    if (resetCompleted) {
      return (
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-green-600">
            Mật khẩu mới đã sẵn sàng!
          </p>
          <p className="text-sm text-gray-500">
            Đăng nhập lại để tiếp tục trải nghiệm AIEvent.
          </p>
          <Button
            onClick={() => navigate(PATH.LOGIN)}
            className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold"
          >
            Về trang đăng nhập
          </Button>
        </div>
      );
    }

    if (step === 1) {
      return (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">
              Email đăng ký
            </label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={sending}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold disabled:opacity-60"
          >
            {sending ? "Đang gửi..." : "Gửi OTP"}
          </Button>
        </form>
      );
    }

    if (step === 2) {
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nhập 6 số OTP
            </label>
            <div className="flex justify-between gap-2">
              {otpDigits.map((digit, index) => (
                <Input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  ref={(el) => (otpRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  maxLength={1}
                  className="h-12 w-full text-center text-lg font-semibold tracking-widest rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={verifying}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold disabled:opacity-60"
          >
            {verifying ? "Đang xác minh..." : "Xác minh"}
          </Button>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="new-password"
            className="text-sm font-medium text-gray-700"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium text-gray-700"
          >
            Nhập lại mật khẩu
          </label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={resetting}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold disabled:opacity-60"
        >
          {resetting ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </Button>
      </form>
    );
  };

  return (
    <div className="h-[100svh] w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${LoginPanelBackground})`,
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-36 -right-24 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute -bottom-36 -left-24 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 min-h-[100svh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white/70 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Link to={PATH.HOME} className="flex items-center gap-3">
              <img
                src={AIEventLogo}
                alt="AIEvent"
                className="h-36 w-36 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AIEvent</h1>
                <p className="text-sm text-gray-500">Đặt lại mật khẩu</p>
              </div>
            </Link>
            <Link
              to={PATH.LOGIN}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Hoàn tất từng bước
            </h2>
            <p className="text-sm text-gray-500">
              Tập trung từng nhiệm vụ để đảm bảo an toàn tài khoản.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {steps.map((item) => {
              const isActive = step === item.id;
              const isFinished =
                step > item.id || (item.id === 3 && resetCompleted);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-4 py-3 flex items-center gap-3 bg-white transition-all ${
                    isActive
                      ? "border-blue-500 shadow-md"
                      : isFinished
                      ? "border-green-400 bg-green-50"
                      : "border-gray-100"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isFinished
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.id}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isActive || isFinished ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            {renderActiveForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

