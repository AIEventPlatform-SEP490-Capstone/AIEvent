import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "../components/ui/sidebar";
import { VerticalNavigation } from "../components/VerticalNavigation/vertical-navigation";

export default function MainLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <VerticalNavigation />
        <SidebarInset className="flex-1">
          <main className="flex-1 p-6 transition-all duration-300 ease-in-out">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}