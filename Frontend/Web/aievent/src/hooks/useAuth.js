import { useSelector, useDispatch } from 'react-redux';
import { login, logout, clearAuth } from '../store/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
    
    const loginUser = async (credentials) => dispatch(login(credentials));
    const logoutUser = async () => dispatch(logout());
    const clearAuthError = () => dispatch(clearAuth());

    return {
        user,
        isLoading,
        error,
        isAuthenticated,
        login: loginUser,
        logout: logoutUser,
        clearError: clearAuthError,
    }
}