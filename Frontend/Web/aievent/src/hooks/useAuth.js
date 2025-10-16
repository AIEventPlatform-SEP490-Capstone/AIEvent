import { useSelector, useDispatch } from "react-redux";
import { login, logout, register, clearAuth } from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const loginUser = async (credentials) => dispatch(login(credentials));
  const registerUser = async (registerData) => dispatch(register(registerData));
  const logoutUser = async () => dispatch(logout());
  const clearAuthError = () => dispatch(clearAuth());

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    clearError: clearAuthError,
  };
};
