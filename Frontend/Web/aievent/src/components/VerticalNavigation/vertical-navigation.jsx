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
      className="border-r border-border/40 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 z-50 shadow-sm"
    >
      <SidebarHeader className="border-b border-border/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 transition-all duration-300 hover:scale-105 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {state !== "collapsed" && (
              <div className="flex flex-col">
                <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  AIEvent
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Event Platform</span>
              </div>
            )}
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all duration-200"
          >
            {state === "collapsed" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!isOrganizerRoute && !isAdminRoute && isAuthenticated && state !== "collapsed" && (
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

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-2 py-1.5">
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
                      "group relative overflow-hidden rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-50 data-[active=true]:to-blue-100/50 dark:data-[active=true]:from-slate-800 dark:data-[active=true]:to-slate-800/50 data-[active=true]:text-blue-600 dark:data-[active=true]:text-blue-400 data-[active=true]:shadow-sm",
                      state === "collapsed" && "p-1 justify-center"
                    )}
                  >
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                      {state !== "collapsed" && <span className="font-medium text-sm">{item.title}</span>}
                      {item.isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-blue-700 rounded-r-full shadow-sm" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-3 sticky bottom-0">
        {!isAuthenticated ? (
          <div className="space-y-1.5">
            <NavLink to="/auth/login">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-9 px-3 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {state !== "collapsed" && "Đăng nhập"}
              </Button>
            </NavLink>
            <NavLink to="/auth/register">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-9 px-3 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {state !== "collapsed" && "Đăng ký"}
              </Button>
            </NavLink>
          </div>
        ) : (
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer",
            state === "collapsed" && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold flex items-center justify-center text-sm shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            {state !== "collapsed" && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || "User"}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role === "admin" ? "Admin" : user?.role === "organizer" ? "Organizer" : "User"}
                </span>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}