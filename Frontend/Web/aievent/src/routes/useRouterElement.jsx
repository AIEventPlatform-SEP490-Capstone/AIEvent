import { useRoutes, Navigate } from "react-router-dom";
import { PATH } from "./path";
import MainLayout from "../layouts/MainLayout/MainLayout";
import HomePage from "../pages/Home/HomePage";
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";

export default function useRouterElement() {
  const element = useRoutes([
    {
      path: PATH.HOME,
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
      ],
    },
    {
      path: PATH.AUTH,
      element: <AuthLayout />,
      children: [
        { path: PATH.LOGIN, element: <div>Login Page</div> },
      ],
    },
    {
      path: PATH.ADMIN,
      element: <AdminLayout />,
      children: [
        { path: PATH.DASHBOARD, element: <div>Admin Dashboard</div> },
      ],
    },
    { path: "*", element: <Navigate to={PATH.HOME} /> },
  ]);
  return element;
}