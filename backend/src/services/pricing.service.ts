import prisma from '../config/db.js';

export async function findAllActive() {
  const servicios = await prisma.servicioTipo.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    include: {
      opciones: {
        orderBy: { orden: 'asc' },
      },
    },
  });

  return servicios;
}

export async function findAllAddons() {
  return prisma.addonServicio.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });
}

export async function getFullPricing() {
  const [servicios, addons] = await Promise.all([
    findAllActive(),
    findAllAddons(),
  ]);

  const pricing: Record<string, { sizeLabel: string; options: Array<{ id: string; label: string; basePrice: number | null }> }> = {};

  for (const svc of servicios) {
    pricing[svc.clave] = {
      sizeLabel: svc.etiquetaTamanio,
      options: svc.opciones.map((opt) => ({
        id: opt.clave,
        label: opt.etiqueta,
        basePrice: opt.precioBase,
      })),
    };
  }

  const addonsFormatted = addons.map((a) => ({
    id: a.clave,
    label: a.etiqueta,
    min: a.precioMin,
    max: a.precioMax,
    unit: a.unidad,
  }));

  return { pricing, addons: addonsFormatted };
}

export async function calculateEstimate(
  serviceKey: string,
  sizeId?: string,
  addonsMap?: Record<string, number>
): Promise<{ min: number; max: number } | null> {
  const servicio = await prisma.servicioTipo.findUnique({
    where: { clave: serviceKey },
    include: { opciones: true },
  });

  if (!servicio || !sizeId) return null;

  const sizeOption = servicio.opciones.find((opt) => opt.clave === sizeId);
  if (!sizeOption || sizeOption.precioBase === null) return null;

  let min = sizeOption.precioBase;
  let max = sizeOption.precioBase;

  if (addonsMap && typeof addonsMap === 'object' && !Array.isArray(addonsMap)) {
    const addonKeys = Object.keys(addonsMap);
    if (addonKeys.length > 0) {
      const dbAddons = await prisma.addonServicio.findMany({
        where: { clave: { in: addonKeys } },
      });

      for (const [addonId, quantity] of Object.entries(addonsMap)) {
        if (quantity > 0) {
          const addon = dbAddons.find((a) => a.clave === addonId);
          if (addon) {
            min += addon.precioMin * quantity;
            max += addon.precioMax * quantity;
          }
        }
      }
    }
  }

  return { min, max };
}

export async function findAllServices() {
  return prisma.servicioTipo.findMany({
    orderBy: { orden: 'asc' },
    include: { opciones: { orderBy: { orden: 'asc' } } },
  });
}

export async function createService(data: {
  clave: string;
  nombre: string;
  etiquetaTamanio: string;
  orden?: number;
}) {
  return prisma.servicioTipo.create({ data });
}

export async function updateService(id: string, data: {
  nombre?: string;
  etiquetaTamanio?: string;
  activo?: boolean;
  orden?: number;
}) {
  return prisma.servicioTipo.update({ where: { id }, data });
}

export async function deleteService(id: string) {
  return prisma.servicioTipo.delete({ where: { id } });
}

export async function createSizeOption(data: {
  servicioTipoId: string;
  clave: string;
  etiqueta: string;
  precioBase: number | null;
  orden?: number;
}) {
  return prisma.opcionTamanio.create({ data });
}

export async function updateSizeOption(id: string, data: {
  etiqueta?: string;
  precioBase?: number | null;
  orden?: number;
}) {
  return prisma.opcionTamanio.update({ where: { id }, data });
}

export async function deleteSizeOption(id: string) {
  return prisma.opcionTamanio.delete({ where: { id } });
}

export async function findAllAddonsAdmin() {
  return prisma.addonServicio.findMany({ orderBy: { orden: 'asc' } });
}

export async function createAddon(data: {
  clave: string;
  etiqueta: string;
  precioMin: number;
  precioMax: number;
  unidad: string;
  orden?: number;
}) {
  return prisma.addonServicio.create({ data });
}

export async function updateAddon(id: string, data: {
  etiqueta?: string;
  precioMin?: number;
  precioMax?: number;
  unidad?: string;
  activo?: boolean;
  orden?: number;
}) {
  return prisma.addonServicio.update({ where: { id }, data });
}

export async function deleteAddon(id: string) {
  return prisma.addonServicio.delete({ where: { id } });
}
