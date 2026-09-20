import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "success" | "neutral" | "danger";
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "success" && "bg-[#EEF1E3] text-[#5C6640]",
        variant === "neutral" && "bg-[#F3E5D6] text-[#9C8577]",
        variant === "danger" && "bg-[#F7E9E2] text-[#B1543A]"
      )}
    >
      {children}
    </span>
  );
}