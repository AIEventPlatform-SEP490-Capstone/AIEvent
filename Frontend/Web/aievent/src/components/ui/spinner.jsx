import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const spinnerVariants = cva(
  "animate-spin inline-block align-middle border-2 border-t-transparent rounded-full",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
      },
      color: {
        default: "border-gray-300 border-t-gray-600",
        primary: "border-primary/40 border-t-primary",
        green: "border-green-300 border-t-green-600",
        red: "border-red-300 border-t-red-600",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

function Spinner({ className, size, color, ...props }) {
  return (
    <span
      className={cn(spinnerVariants({ size, color }), className)}
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };
