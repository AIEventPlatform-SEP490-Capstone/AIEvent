import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="main-layout">
      <header>
        <h1>Task Management App</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}