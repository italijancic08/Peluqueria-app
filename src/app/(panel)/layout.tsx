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
        <Topbar nombre={`${profile.nombre} ${profile.apellido}`} fotoUrl={profile.foto_url} />
        <main className="flex-1 p-6 bg-[#F6E4D3]">{children}</main>
      </div>
    </div>
  );
}