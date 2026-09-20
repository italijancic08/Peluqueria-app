import { cn } from "@/lib/utils";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#EDD9C4] bg-white">
      <table className="min-w-full divide-y divide-[#EDD9C4] text-sm">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-[#FBF3EA]">{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[#F3E5D6]">{children}</tbody>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

export function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-medium text-[#9C8577] uppercase tracking-wide">
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 text-[#4A3428]", className)}>{children}</td>;
}