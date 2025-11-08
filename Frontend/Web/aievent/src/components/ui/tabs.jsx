import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Tabs Component — Pure React (không Radix)
 * Gồm: Tabs, TabsList, TabsTrigger, TabsContent
 */

const TabsContext = React.createContext();

export const Tabs = ({ value, onValueChange, className, children }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef(
  ({ className, value, disabled, children, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const isActive = ctx?.value === value;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={() => ctx?.onValueChange?.(value)}
        data-state={isActive ? "active" : "inactive"}
        className={cn(
          "inline-flex min-w-[80px] items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          "data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

/**
 * TabsContent — chỉ hiển thị nếu value của Tabs trùng với value prop
 */
export const TabsContent = React.forwardRef(
  ({ className, value, children, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const isActive = ctx?.value === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";
