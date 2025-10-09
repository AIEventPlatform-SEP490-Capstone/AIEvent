// Ví dụ ProtectedRoute ban đầu, bạn có thể mở rộng dựa trên auth state từ Redux
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PATH } from "../../routes/path";

const ProtectedRoute = ({ children, allowedRoles = [], allowAnonymous = false }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Nếu cho phép anonymous và user chưa login, hiển thị children
  if (allowAnonymous && !isAuthenticated) return children;
  
  // Nếu user chưa login, redirect về login
  if (!isAuthenticated) return <Navigate to={PATH.LOGIN} />;
  
  // Kiểm tra role nếu có yêu cầu (case-insensitive)
  if (allowedRoles.length && user && !allowedRoles.map(role => role.toLowerCase()).includes(user.role?.toLowerCase())) {
    return <Navigate to={PATH.HOME} />;
  }
  
  return children;
};

export default ProtectedRoute;