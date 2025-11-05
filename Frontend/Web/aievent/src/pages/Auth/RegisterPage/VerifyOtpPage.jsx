import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { showError, showSuccess } from "../../../lib/toastUtils";
import { useAuth } from "../../../hooks/useAuth";
import { PATH } from "../../../routes/path";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { verifyOtp, resendOtp } = useAuth();

  const pendingEmail =
    typeof window !== "undefined" ? localStorage.getItem("pendingEmail") : null;

  useEffect(() => {
    if (!pendingEmail) {
      showError("Không tìm thấy email để xác thực. Vui lòng đăng ký lại.");
      navigate(PATH.REGISTER || "/register");
      return;
    }
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;
    const newInputs = [...inputs];
    newInputs[index] = val.slice(-1);
    setInputs(newInputs);
    if (val && index < inputs.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !inputs[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      const newInputs = [...inputs];
      newInputs[index - 1] = "";
      setInputs(newInputs);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (!/^\d{6,}$/.test(paste)) return;
    const arr = paste.split("").slice(0, 6);
    setInputs(arr);
  };

  const otpCode = inputs.join("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pendingEmail) {
      showError("Không tìm thấy email để xác thực.");
      return;
    }
    if (otpCode.length < 6) {
      showError("Vui lòng nhập đầy đủ 6 chữ số OTP.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ email: pendingEmail, otpCode });
      showSuccess("Xác thực thành công! Đang chuyển hướng...");
      localStorage.removeItem("pendingEmail");
      setTimeout(() => navigate(PATH.HOME || "/"), 1000);
    } catch (err) {
      const message =
        err?.message ||
        err?.data?.message ||
        "Xác thực thất bại. Vui lòng thử lại.";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      showError("Không tìm thấy email để gửi lại OTP.");
      return;
    }
    setResendLoading(true);
    try {
      const res = await resendOtp(pendingEmail);
      showSuccess(res?.message || "Đã gửi lại mã OTP đến email của bạn.");
    } catch (err) {
      const msg = err?.message || err?.data?.message || "Gửi lại OTP thất bại.";
      showError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-50 p-6">
      <Card className="max-w-md w-full shadow-xl border-0 rounded-2xl bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-2 mt-4">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Xác thực Email
          </CardTitle>
          <p className="text-sm text-gray-600">
            Nhập mã OTP 6 chữ số được gửi đến:
            <br />
            <span className="font-medium text-blue-600">{pendingEmail}</span>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} onPaste={handlePaste}>
            <div className="flex justify-center gap-3 my-8">
              {inputs.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  value={val}
                  onChange={(e) => handleChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  maxLength={1}
                  inputMode="numeric"
                  pattern="\d*"
                  className="w-12 h-14 text-center rounded-xl border border-gray-300 shadow-sm text-lg font-medium text-gray-800
                             focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-150
                             hover:border-blue-400"
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-blue-600 hover:text-blue-700 underline disabled:text-gray-400 transition"
              >
                {resendLoading ? "Đang gửi lại..." : "Gửi lại mã OTP"}
              </button>

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                           px-6 py-2 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600
                           transition-all duration-200"
              >
                {loading ? "Đang xác thực..." : "Xác nhận"}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              Nếu bạn không nhận được email, kiểm tra hộp thư rác hoặc thử gửi
              lại sau vài phút.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
