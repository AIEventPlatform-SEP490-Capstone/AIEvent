import { useSelector, useDispatch } from "react-redux";
import {
  login,
  logout,
  register,
  clearAuth,
  verifyOtp,
  changePassword,
} from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const {
    user,
    isLoading,
    error,
    isAuthenticated,
    verifyingOtp,
    verifyOtpError,
    changingPassword,
    changePasswordError,
  } = useSelector((state) => state.auth);

  const loginUser = async (credentials) => dispatch(login(credentials));
  const registerUser = async (registerData) => dispatch(register(registerData));
  const logoutUser = async () => dispatch(logout());
  const clearAuthError = () => dispatch(clearAuth());
  const verifyOtpAction = async (payload) => dispatch(verifyOtp(payload));
  const changePasswordAction = async (passwordData) => dispatch(changePassword(passwordData));
  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    verifyingOtp,
    verifyOtpError,
    changingPassword,
    changePasswordError,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    clearError: clearAuthError,
    verifyOtp: verifyOtpAction,
    changePassword: changePasswordAction,
  };
};
