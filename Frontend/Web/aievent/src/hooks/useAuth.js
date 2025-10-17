import { useSelector, useDispatch } from "react-redux";
import {
  login,
  logout,
  register,
  clearAuth,
  verifyOtp,
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
  } = useSelector((state) => state.auth);

  const loginUser = async (credentials) => dispatch(login(credentials));
  const registerUser = async (registerData) => dispatch(register(registerData));
  const logoutUser = async () => dispatch(logout());
  const clearAuthError = () => dispatch(clearAuth());
  const verifyOtpAction = async (payload) => dispatch(verifyOtp(payload));
  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    verifyingOtp,
    verifyOtpError,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    clearError: clearAuthError,
    verifyOtp: verifyOtpAction,
  };
};
