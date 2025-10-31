import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const getErrorMessage = (error) => {
  if (!error) return 'Có lỗi xảy ra khi đổi mật khẩu';
  
  const errorCode = error.statusCode || error.code || error.status || '';
  const errorMessage = error.message || '';
  
  switch (errorCode) {
    case 400:
    case 'AIE40001':
    case 'INVALID_CURRENT_PASSWORD':
    case 'CURRENT_PASSWORD_INCORRECT':
      return 'Mật khẩu hiện tại không chính xác';
    
    case 401:
    case 'UNAUTHORIZED':
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
    
    case 403:
    case 'FORBIDDEN':
      return 'Bạn không có quyền thực hiện thao tác này';
    
    case 422:
    case 'VALIDATION_ERROR':
      if (errorMessage.includes('current password') || errorMessage.includes('mật khẩu hiện tại')) {
        return 'Mật khẩu hiện tại không chính xác';
      }
      if (errorMessage.includes('new password') || errorMessage.includes('mật khẩu mới')) {
        return 'Mật khẩu mới không hợp lệ';
      }
      if (errorMessage.includes('confirm password') || errorMessage.includes('xác nhận')) {
        return 'Mật khẩu xác nhận không khớp';
      }
      return 'Thông tin nhập vào không hợp lệ';
    
    case 429:
    case 'TOO_MANY_REQUESTS':
      return 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
    
    case 500:
    case 'INTERNAL_SERVER_ERROR':
      return 'Lỗi hệ thống. Vui lòng thử lại sau';
    
    default:
      if (errorMessage.toLowerCase().includes('old password not true') || 
          errorMessage.toLowerCase().includes('current password') || 
          errorMessage.toLowerCase().includes('mật khẩu hiện tại')) {
        return 'Mật khẩu hiện tại không chính xác';
      }
      if (errorMessage.toLowerCase().includes('new password') || 
          errorMessage.toLowerCase().includes('mật khẩu mới')) {
        return 'Mật khẩu mới không hợp lệ';
      }
      if (errorMessage.toLowerCase().includes('confirm') || 
          errorMessage.toLowerCase().includes('xác nhận')) {
        return 'Mật khẩu xác nhận không khớp';
      }
      if (errorMessage.toLowerCase().includes('unauthorized') || 
          errorMessage.toLowerCase().includes('token')) {
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      }
      
      return 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại';
  }
};

// Memoized PasswordInput component
const PasswordInput = React.memo(({
  field,
  label,
  placeholder,
  value,
  onChange,
  isValid,
  errorMessage,
  showPassword,
  onToggleVisibility
}) => {
  const hasValue = value.length > 0;
  // Don't show any validation for current password field
  const showValidation = field !== 'currentPassword' && hasValue && (isValid || errorMessage);

  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-semibold text-gray-700">
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id={field}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={`pr-12 h-10 ${
            field === 'currentPassword'
              ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              : !hasValue
                ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                : isValid
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:border-red-500 focus:ring-red-500'
          } transition-colors duration-200`}
        />
        <button
          type="button"
          onClick={() => onToggleVisibility(field)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors duration-200"
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {showValidation && (
        <div className={`flex items-center space-x-1 text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{isValid ? 'Hợp lệ' : errorMessage}</span>
        </div>
      )}
    </div>
  );
});

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword, changingPassword, changePasswordError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Validation logic
  const validateForm = useCallback(() => {
    const newValidation = {
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
      messages: {}
    };

    // Current password: minimum 6 characters
    if (formData.currentPassword.length < 6 && formData.currentPassword.length > 0) {
      newValidation.currentPassword = false;
      newValidation.messages.currentPassword = 'Mật khẩu hiện tại phải có ít nhất 6 ký tự';
    }

    // New password: minimum 8 characters, uppercase, lowercase, number
    const newPassword = formData.newPassword;
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const isNewPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

    if (newPassword.length > 0 && !isNewPasswordValid) {
      newValidation.newPassword = false;
      newValidation.messages.newPassword = 'Mật khẩu mới cần ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số';
    }

    // Confirm password: must match new password
    if (formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.newPassword) {
      newValidation.confirmPassword = false;
      newValidation.messages.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    // Additional check: new password must differ from current password
    if (formData.newPassword.length > 0 && formData.newPassword === formData.currentPassword) {
      newValidation.newPassword = false;
      newValidation.messages.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    return newValidation;
  }, [formData]);

  // Compute validation state
  const validation = useMemo(() => validateForm(), [validateForm]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (changePasswordError) {
      clearError();
    }
  }, [changePasswordError, clearError]);

  // Handle password visibility toggle
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    const hasCurrentPassword = formData.currentPassword.length >= 3;
    const hasNewPassword =
      formData.newPassword.length >= 8 &&
      /[A-Z]/.test(formData.newPassword) &&
      /[a-z]/.test(formData.newPassword) &&
      /\d/.test(formData.newPassword);
    const hasConfirmPassword = formData.confirmPassword === formData.newPassword && formData.confirmPassword.length > 0;
    const isDifferentPassword = formData.currentPassword !== formData.newPassword;

    return hasCurrentPassword && hasNewPassword && hasConfirmPassword && isDifferentPassword;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (result.error) {
        // Map backend error codes to Vietnamese messages
        const errorMessage = getErrorMessage(result.error);
        throw new Error(errorMessage);
      }

      toast.success('Đổi mật khẩu thành công!');
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  // Handle modal close
  const handleClose = useCallback(() => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    clearError();
    onClose();
  }, [clearError, onClose]);

  // Password requirements display
  const PasswordRequirements = () => {
    const password = formData.newPassword;
    const requirements = [
      { label: `Ít nhất 8 ký tự (${password.length}/8)`, met: password.length >= 8 },
      { label: '1 chữ hoa (A-Z)', met: /[A-Z]/.test(password) },
      { label: '1 chữ thường (a-z)', met: /[a-z]/.test(password) },
      { label: '1 số (0-9)', met: /\d/.test(password) }
    ];

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Yêu cầu mật khẩu mới:</h4>
        <div className="space-y-2">
          {requirements.map(({ label, met }, index) => (
            <div key={index} className={`flex items-center space-x-2 text-sm ${met ? 'text-green-700' : 'text-blue-800'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-green-500' : 'bg-gray-300'}`}>
                {met && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Đổi mật khẩu
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại và mật khẩu mới
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PasswordInput
            field="currentPassword"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            value={formData.currentPassword}
            onChange={handleInputChange}
            isValid={validation.currentPassword}
            errorMessage={validation.messages.currentPassword}
            showPassword={showPasswords.currentPassword}
            onToggleVisibility={togglePasswordVisibility}
          />

          <PasswordInput
            field="newPassword"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            value={formData.newPassword}
            onChange={handleInputChange}
            isValid={validation.newPassword}
            errorMessage={validation.messages.newPassword}
            showPassword={showPasswords.newPassword}
            onToggleVisibility={togglePasswordVisibility}
          />

          <PasswordInput
            field="confirmPassword"
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            isValid={validation.confirmPassword}
            errorMessage={validation.messages.confirmPassword}
            showPassword={showPasswords.confirmPassword}
            onToggleVisibility={togglePasswordVisibility}
          />

          {changePasswordError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div className="text-red-600 text-sm">
                  <strong>Lỗi:</strong> {getErrorMessage(changePasswordError)}
                </div>
                <button
                  onClick={clearError}
                  className="ml-auto text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-1"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <PasswordRequirements />

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-10"
              disabled={changingPassword}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || changingPassword}
              className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;