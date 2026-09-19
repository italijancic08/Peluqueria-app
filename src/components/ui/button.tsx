import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-neutral-900 text-white hover:bg-neutral-700",
          variant === "secondary" &&
            "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50",
          variant === "danger" &&
            "bg-red-600 text-white hover:bg-red-700",
          variant === "ghost" &&
            "bg-transparent text-neutral-700 hover:bg-neutral-100",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";