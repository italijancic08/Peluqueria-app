import { requireAuth } from "@/lib/auth/guards";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  return (
    <div className="min-h-screen flex">
      <Sidebar rol={profile.rol} />
      <div className="flex-1 flex flex-col">
        <Topbar nombre={`${profile.nombre} ${profile.apellido}`} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}