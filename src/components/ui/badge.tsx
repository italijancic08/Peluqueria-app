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
        variant === "success" && "bg-green-100 text-green-700",
        variant === "neutral" && "bg-neutral-100 text-neutral-600",
        variant === "danger" && "bg-red-100 text-red-700"
      )}
    >
      {children}
    </span>
  );
}