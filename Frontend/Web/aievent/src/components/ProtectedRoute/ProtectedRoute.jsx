// Ví dụ ProtectedRoute ban đầu, bạn có thể mở rộng dựa trên auth state từ Redux
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PATH } from "../../routes/path";
import AccessDenied from "../AccessDenied/AccessDenied";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles = [], allowAnonymous = false }) => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // Hiển thị loading khi đang xác thực
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Nếu cho phép anonymous và user chưa login, hiển thị children
  if (allowAnonymous && !isAuthenticated) return children;
  
  // Nếu user chưa login, redirect về login
  if (!isAuthenticated) return <Navigate to={PATH.LOGIN} />;
  
  // Kiểm tra role nếu có yêu cầu (case-insensitive)
  if (allowedRoles.length && user && !allowedRoles.map(role => role.toLowerCase()).includes(user.role?.toLowerCase())) {
    return <AccessDenied message={`Bạn cần có quyền ${allowedRoles.join(' hoặc ')} để truy cập trang này.`} />;
  }
  
  return children;
};

export default ProtectedRoute;