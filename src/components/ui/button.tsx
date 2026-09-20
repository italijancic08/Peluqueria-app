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
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-[#6B4635] text-white hover:bg-[#5A3A2C]",
          variant === "secondary" &&
            "bg-white text-[#4A3428] border border-[#EDD9C4] hover:bg-[#FBF3EA]",
          variant === "danger" &&
            "bg-[#B1543A] text-white hover:bg-[#9C4830]",
          variant === "ghost" &&
            "bg-transparent text-[#9C8577] hover:bg-[#F6E4D3]",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";