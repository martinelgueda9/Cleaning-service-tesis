import prisma from '../config/db.js';
import { TipoLimpieza, EstadoCotizacion } from '@prisma/client';
import * as pricingService from './pricing.service.js';
import { checkScheduleConflict } from './agenda.service.js';

function generateCodigo(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `COT-${rand}`;
}

function generateCitaCodigo(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CIT-${rand}`;
}

const SERVICE_MAP: Record<string, TipoLimpieza> = {
  regular_cleaning: 'ESTANDAR',
  commercial_cleaning: 'OFICINA',
  deep_cleaning: 'PROFUNDA',
  move_in_cleaning: 'MUDANZA_ENTRADA',
  move_out_cleaning: 'MUDANZA_SALIDA',
  ESTANDAR: 'ESTANDAR',
  OFICINA: 'OFICINA',
  PROFUNDA: 'PROFUNDA',
  MUDANZA_SALIDA: 'MUDANZA_SALIDA',
  MUDANZA_ENTRADA: 'MUDANZA_ENTRADA',
  POST_CONSTRUCCION: 'POST_CONSTRUCCION',
};

const SERVICE_KEY_MAP: Record<string, string> = {
  regular_cleaning: 'standard',
  deep_cleaning: 'deep',
  move_in_cleaning: 'movein',
  move_out_cleaning: 'moveout',
};

const LOCAL_CITIES = [
  'st. cloud',
  'st cloud',
  'saint cloud',
  'sartell',
  'sauk rapids',
  'waite park',
  'st. joseph',
  'st joseph',
  'saint joseph',
  'st. augusta',
  'st augusta',
  'saint augusta',
];

const LOCAL_ZIPS = [
  '56301',
  '56302',
  '56303',
  '56304',
  '56377',
  '56379',
  '56387',
  '56374',
  '56372',
  '56388',
  '56395',
];

const EXTENDED_CITIES = [
  'cold spring',
  'avon',
  'albany',
  'rice',
  'foley',
  'clearwater',
  'rockville',
  'kimball',
  'becker',
  'clear lake',
];

const EXTENDED_ZIPS = [
  '56320',
  '56310',
  '56307',
  '56367',
  '56329',
  '55320',
  '56369',
  '55353',
  '55308',
  '55319',
];

export function analyzeZoneAndCity(
  address?: string | null,
  city?: string | null
): {
  zona: 'local' | 'extended' | 'out_of_zone';
  zonaLabel: string;
  ciudadReal: string | null;
} {
  const fullText = `${address || ''} ${city && city !== 'Saint Cloud' ? city : ''}`.toLowerCase();

  const isLocal =
    LOCAL_CITIES.some((c) => fullText.includes(c)) ||
    LOCAL_ZIPS.some((z) => fullText.includes(z));

  const isExtended =
    EXTENDED_CITIES.some((c) => fullText.includes(c)) ||
    EXTENDED_ZIPS.some((z) => fullText.includes(z));

  let zona: 'local' | 'extended' | 'out_of_zone' = 'out_of_zone';
  let zonaLabel = 'Fuera de zona';

  if (isLocal) {
    zona = 'local';
    zonaLabel = 'En zona';
  } else if (isExtended) {
    zona = 'extended';
    zonaLabel = 'Zona extendida';
  }

  let ciudadReal: string | null = null;
  for (const c of [...LOCAL_CITIES, ...EXTENDED_CITIES]) {
    if (fullText.includes(c)) {
      ciudadReal = c.replace(/\b\w/g, (l) => l.toUpperCase());
      break;
    }
  }

  return { zona, zonaLabel, ciudadReal };
}

export function parseCotizacionMetadata(c: any) {
  let fechaPreferida: string | null = null;
  let horaPreferida: string | null = null;
  let tamanio: string | null = null;
  let frecuencia: string | null = null;
  let notasCliente: string = '';

  if (c.notas) {

    const fechaMatch = c.notas.match(
      /(?:\[Fecha preferida:\s*|Fecha preferida:\s*)([^\s|\])]+)(?:\s*\(([^)]*)\))?/i
    );
    if (fechaMatch) {
      fechaPreferida = fechaMatch[1].trim();
      const rawTime = (fechaMatch[2] || '').trim();
      horaPreferida = rawTime && rawTime !== '()' ? rawTime : null;
    }

    const tamanioMatch = c.notas.match(/(?:\[Tamaño:\s*|Tamaño:\s*)([^|\]]+)/i);
    if (tamanioMatch) {
      tamanio = tamanioMatch[1].trim();
    } else if (c.numHabitaciones || c.numBanos) {
      tamanio = `${c.numHabitaciones} bed / ${c.numBanos} bath`;
    }

    const freqMatch = c.notas.match(/(?:\[Frecuencia:\s*|Frecuencia:\s*)([^|\]]+)/i);
    if (freqMatch) {
      frecuencia = freqMatch[1].trim();
    }

    const extrasMatch = c.notas.match(/(?:\[(?:Extras?|Servicios?\s*extra):\s*([^\]]+)\]|(?:Extras?|Servicios?\s*extra):\s*([^|\]]+))/i);
    if (extrasMatch) {
      const found = (extrasMatch[1] || extrasMatch[2]).trim();
      if (found && !c.serviciosExtra) {
        c.serviciosExtra = found;
      }
    }

    notasCliente = c.notas
      .replace(/\[Frecuencia:\s*[^\]]+\]/gi, '')
      .replace(/Frecuencia:\s*[^|\]]+/gi, '')
      .replace(/\[Fecha preferida:\s*[^\]]*\]/gi, '')
      .replace(/Fecha preferida:\s*[^|\]]+/gi, '')
      .replace(/\[Tamaño:\s*[^\]]+\]/gi, '')
      .replace(/Tamaño:\s*[^|\]]+/gi, '')
      .replace(/\[(?:Extras?|Servicios?\s*extra):\s*[^\]]+\]/gi, '')
      .replace(/(?:Extras?|Servicios?\s*extra):\s*[^|\]]+/gi, '')
      .replace(/\|/g, '')
      .trim();
  } else if (c.numHabitaciones || c.numBanos) {
    tamanio = `${c.numHabitaciones} bed / ${c.numBanos} bath`;
  }

  const locationInfo = analyzeZoneAndCity(c.cliente?.direccion, c.cliente?.ciudad);

  return {
    ...c,
    fechaPreferida,
    horaPreferida,
    tamanio,
    frecuencia,
    extras: c.serviciosExtra || null,
    notasCliente: notasCliente || null,
    zona: locationInfo.zona,
    zonaLabel: locationInfo.zonaLabel,
    ciudadReal: locationInfo.ciudadReal,
  };
}

export async function findAll(filters?: { estado?: EstadoCotizacion }) {
  const where: Record<string, unknown> = {};
  if (filters?.estado) {
    where.estado = filters.estado;
  }

  const cotizaciones = await prisma.cotizacion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      cliente: true,
      revisadoPor: { select: { id: true, nombre: true, email: true } },
      citas: true,
    },
    where,
  });

  return cotizaciones.map(parseCotizacionMetadata);
}

export async function findById(id: string) {
  const c = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      cliente: true,
      citas: true,
      revisadoPor: { select: { id: true, nombre: true, email: true } },
    },
  });

  if (!c) return null;
  return parseCotizacionMetadata(c);
}

export async function findByClienteId(clienteId: string) {
  return prisma.cotizacion.findMany({
    where: { clienteId },
    orderBy: { createdAt: 'desc' },
    include: { revisadoPor: { select: { id: true, nombre: true } } },
  });
}

export async function createPublic(data: {
  serviceType: string;
  sizeId?: string;
  sizeLabel?: string;
  propertyType?: string;
  addons?: Record<string, number> | string[];
  addonLabels?: string[];
  nombre?: string;
  fullName?: string;
  email?: string;
  telefono?: string;
  phone?: string;
  direccion?: string;
  address?: string;
  notas?: string;
  notes?: string;
  frequency?: string;
  preferredDate?: string;
  preferredTime?: string;
  estimatedPrice?: string;
}) {
  const tipoLimpieza = SERVICE_MAP[data.serviceType] || 'ESTANDAR';
  const tipoPropiedad =
    data.propertyType === 'apartment' ? 'DEPARTAMENTO' : data.propertyType === 'house' ? 'CASA' : null;

  const addonsMap =
    data.addons && typeof data.addons === 'object' && !Array.isArray(data.addons)
      ? data.addons
      : undefined;

  const serviceKey = SERVICE_KEY_MAP[data.serviceType] || data.serviceType;
  const estimate = await pricingService.calculateEstimate(serviceKey, data.sizeId, addonsMap);
  const totalEstimado = estimate ? Math.round((estimate.min + estimate.max) / 2) : 0;

  const telefono = data.telefono || data.phone;
  const email = data.email;
  const nombre = data.nombre || data.fullName || 'Visitante Web';
  const direccion = data.direccion || data.address || '';
  const rawNotas = data.notas || data.notes || '';
  const frequency = data.frequency;
  const preferredDate = data.preferredDate;
  const preferredTime = data.preferredTime;
  const sizeLabel = data.sizeLabel;

  let serviciosExtraFormatted: string | null = null;
  if (Array.isArray(data.addonLabels) && data.addonLabels.length > 0) {
    serviciosExtraFormatted = data.addonLabels.join(', ');
  } else if (Array.isArray(data.addons) && data.addons.length > 0) {
    serviciosExtraFormatted = data.addons.join(', ');
  } else if (addonsMap) {
    const ADDON_LABEL_MAP: Record<string, string> = {
      inside_fridge: 'Inside fridge',
      inside_oven: 'Inside oven',
      inside_cabinets: 'Inside cabinets',
      interior_windows: 'Interior windows',
      light_organizing: 'Light organizing',
      pet_hair_removal: 'Heavy pet hair removal',
    };
    serviciosExtraFormatted = Object.entries(addonsMap)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([key, qty]) => `${ADDON_LABEL_MAP[key] || key}${Number(qty) > 1 ? ` (x${qty})` : ''}`)
      .join(', ');
  }

  let numHabitaciones = 1;
  let numBanos = 1;
  if (sizeLabel) {
    const bedMatch = sizeLabel.match(/(\d+)\s*bed/i);
    const bathMatch = sizeLabel.match(/(\d+)\s*bath/i);
    if (bedMatch) numHabitaciones = parseInt(bedMatch[1], 10);
    if (bathMatch) numBanos = parseInt(bathMatch[1], 10);
  }

  const locationInfo = analyzeZoneAndCity(direccion, null);
  const ciudadReal = locationInfo.ciudadReal || '';

  let cliente = null;
  if (telefono) {
    cliente = await prisma.cliente.findFirst({ where: { telefono } });
  }
  if (!cliente && email) {
    cliente = await prisma.cliente.findFirst({ where: { email } });
  }

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono: telefono || 'Sin teléfono',
        direccion: direccion || 'Por confirmar',
        ciudad: ciudadReal,
        estadoRegion: 'MN',
        email: email || undefined,
      },
    });
  } else if (direccion && direccion !== cliente.direccion) {
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        direccion,
        ciudad: ciudadReal || cliente.ciudad,
      },
    });
  }

  const metaParts: string[] = [];
  if (preferredDate) {
    const timeClean =
      preferredTime && preferredTime.trim() !== '()' ? ` (${preferredTime.trim()})` : '';
    metaParts.push(`Fecha preferida: ${preferredDate}${timeClean}`);
  }
  if (sizeLabel) {
    metaParts.push(`Tamaño: ${sizeLabel}`);
  }
  if (frequency) {
    metaParts.push(`Frecuencia: ${frequency}`);
  }
  if (rawNotas.trim()) {
    metaParts.push(rawNotas.trim());
  }

  const notasFinales = metaParts.length > 0 ? metaParts.join(' | ') : undefined;

  return prisma.cotizacion.create({
    data: {
      codigo: generateCodigo(),
      clienteId: cliente.id,
      tipoLimpieza,
      tipoPropiedad,
      numHabitaciones,
      numBanos,
      serviciosExtra: serviciosExtraFormatted,
      totalEstimado,
      notas: notasFinales,
      estado: 'PENDIENTE',
    },
    include: { cliente: true },
  });
}

export async function createAdmin(data: {
  clienteId: string;
  tipoLimpieza: TipoLimpieza;
  numHabitaciones?: number;
  numBanos?: number;
  piesCuadrados?: number;
  tieneMascotas?: boolean;
  serviciosExtra?: string;
  totalEstimado: number;
  notas?: string;
}) {
  return prisma.cotizacion.create({
    data: {
      codigo: generateCodigo(),
      ...data,
      estado: 'PENDIENTE',
    },
    include: { cliente: true },
  });
}

export async function revisar(
  id: string,
  accion: 'aceptar' | 'rechazar',
  revisadoPorId: string,
  motivo?: string,
  citaData?: {
    fechaServicio: string;
    horaInicio: string;
    horaFin: string;
    direccionServicio?: string;
    personalAsignado?: string;
    notas?: string;
  }
) {
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    include: { cliente: true },
  });

  if (!cotizacion) {
    throw new Error('Cotización no encontrada');
  }

  if (cotizacion.estado !== 'PENDIENTE') {
    throw new Error(`Esta cotización ya fue ${cotizacion.estado.toLowerCase()}`);
  }

  const estado: EstadoCotizacion = accion === 'aceptar' ? 'ACEPTADA' : 'RECHAZADA';
  const crearCita = accion === 'aceptar' && !!citaData && !!citaData.fechaServicio;

  const fechaServicio = crearCita ? new Date(citaData!.fechaServicio) : null;
  const horaInicio = citaData?.horaInicio || '09:00';
  const horaFin = citaData?.horaFin || '12:00';

  if (crearCita && fechaServicio) {
    if (horaInicio >= horaFin) {
      throw new Error('End time must be after start time');
    }

    const hasConflict = await checkScheduleConflict(fechaServicio, horaInicio, horaFin);
    if (hasConflict) {
      throw new Error(
        `Schedule conflict: An appointment already exists on that date that overlaps with the requested time ` +
          `${horaInicio} - ${horaFin}. Please choose a different time slot.`
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedCotizacion = await tx.cotizacion.update({
      where: { id },
      data: {
        estado,
        motivoRechazo: accion === 'rechazar' ? (motivo || null) : null,
        fechaRevision: new Date(),
        revisadoPorId,
      },
      include: {
        cliente: true,
        revisadoPor: { select: { id: true, nombre: true, email: true } },
        citas: true,
      },
    });

    let createdCita = null;
    if (crearCita && fechaServicio) {
      createdCita = await tx.cita.create({
        data: {
          codigo: generateCitaCodigo(),
          clienteId: cotizacion.clienteId,
          cotizacionId: cotizacion.id,
          fechaServicio,
          horaInicio,
          horaFin,
          direccionServicio:
            citaData!.direccionServicio || cotizacion.cliente.direccion || 'St. Cloud, MN',
          personalAsignado: citaData!.personalAsignado || undefined,
          notas: citaData!.notas || undefined,
          estadoCita: 'PROGRAMADA',
        },
        include: {
          cliente: true,
          cotizacion: true,
        },
      });
    }

    return {
      ...updatedCotizacion,
      citaCreada: createdCita,
    };
  });
}

export async function remove(id: string) {
  return prisma.cotizacion.delete({ where: { id } });
}
