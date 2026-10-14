import { Fragment } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { ToggleActivo } from "@/components/servicios/toggle-activo";
import { formatearPesos } from "@/lib/format";
import { precioTarjeta } from "@/lib/precios";
import { obtenerRecargoTarjeta } from "@/lib/recargo";

export default async function ServiciosPage() {
  const supabase = await createClient();

  const [{ data: servicios, error }, recargoPct] = await Promise.all([
    supabase
      .from("services")
      .select("*, service_variants(*)")
      .order("nombre", { ascending: true }),
    obtenerRecargoTarjeta(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Servicios</h1>
        <Link href="/servicios/nuevo">
          <Button>Nuevo servicio</Button>
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">No se pudieron cargar los servicios.</p>
      )}

      {!error && servicios && servicios.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no hay servicios cargados.</p>
      )}

      {!error && servicios && servicios.length > 0 && (
        <Table>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Efectivo / transf.</Th>
              <Th>Tarjeta (+{recargoPct}%)</Th>
              <Th>Duración</Th>
              <Th>Estado</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {servicios.map((servicio) => {
              const variantes = (servicio.service_variants ?? [])
                .filter((v) => v.activo)
                .sort((a, b) => Number(a.precio) - Number(b.precio));
              const desde = variantes.length > 0 ? "Desde " : "";

              return (
                <Fragment key={servicio.id}>
                  <Tr>
                    <Td>{servicio.nombre}</Td>
                    <Td>
                      {desde}
                      {formatearPesos(servicio.precio)}
                    </Td>
                    <Td>
                      {desde}
                      {formatearPesos(precioTarjeta(servicio.precio, recargoPct))}
                    </Td>
                    <Td>
                      {desde}
                      {servicio.duracion_min} min
                    </Td>
                    <Td>
                      <Badge variant={servicio.activo ? "success" : "neutral"}>
                        {servicio.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </Td>
                    <Td className="text-right space-x-2">
                      <Link
                        href={`/servicios/${servicio.id}/editar`}
                        className="text-sm text-neutral-900 underline"
                      >
                        Editar
                      </Link>
                      <ToggleActivo id={servicio.id} activo={servicio.activo} />
                    </Td>
                  </Tr>

                  {variantes.map((v) => (
                    <Tr key={v.id}>
                      <Td className="pl-8 text-neutral-500">↳ {v.nombre}</Td>
                      <Td className="text-neutral-500">{formatearPesos(v.precio)}</Td>
                      <Td className="text-neutral-500">
                        {formatearPesos(precioTarjeta(v.precio, recargoPct))}
                      </Td>
                      <Td className="text-neutral-500">{v.duracion_min} min</Td>
                      <Td>{null}</Td>
                      <Td>{null}</Td>
                    </Tr>
                  ))}
                </Fragment>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}