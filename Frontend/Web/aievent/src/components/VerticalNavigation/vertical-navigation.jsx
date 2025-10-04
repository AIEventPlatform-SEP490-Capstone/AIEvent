import React from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

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
} from "lucide-react"
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
} from "../ui/sidebar"
import { cn } from "../../lib/utils"

export function VerticalNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state, toggleSidebar } = useSidebar()

  // Mock user for now - you can implement actual auth later
  const user = null // Set to null to simulate non-authenticated user
  const isAuthenticated = false
  const pathname = location.pathname
  
  const isOrganizerRoute = pathname.startsWith("/organizer")
  const isAdminRoute = pathname.startsWith("/admin")

  const handleLogout = () => {
    // Handle logout logic
    navigate("/")
  }

  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        {
          title: "Trang chủ",
          url: "/",
          icon: Home,
          isActive: pathname === "/",
        },
      ]
    }

    if (user?.role === "admin") {
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
      ]
    }

    if (user?.role === "organizer") {
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
          url: "/organizer/events",
          icon: Calendar,
          isActive: pathname === "/organizer/events",
        },
      ]
    }

    // Default user navigation
    return [
      {
        title: "Trang chủ",
        url: "/",
        icon: Home,
        isActive: pathname === "/",
      },
      {
        title: "Tìm kiếm",
        url: "/search",
        icon: Search,
        isActive: pathname === "/search",
      },
      {
        title: "Người dùng gần đây",
        url: "/nearby",
        icon: MapPin,
        isActive: pathname === "/nearby",
      },
      {
        title: "Bạn bè",
        url: "/friends",
        icon: Users,
        isActive: pathname.startsWith("/friends"),
      },
      {
        title: "Timeline",
        url: "/timeline",
        icon: Calendar,
        isActive: pathname === "/timeline",
        special: true,
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
    ]
  }

  const navigationItems = getNavigationItems()

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-r border-border/40 bg-gradient-to-b from-background to-muted/20 z-50"
    >
      <SidebarHeader className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3 hover:scale-105 transition-all duration-300 ease-out">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AIEvent Platform</span>
            </div>
            {state !== "collapsed" && (
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AIEvent
                </span>
                {/* <span className="text-xs text-muted-foreground font-medium">Platform</span> */}
              </div>
            )}
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
          >
            {state === "collapsed" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!isOrganizerRoute && !isAdminRoute && isAuthenticated && state !== "collapsed" && (
          <div className="px-4 pb-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Tìm kiếm sự kiện..."
                className="pl-10 bg-background/50 border-border/60 focus:border-primary focus:ring-primary/20 focus:bg-background transition-all duration-200 rounded-lg"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 hover:bg-primary/10 hover:text-primary hover:border-primary bg-background/50 border-border/60 transition-all duration-200 rounded-lg font-medium"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Hà Nội
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
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
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                      {state !== "collapsed" && <span className="font-medium text-sm">{item.title}</span>}
                      {item.special && <Zap className="w-3 h-3 ml-auto text-amber-500 animate-pulse" />}
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

        {isAuthenticated && user?.role === "user" && (
          <>
            <SidebarSeparator className="my-4 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 py-2">
                Actions
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
                      <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5">
                        <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && <span className="font-medium text-sm">Hồ sơ cá nhân</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/settings"}
                      className={cn(
                        "group rounded-lg transition-all duration-200 hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary",
                        state === "collapsed" && "p-1 justify-center"
                      )}
                    >
                      <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2.5">
                        <Settings className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && <span className="font-medium text-sm">Cài đặt</span>}
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
                      <NavLink to="/help" className="flex items-center gap-3 px-3 py-2.5">
                        <HelpCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        {state !== "collapsed" && <span className="font-medium text-sm">Trợ giúp</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-background/80 backdrop-blur-sm p-2 sticky bottom-0 z-10">
        {!isAuthenticated ? (
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={cn(
                  "group rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary",
                  state === "collapsed" && "p-1 justify-center"
                )}
              >
                <NavLink to="/auth/login" className="flex items-center gap-3 px-3 py-2.5">
                  <LogIn className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  {state !== "collapsed" && <span className="font-medium text-sm">Đăng nhập</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={cn(
                  "group rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary",
                  state === "collapsed" && "p-1 justify-center"
                )}
              >
                <NavLink to="/auth/register" className="flex items-center gap-3 px-3 py-2.5">
                  <UserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  {state !== "collapsed" && <span className="font-medium text-sm">Đăng ký</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg bg-muted/30",
                state === "collapsed" && "justify-center"
              )}
              >
                <div className="h-8 w-8 ring-2 ring-primary/20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                {state !== "collapsed" && (
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate w-full">{user?.name || "User"}</span>
                    <div className="text-xs bg-gradient-to-r from-primary/15 to-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded font-medium">
                      {user?.role === "admin" ? "Admin" : user?.role === "organizer" ? "Organizer" : "User"}
                    </div>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}