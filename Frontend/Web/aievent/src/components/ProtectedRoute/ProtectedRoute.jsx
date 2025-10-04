// Ví dụ ProtectedRoute ban đầu, bạn có thể mở rộng dựa trên auth state từ Redux
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PATH } from "../../routes/path";

const ProtectedRoute = ({ children, allowedRoles = [], allowAnonymous = false }) => {
  const { user } = useSelector((state) => state.auth);

  if (allowAnonymous && !user) return children;
  if (!user) return <Navigate to={PATH.LOGIN} />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) return <Navigate to={PATH.HOME} />;
  return children;
};

export default ProtectedRoute;