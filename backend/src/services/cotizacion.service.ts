import prisma from '../config/db.js';
import { TipoLimpieza } from '@prisma/client';
import { calculateEstimate } from '../data/pricing.js';

function generateCodigo(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `COT-${rand}`;
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

export async function findAll() {
  return prisma.cotizacion.findMany({
    orderBy: { createdAt: 'desc' },
    include: { cliente: true },
  });
}

export async function findById(id: string) {
  return prisma.cotizacion.findUnique({
    where: { id },
    include: { cliente: true, citas: true },
  });
}

export async function createPublic(data: {
  serviceType: string;
  sizeId?: string;
  addons?: Record<string, number>;
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
}) {
  const tipoLimpieza = SERVICE_MAP[data.serviceType] || 'ESTANDAR';

  const addonsMap = (data.addons && typeof data.addons === 'object' && !Array.isArray(data.addons))
    ? data.addons
    : undefined;

  const estimate = calculateEstimate(data.serviceType, data.sizeId, addonsMap);
  
  const totalEstimado = estimate ? Math.round((estimate.min + estimate.max) / 2) : 0;

  const telefono = data.telefono || data.phone;
  const email = data.email;
  const nombre = data.nombre || data.fullName || 'Visitante Web';
  const direccion = data.direccion || data.address || 'Por confirmar';
  const notas = data.notas || data.notes;
  const frequency = data.frequency;

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
        direccion,
        email: email || undefined,
      },
    });
  }

  const notasParts: string[] = [];
  if (frequency) notasParts.push(`[Frecuencia: ${frequency}]`);
  if (notas) notasParts.push(notas);
  const notasFinales = notasParts.length > 0 ? notasParts.join(' ') : undefined;

  return prisma.cotizacion.create({
    data: {
      codigo: generateCodigo(),
      clienteId: cliente.id,
      tipoLimpieza,
      totalEstimado,
      notas: notasFinales,
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
    },
    include: { cliente: true },
  });
}

export async function remove(id: string) {
  return prisma.cotizacion.delete({ where: { id } });
}
