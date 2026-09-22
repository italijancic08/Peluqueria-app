import { requireAuth } from "@/lib/auth/guards";
import { FotoPerfilUploader } from "@/components/perfil/foto-perfil-uploader";

export default async function PerfilPage() {
  const perfil = await requireAuth();

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-xl font-semibold text-[#4A3428]">Mi perfil</h1>
        <p className="text-sm text-[#9C8577]">Tu foto se muestra en la reserva pública de turnos.</p>
      </div>

      <FotoPerfilUploader
        profileId={perfil.id}
        fotoUrl={perfil.foto_url}
        nombre={`${perfil.nombre} ${perfil.apellido}`}
      />

      <div className="pt-4 border-t border-[#EDD9C4] space-y-1 text-sm">
        <p className="text-[#9C8577]">Nombre</p>
        <p className="text-[#4A3428]">{perfil.nombre} {perfil.apellido}</p>
        <p className="text-[#9C8577] pt-2">Email</p>
        <p className="text-[#4A3428]">{perfil.email}</p>
      </div>
    </div>
  );
}