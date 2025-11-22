// components/ui/popover.jsx
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/utils"; // hàm cn bạn đang dùng trong dự án (className utility)

// Root
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

// Content (đã chuyển sang .jsx – không dùng forwardRef kiểu TS)
const PopoverContent = React.forwardRef((props, ref) => {
  const {
    className,
    align = "center",
    sideOffset = 4,
    portal = true, // mặc định vẫn dùng Portal
    ...rest
  } = props;

  const content = (
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...rest}
    />
  );

  return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content;
});
PopoverContent.displayName = "PopoverContent";

// Arrow (mũi tên) – giống hệt shadcn/ui
const PopoverArrow = PopoverPrimitive.Arrow;

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow };