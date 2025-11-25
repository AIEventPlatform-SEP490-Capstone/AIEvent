import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { logout } from "../../store/slices/authSlice";
import { showSuccess, showError, authMessages } from "../../lib/toastUtils";
import AIEventLogo from "../../assets/AIEventLogo.png";

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
  LayoutDashboard,
  UserPlus2,
  UserCog,
  Activity,
  MessageCircle,
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
import { NotificationBadge } from "../common/NotificationBadge";

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
          title: "Admin Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
          isActive: pathname === "/admin",
        },
        {
          title: "Quản lý Người dùng",
          url: "/admin/users",
          icon: Users,
          isActive: pathname === "/admin/users",
        },

        {
          title: "Quản lí sự kiện",
          url: "/admin/events",
          icon: Calendar,
          isActive: pathname === "/admin/events",
        },
        {
          title: "Flatform Log Activity",
          url: "/admin/platform-log-activity",
          icon: Activity,
          isActive: pathname === "/admin/platform-log-activity",
        },
        {
          title: "Cài đặt hệ thống",
          url: "/admin/system-settings",
          icon: Settings,
          isActive: pathname === "/admin/system-settings",
        },
     
      ];
    }

    if (user?.role?.toLowerCase() === "organizer") {
      return [
        {
          title: "Dashboard",
          url: "/organizer",
          icon: LayoutDashboard,
          isActive: pathname === "/organizer",
        },
        {
          title: "Sự kiện của tôi",
          url: "/organizer/my-events",
          icon: Calendar,
          isActive: pathname === "/organizer/my-events",
        },
        {
          title: "Tạo sự kiện",
          url: "/organizer/create",
          icon: Plus,
          isActive: pathname === "/organizer/create",
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
        {
          title: "Quản lí nhân viên",
          url: "/organizer/staff",
          icon: UserCog,
          isActive: pathname === "/organizer/staff",
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
          title: "Quản lý Tổ chức",
          url: "/manager/organizers",
          icon: User,
          isActive: pathname === "/manager/organizers",
        },
        {
          title: "Quản lý danh mục",
          url: "/manager/events/category",
          icon: BookmarkMinus,
          isActive: pathname === "/manager/events/category",
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
      },
      {
        title: "Tìm Kiếm",
        url: "/search",
        icon: Search,
        isActive: pathname === "/search",
      },

      {
        title: "Timeline",
        url: "/timeline",
        icon: Calendar,
        isActive: pathname === "/timeline",
      },
      {
        title: "Sự kiện gần bạn",
        url: "/nearby",
        icon: MapPin,
        isActive: pathname === "/nearby",
      },
      {
        title: "Yêu thích",
        url: "/favorites",
        icon: Heart,
        isActive: pathname === "/favorites",
      },
      {
        title: "Ví của tôi",
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
      {
        title: "AI Chat",
        url: "/chat",
        icon: MessageCircle,
        isActive: pathname === "/chat",
      },
    ];
  };

  const navigationItems = getNavigationItems();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-border/40 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 z-50 shadow-sm overflow-x-hidden"
    >
      <SidebarHeader className={cn(
        "border-b border-border/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "flex flex-col gap-2 py-3",
          isCollapsed ? "px-0 items-center" : "px-4"
        )}>
          {/* Toggle button - moved to top */}
          <div className={cn(
            "flex w-full",
            isCollapsed ? "justify-center" : "justify-end"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all duration-200"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Logo and brand */}
          <NavLink
            to="/"
            className={cn(
              "flex items-center hover:scale-105 transition-all duration-300 ease-out group",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <div className={cn(
              "bg-gradient-to-br from-sky-400 via-sky-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-blue-500/30 transition-all duration-300 animate-gradient-x bg-[length:200%_200%]",
              isCollapsed ? "w-12 h-12 p-0.5" : "w-11 h-11 p-0.5"
            )}>
              <img
                src={AIEventLogo}
                alt="AIEvent logo"
                className={cn(
                  "object-contain brightness-0 invert",
                  isCollapsed ? "w-10 h-10" : "w-10 h-10"
                )}
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AIEvent
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">
                  Nền tảng mua vé sự kiện trực tuyến
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {!isOrganizerRoute &&
          !isAdminRoute &&
          isAuthenticated &&
          !isCollapsed && (
            <div className="px-4 pb-4 space-y-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
                <Input
                  placeholder="Tìm kiếm sự kiện..."
                  className="pl-10 h-10 bg-background/50 border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all duration-300 rounded-xl hover:border-border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const searchValue = e.target.value.trim();
                      // Clear the input field
                      e.target.value = '';
                      if (searchValue) {
                        navigate(`/search?q=${encodeURIComponent(searchValue)}`);
                      } else {
                        navigate('/search');
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
      </SidebarHeader>

      <SidebarContent className={cn("py-2 overflow-x-hidden", isCollapsed ? "px-1" : "px-2")}>
        {isAuthenticated ? (
          <SidebarGroup className={isCollapsed ? "px-0" : ""}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      className={cn(
                        "group relative overflow-hidden rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:shadow-sm",
                        isCollapsed && "p-2 justify-center w-full"
                      )}
                    >
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center transition-all duration-200",
                          isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "w-5 h-5" : "w-4 h-4"
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium text-sm">
                              {item.title}
                            </span>
                          </>
                        )}
                        {item.isActive && !isCollapsed && (
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
          <SidebarGroup className={isCollapsed ? "px-0" : ""}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                Đăng nhập
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "group relative overflow-hidden rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-50 data-[active=true]:to-blue-100/50 dark:data-[active=true]:from-slate-800 dark:data-[active=true]:to-slate-800/50 data-[active=true]:text-blue-600 dark:data-[active=true]:text-blue-400 data-[active=true]:shadow-sm",
                      isCollapsed && "p-2 justify-center w-full"
                    )}
                  >
                    <NavLink
                      to="/auth/login"
                      className={cn(
                        "flex items-center transition-all duration-200",
                        isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                      )}
                      title={isCollapsed ? "Đăng nhập" : undefined}
                    >
                      <LogIn className={cn(
                        "transition-transform duration-200 group-hover:scale-110",
                        isCollapsed ? "w-5 h-5" : "w-4 h-4"
                      )} />
                      {!isCollapsed && (
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
                      isCollapsed && "p-2 justify-center w-full"
                    )}
                  >
                    <NavLink
                      to="/auth/register"
                      className={cn(
                        "flex items-center transition-all duration-200",
                        isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                      )}
                      title={isCollapsed ? "Đăng ký" : undefined}
                    >
                      <UserPlus className={cn(
                        "transition-transform duration-200 group-hover:scale-110",
                        isCollapsed ? "w-5 h-5" : "w-4 h-4"
                      )} />
                      {!isCollapsed && (
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
            {!isCollapsed && (
              <SidebarSeparator className="my-4 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            )}
            <SidebarGroup className={isCollapsed ? "px-0" : ""}>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                  NOTIFICATIONS
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith("/notifications")}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        isCollapsed && "p-2 justify-center w-full"
                      )}
                    >
                      <NavLink
                        to="/notifications"
                        className={cn(
                          "flex items-center transition-all duration-200",
                          isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                        )}
                        title={isCollapsed ? "Thông báo" : undefined}
                      >
                        <Bell className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "w-5 h-5" : "w-4 h-4"
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium text-sm">Thông báo</span>
                            <div className="ml-auto">
                              <NotificationBadge />
                            </div>
                          </>
                        )}
                        {isCollapsed && (
                          <div className="absolute -top-1 -right-1">
                            <NotificationBadge />
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Only show "Lời mời sự kiện" for regular users, not for admin and manager */}
                  {!["admin", "manager"].includes(user?.role?.toLowerCase()) && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/event-invitations"}
                        className={cn(
                          "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                          isCollapsed && "p-2 justify-center w-full"
                        )}
                      >
                        <NavLink
                          to="/event-invitations"
                          className={cn(
                            "flex items-center transition-all duration-200",
                            isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                          )}
                          title={isCollapsed ? "Lời mời sự kiện" : undefined}
                        >
                          <Mail className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            isCollapsed ? "w-5 h-5" : "w-4 h-4"
                          )} />
                          {!isCollapsed && (
                            <>
                              <span className="font-medium text-sm">
                                Lời mời sự kiện
                              </span>
                              <div className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                2
                              </div>
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {!isCollapsed && (
              <SidebarSeparator className="my-4 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            )}
            <SidebarGroup className={isCollapsed ? "px-0" : ""}>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                  ACTIONS
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        user?.role?.toLowerCase() === "admin"
                          ? pathname === "/admin/profile"
                          : user?.role?.toLowerCase() === "organizer"
                          ? pathname === "/organizer/profile"
                          : user?.role?.toLowerCase() === "manager"
                          ? pathname === "/manager/profile"
                          : pathname === "/profile"
                      }
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        isCollapsed && "p-2 justify-center w-full"
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
                        className={cn(
                          "flex items-center transition-all duration-200",
                          isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                        )}
                        title={isCollapsed ? "Cá nhân" : undefined}
                      >
                        <User className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "w-5 h-5" : "w-4 h-4"
                        )} />
                        {!isCollapsed && (
                          <span className="font-medium text-sm">
                            Cá nhân
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
                        isCollapsed && "p-2 justify-center w-full"
                      )}
                    >
                      <NavLink
                        to="/help"
                        className={cn(
                          "flex items-center transition-all duration-200",
                          isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                        )}
                        title={isCollapsed ? "Trợ giúp" : undefined}
                      >
                        <HelpCircle className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "w-5 h-5" : "w-4 h-4"
                        )} />
                        {!isCollapsed && (
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
                        isCollapsed && "p-2 justify-center w-full"
                      )}
                    >
                      <NavLink
                        to="/about"
                        className={cn(
                          "flex items-center transition-all duration-200",
                          isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                        )}
                        title={isCollapsed ? "Về AIEvent" : undefined}
                      >
                        <Info className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "w-5 h-5" : "w-4 h-4"
                        )} />
                        {!isCollapsed && (
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
                          isCollapsed && "p-2 justify-center w-full"
                        )}
                      >
                        <NavLink
                          to="/become-organizer"
                          className={cn(
                            "flex items-center transition-all duration-200",
                            isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                          )}
                          title={isCollapsed ? "Trở thành Organizer" : undefined}
                        >
                          <UserPlus className={cn(
                            "transition-transform duration-200 group-hover:scale-110",
                            isCollapsed ? "w-5 h-5" : "w-4 h-4"
                          )} />
                          {!isCollapsed && (
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
                        isCollapsed && "p-2 justify-center w-full"
                      )}
                    >
                      <div className={cn(
                        "flex items-center transition-all duration-200",
                        isCollapsed ? "justify-center w-full" : "gap-3 px-3 py-2.5"
                      )}>
                        <LogOut className={cn(
                          "transition-transform duration-200 group-hover:scale-110",
                          isCollapsed ? "w-5 h-5" : "w-4 h-4"
                        )} />
                        {!isCollapsed && (
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
        <SidebarFooter className={cn(
          "border-t border-border/40 bg-background/80 backdrop-blur-sm sticky bottom-0 z-10",
          isCollapsed ? "p-2" : "p-2"
        )}>
          <SidebarMenu>
            <SidebarMenuItem>
              <div
                className={cn(
                  "flex items-center w-full rounded-lg bg-muted/30 transition-all duration-200",
                  isCollapsed ? "justify-center p-2" : "gap-3 p-3"
                )}
              >
                <div className={cn(
                  isCollapsed ? "h-12 w-12" : "h-12 w-12"
                )}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.unique_name || user.name || "Unknown"}
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
                {!isCollapsed && (
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
