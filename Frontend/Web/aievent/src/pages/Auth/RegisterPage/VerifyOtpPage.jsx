import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { showError, showSuccess } from "../../../lib/toastUtils";
import { verifyOtp as verifyOtpAction } from "../../../store/slices/authSlice";
import { PATH } from "../../../routes/path";

export default function VerifyOtpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [inputs, setInputs] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const pendingEmail =
    typeof window !== "undefined" ? localStorage.getItem("pendingEmail") : null;

  useEffect(() => {
    if (!pendingEmail) {
      showError("Không tìm thấy email để xác thực. Vui lòng đăng ký lại.");
      navigate(PATH.REGISTER || "/register");
      return;
    }
    inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < inputs.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (!/^\d{6,}$/.test(paste)) return;
    const arr = paste.split("").slice(0, 6);
    setInputs((prev) => arr.concat(prev).slice(0, 6));
    const lastIndex = Math.min(arr.length - 1, 5);
    setTimeout(() => inputsRef.current[lastIndex]?.focus(), 0);
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
      await dispatch(
        verifyOtpAction({ email: pendingEmail, otpCode })
      ).unwrap();
      showSuccess("Xác thực thành công. Đang chuyển hướng...");
      localStorage.removeItem("pendingEmail");
      navigate(PATH.HOME || "/");
    } catch (err) {
      const message =
        (err && (err.message || err.data?.message || err?.message)) ||
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
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Gửi lại OTP thất bại");
      }
      showSuccess(data?.message || "Đã gửi lại mã OTP đến email của bạn.");
    } catch (err) {
      showError(err.message || "Gửi lại OTP thất bại");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle>Xác thực Email</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Nhập mã OTP 6 chữ số được gửi tới email:
            <span className="font-medium ml-1">{pendingEmail}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} onPaste={handlePaste}>
            <div className="flex justify-center gap-3 my-6">
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
                  className="w-12 h-12 text-center rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-0 text-lg"
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm underline text-gray-600 hover:text-gray-800"
              >
                {resendLoading ? "Đang gửi lại..." : "Gửi lại mã OTP"}
              </button>

              <Button type="submit" disabled={loading} className="ml-auto">
                {loading ? "Xác thực..." : "Xác nhận"}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Nếu bạn không nhận được email, kiểm tra hộp thư rác hoặc thử gửi
              lại.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
