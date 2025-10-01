import { Outlet } from "react-router-dom";
import SidebarAdmin from "../../components/Sidebar/SidebarAdmin";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <div className="main-container">
        <SidebarAdmin />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}