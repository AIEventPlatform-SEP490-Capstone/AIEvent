import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeftIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Separator } from "./separator";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";

const SidebarContext = React.createContext(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}) {
  const [_open, _setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);

  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen((open) => !open);
    setOpenMobile((prev) => !prev); // Toggle mobile state
  }, [setOpen]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          ...style,
        }}
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full",
          className,
          openMobile && "overflow-hidden",
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { state, openMobile } = useSidebar();

  return (
    <div
      data-slot="sidebar"
      data-side={side}
      data-variant={variant}
      data-collapsible={collapsible}
      data-state={state}
      className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col border-r z-50 backdrop-blur-xl bg-gradient-to-b from-background/95 to-muted/40",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform",
        state === "collapsed" && collapsible === "icon"
          ? "w-[var(--sidebar-width-icon)] translate-x-0 opacity-100 scale-100"
          : "w-[var(--sidebar-width)] translate-x-0 opacity-100 scale-100",
        state === "collapsed" && collapsible !== "icon"
          ? "-translate-x-full opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100",
        className,
      )}
      style={{ 
        position: "fixed",
        top: 0,
        left: openMobile || (state === "expanded" && collapsible === "icon") ? "0" : "-100%",
        height: "100vh",
        width:
          state === "collapsed" && collapsible === "icon"
            ? "var(--sidebar-width-icon)"
            : "var(--sidebar-width)",
        transition: "left 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 50,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarInset({
  className,
  ...props
}) {
  const { state, collapsible } = useSidebar();

  const marginLeft =
    state === "collapsed" && collapsible === "icon"
      ? "var(--sidebar-width-icon)"
      : "var(--sidebar-width)";

  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className,
      )}
      style={{ 
        marginLeft: marginLeft,
        transition: "margin-left 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
      {...props}
    />
  );
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-slot="sidebar-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 w-7 hover:scale-110",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
}

export function SidebarHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 p-2 backdrop-blur-sm bg-gradient-to-r from-primary/10 to-primary/5", className)}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}) {
  const { state } = useSidebar();
  const { collapsible } = props;

  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        "flex flex-col gap-2 p-2 sticky bottom-0 bg-gradient-to-r from-muted/30 to-background/80 backdrop-blur-md z-10 border-t border-border/40",
        state === "collapsed" && collapsible === "icon" && "justify-center items-center",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}) {
  const { state } = useSidebar();
  const { collapsible } = props;

  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        state === "collapsed" && collapsible === "icon" && "justify-center items-center",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

export function SidebarMenu({
  className,
  ...props
}) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  className,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  const { state } = useSidebar();
  const { collapsible } = props;

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:justify-center",
        state === "collapsed" && collapsible === "icon" && "p-1",
        // Hover effect: scaling + shadow
        "hover:scale-105 hover:shadow-md hover:shadow-primary/20",
        size === "sm" && "text-xs",
        size === "lg" && "p-3",
        className,
      )}
      {...props}
    >
      {props.children}
    </Comp>
  );
}

export function SidebarSeparator(props) {
  return (
    <Separator
      data-slot="sidebar-separator"
      className="mx-2 my-2"
      {...props}
    />
  );
}