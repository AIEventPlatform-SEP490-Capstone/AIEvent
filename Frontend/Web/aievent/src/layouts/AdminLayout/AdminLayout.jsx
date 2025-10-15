import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  User, 
  Settings, 
  HelpCircle, 
  Zap, 
  Home, 
  LogOut, 
  Bell, 
  Mail,
  Sparkles,
  Receipt
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '../../components/ui/sidebar';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Admin Panel',
      icon: LayoutDashboard,
      path: '/admin',
      active: location.pathname === '/admin' || location.pathname === '/admin/dashboard'
    },
    {
      id: 'events',
      label: 'Duyệt sự kiện',
      icon: CheckSquare,
      path: '/admin/events',
      active: location.pathname === '/admin/events'
    },
    {
      id: 'users',
      label: 'Quản lý User',
      icon: Users,
      path: '/admin/users',
      active: location.pathname === '/admin/users'
    },
    {
      id: 'refund-rules',
      label: 'Quản lý Rules Refund',
      icon: Receipt,
      path: '/admin/refund-rules',
      active: location.pathname === '/admin/refund-rules'
    }
  ];

  const actionItems = [
    {
      id: 'profile',
      label: 'Hồ sơ Admin',
      icon: User,
      path: '/admin/profile',
      active: location.pathname === '/admin/profile'
    },
    {
      id: 'settings',
      label: 'Cài đặt hệ thống',
      icon: Settings,
      path: '/admin/system-settings',
      active: location.pathname === '/admin/system-settings'
    },
    {
      id: 'documentation',
      label: 'Tài liệu Admin',
      icon: HelpCircle,
      path: '/admin/documentation',
      active: location.pathname === '/admin/documentation'
    },
    {
      id: 'quick-actions',
      label: 'Thao tác nhanh',
      icon: Zap,
      path: '/admin/quick-actions',
      active: location.pathname === '/admin/quick-actions'
    },
    {
      id: 'switch-user',
      label: 'Chuyển sang User',
      icon: Home,
      path: '/',
      action: () => navigate('/')
    },
    {
      id: 'logout',
      label: 'Đăng xuất',
      icon: LogOut,
      action: () => logout(),
      variant: 'destructive'
    }
  ];

  const notificationItems = [
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: Bell,
      path: '/admin/notifications',
      badge: 3,
      active: location.pathname === '/admin/notifications'
    }
  ];

  const handleNavigation = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">AIEvent</span>
              <span className="truncate text-xs text-muted-foreground">Event Platform</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={item.active}
                        onClick={() => handleNavigation(item)}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Actions */}
          <SidebarGroup>
            <SidebarGroupLabel>ACTIONS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {actionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={item.active}
                        onClick={() => handleNavigation(item)}
                        className={item.variant === 'destructive' ? 'text-destructive hover:text-destructive hover:bg-destructive/10' : ''}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Notifications */}
          <SidebarGroup>
            <SidebarGroupLabel>NOTIFICATIONS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {notificationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={item.active}
                        onClick={() => handleNavigation(item)}
                      >
                        <div className="relative">
                          <Icon />
                          {item.badge && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <User className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.unique_name || 'Admin User'}
              </span>
              <span className="truncate text-xs text-muted-foreground">Admin</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Super Admin
          </Button>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;