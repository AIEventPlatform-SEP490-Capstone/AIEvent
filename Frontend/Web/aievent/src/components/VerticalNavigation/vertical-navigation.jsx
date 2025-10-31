import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { logout } from "../../store/slices/authSlice";
import { showSuccess, showError, authMessages } from "../../lib/toastUtils";

import {
  Search,
  MapPin,
  Calendar,
  User,
  Bell,
  Settings,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  LogIn,
  UserPlus,
  Users,
  Mail,
  Wallet,
  Zap,
  Home,
  Plus,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Receipt,
  BookmarkMinus,
  Tag,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "../ui/sidebar";
import { cn } from "../../lib/utils";

export function VerticalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state, toggleSidebar } = useSidebar();

  // Get user data from Redux store
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const pathname = location.pathname;

  const isOrganizerRoute = pathname.startsWith("/organizer");
  const isAdminRoute = pathname.startsWith("/admin");

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      showSuccess(authMessages.logoutSuccess);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      showError(authMessages.logoutError);
      // Force logout even if API call fails
      navigate("/");
    }
  };

  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        {
          title: "Trang chủ",
          url: "/",
          icon: Home,
          isActive: pathname === "/",
        },
      ];
    }

    if (user?.role?.toLowerCase() === "admin") {
      return [
        {
          title: "Admin Panel",
          url: "/admin",
          icon: Settings,
          isActive: pathname === "/admin",
        },
        {
          title: "Duyệt sự kiện",
          url: "/admin/events",
          icon: CheckSquare,
          isActive: pathname === "/admin/events",
        },
        {
          title: "Quản lý User",
          url: "/admin/users",
          icon: Users,
          isActive: pathname === "/admin/users",
        },
        {
          title: "Quy tắc hoàn tiền",
          url: "/admin/refund-rules",
          icon: Receipt,
          isActive: pathname === "/admin/refund-rules",
        },
        {
          title: "Quản lý Organizer",
          url: "/admin/organizers",
          icon: User,
          isActive: pathname === "/admin/organizers",
        },
        {
          title: "Hồ sơ Admin",
          url: "/admin/profile",
          icon: User,
          isActive: pathname === "/admin/profile",
        },
        {
          title: "Cài đặt hệ thống",
          url: "/admin/system-settings",
          icon: Settings,
          isActive: pathname === "/admin/system-settings",
        },
        {
          title: "Tài liệu Admin",
          url: "/admin/documentation",
          icon: HelpCircle,
          isActive: pathname === "/admin/documentation",
        },
        {
          title: "Thao tác nhanh",
          url: "/admin/quick-actions",
          icon: Zap,
          isActive: pathname === "/admin/quick-actions",
        },
      ];
    }

    if (user?.role?.toLowerCase() === "organizer") {
      return [
        {
          title: "Dashboard",
          url: "/organizer",
          icon: BarChart3,
          isActive: pathname === "/organizer",
        },
        {
          title: "Tạo sự kiện",
          url: "/organizer/create",
          icon: Plus,
          isActive: pathname === "/organizer/create",
        },
        {
          title: "Sự kiện của tôi",
          url: "/organizer/my-events",
          icon: Calendar,
          isActive: pathname === "/organizer/my-events",
        },
        {
          title: "Quản lý sự kiện",
          url: "/organizer/events",
          icon: CheckSquare,
          isActive: pathname === "/organizer/events",
        },
        {
          title: "Quản lý Tags",
          url: "/organizer/tags",
          icon: Tag,
          isActive: pathname === "/organizer/tags",
        },
      ];
    }

    if (user?.role?.toLowerCase() === "manager") {
      return [
        {
          title: "Dashboard",
          url: "/manager",
          icon: BarChart3,
          isActive: pathname === "/manager",
        },
        {
          title: "Quản lý sự kiện",
          url: "/manager/events",
          icon: Calendar,
          isActive: pathname === "/manager/events",
        },
        {
          title: "Quản lý danh mục",
          url: "/manager/events/category",
          icon: BookmarkMinus,
          isActive: pathname === "/manager/events/category",
        },
        {
          title: "Quy tắc hoàn tiền",
          url: "/manager/refund-rules",
          icon: Receipt,
          isActive: pathname === "/manager/refund-rules",
        },
        {
          title: "Quản lý Tags",
          url: "/manager/tags",
          icon: Tag,
          isActive: pathname === "/manager/tags",
        },
      ];
    }

    // Default user navigation - theo thứ tự trong ảnh
    return [
      {
        title: "Trang chủ",
        url: "/",
        icon: Home,
        isActive: pathname === "/",
        special: true,
      },

      {
        title: "Timeline",
        url: "/timeline",
        icon: Calendar,
        isActive: pathname === "/timeline",
      },
      {
        title: "Yêu thích",
        url: "/favorites",
        icon: Heart,
        isActive: pathname === "/favorites",
      },
      {
        title: "Ví điện tử",
        url: "/wallet",
        icon: Wallet,
        isActive: pathname === "/wallet",
      },
      {
        title: "Vé của tôi",
        url: "/my-tickets",
        icon: Calendar,
        isActive: pathname === "/my-tickets",
      },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-border/40 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 z-50 shadow-sm"
    >
      <SidebarHeader className="border-b border-border/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink
            to="/"
            className="flex items-center gap-3 hover:scale-105 transition-all duration-300 ease-out group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-blue-500/30 transition-all duration-300">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {state !== "collapsed" && (
              <div className="flex flex-col">
                <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AIEvent
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Event Platform
                </span>
              </div>
            )}
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all duration-200"
          >
            {state === "collapsed" ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!isOrganizerRoute &&
          !isAdminRoute &&
          isAuthenticated &&
          state !== "collapsed" && (
            <div className="px-4 pb-4 space-y-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
                <Input
                  placeholder="Tìm kiếm sự kiện..."
                  className="pl-10 h-10 bg-background/50 border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all duration-300 rounded-xl hover:border-border"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 hover:bg-primary/10 hover:text-primary hover:border-primary hover:scale-[1.02] bg-background/50 border-border/60 transition-all duration-300 rounded-xl font-medium shadow-sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Hà Nội
              </Button>
            </div>
          )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {isAuthenticated ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      className={cn(
                        "group relative overflow-hidden rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:shadow-sm",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <item.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && (
                          <span className="font-medium text-sm">
                            {item.title}
                          </span>
                        )}
                        {item.special && (
                          <Zap className="w-3 h-3 ml-auto text-amber-500 animate-pulse" />
                        )}
                        {item.isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/70 rounded-r-full" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
              Đăng nhập
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "group relative overflow-hidden rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-50 data-[active=true]:to-blue-100/50 dark:data-[active=true]:from-slate-800 dark:data-[active=true]:to-slate-800/50 data-[active=true]:text-blue-600 dark:data-[active=true]:text-blue-400 data-[active=true]:shadow-sm",
                      state === "collapsed" && "p-1 justify-center"
                    )}
                  >
                    <NavLink
                      to="/auth/login"
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <LogIn className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                      {state !== "collapsed" && (
                        <span className="font-medium text-sm">Đăng nhập</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                      state === "collapsed" && "p-1 justify-center"
                    )}
                  >
                    <NavLink
                      to="/auth/register"
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <UserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                      {state !== "collapsed" && (
                        <span className="font-medium text-sm">Đăng ký</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAuthenticated && (
          <>
            <SidebarSeparator className="my-4 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                NOTIFICATIONS
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/notifications"}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <NavLink
                        to="/notifications"
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && (
                          <span className="font-medium text-sm">Thông báo</span>
                        )}
                        {state !== "collapsed" && (
                          <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            3
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Only show "Lời mời sự kiện" for regular users, not for admin */}
                  {user?.role?.toLowerCase() !== "admin" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/event-invitations"}
                        className={cn(
                          "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                          state === "collapsed" && "p-1 justify-center"
                        )}
                      >
                        <NavLink
                          to="/event-invitations"
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <Mail className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                          {state !== "collapsed" && (
                            <span className="font-medium text-sm">
                              Lời mời sự kiện
                            </span>
                          )}
                          {state !== "collapsed" && (
                            <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              2
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-4 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                ACTIONS
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/profile"}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <NavLink
                        to={
                          user?.role?.toLowerCase() === "admin"
                            ? "/admin/profile"
                            : user?.role?.toLowerCase() === "organizer"
                            ? "/organizer/profile"
                            : user?.role?.toLowerCase() === "manager"
                            ? "/manager/profile"
                            : "/profile"
                        }
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && (
                          <span className="font-medium text-sm">
                            Hồ sơ cá nhân
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/help"}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <NavLink
                        to="/help"
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <HelpCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && (
                          <span className="font-medium text-sm">Trợ giúp</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/about"}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <NavLink
                        to="/about"
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <Info className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && (
                          <span className="font-medium text-sm">
                            Về AIEvent
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Only show "Trở thành Organizer" for regular users, not for admin */}
                  {user?.role?.toLowerCase() == "user" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/become-organizer"}
                        className={cn(
                          "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                          state === "collapsed" && "p-1 justify-center"
                        )}
                      >
                        <NavLink
                          to="/become-organizer"
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <Plus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                          {state !== "collapsed" && (
                            <span className="font-medium text-sm">
                              Trở thành Organizer
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleLogout}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 text-red-600",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && (
                          <span className="font-medium text-sm">Đăng xuất</span>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {isAuthenticated && (
        <SidebarFooter className="border-t border-border/40 bg-background/80 backdrop-blur-sm p-2 sticky bottom-0 z-10">
          <SidebarMenu>
            <SidebarMenuItem>
              <div
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg bg-muted/30",
                  state === "collapsed" && "justify-center"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden border-2 border-blue-300">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.unique_name || user.name || "User"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.unique_name
                          ? user.unique_name.charAt(0).toUpperCase()
                          : user?.name
                          ? user.name.charAt(0).toUpperCase()
                          : user?.email
                          ? user.email.charAt(0).toUpperCase()
                          : "N"}
                      </span>
                    </div>
                  )}
                </div>
                {state !== "collapsed" && (
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate w-full">
                      {user?.unique_name ||
                        user?.name ||
                        user?.email ||
                        "Người dùng"}
                    </span>
                    <div className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {user?.role || "User"}
                    </div>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
