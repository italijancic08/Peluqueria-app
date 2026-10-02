import { requireAuth } from "@/lib/auth/guards";
import { FotoPerfilUploader } from "@/components/perfil/foto-perfil-uploader";
import { DatosPersonalesForm } from "@/components/perfil/datos-personales-form";
import { CambiarEmailForm } from "@/components/perfil/cambiar-email-form";
import { CambiarPasswordForm } from "@/components/perfil/cambiar-password-form";

export default async function PerfilPage() {
  const perfil = await requireAuth();

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <h1 className="text-xl font-semibold text-[#4A3428]">Mi perfil</h1>
        <p className="text-sm text-[#9C8577]">Tu foto se muestra en la reserva pública de turnos.</p>
      </div>

      <FotoPerfilUploader
        profileId={perfil.id}
        fotoUrl={perfil.foto_url}
        nombre={`${perfil.nombre} ${perfil.apellido}`}
      />

      <div className="pt-4 border-t border-[#EDD9C4]">
        <h2 className="text-sm font-medium text-[#4A3428] mb-3">Datos personales</h2>
        <DatosPersonalesForm perfil={perfil} />
      </div>

      <div className="pt-4 border-t border-[#EDD9C4]">
        <h2 className="text-sm font-medium text-[#4A3428] mb-3">Email</h2>
        <CambiarEmailForm emailActual={perfil.email ?? ""} />
      </div>

      <div className="pt-4 border-t border-[#EDD9C4]">
        <h2 className="text-sm font-medium text-[#4A3428] mb-3">Contraseña</h2>
        <CambiarPasswordForm />
      </div>
    </div>
  );
}