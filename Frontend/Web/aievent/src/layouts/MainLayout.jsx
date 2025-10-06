import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "../components/ui/sidebar";
import { VerticalNavigation } from "../components/VerticalNavigation/vertical-navigation";

export default function MainLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <VerticalNavigation />
        <SidebarInset className="flex-1 overflow-x-hidden">
          <main className="w-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}