import prisma from '../config/db.js';
import { EstadoCita } from '@prisma/client';

function generateCodigo(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CIT-${rand}`;
}

export async function checkScheduleConflict(
  fechaServicio: Date,
  horaInicio: string,
  horaFin: string,
  excludeId?: string
): Promise<boolean> {

  const startOfDay = new Date(fechaServicio);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(fechaServicio);
  endOfDay.setHours(23, 59, 59, 999);

  const existingCitas = await prisma.cita.findMany({
    where: {
      fechaServicio: {
        gte: startOfDay,
        lte: endOfDay,
      },
      estadoCita: { not: 'CANCELADA' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  for (const cita of existingCitas) {

    if (horaInicio < cita.horaFin && horaFin > cita.horaInicio) {
      return true;
    }
  }

  return false;
}

export async function findAll(filters?: { desde?: string; hasta?: string; estado?: EstadoCita }) {
  const where: Record<string, unknown> = {};

  if (filters?.desde || filters?.hasta) {
    where.fechaServicio = {};
    if (filters.desde) (where.fechaServicio as Record<string, unknown>).gte = new Date(filters.desde);
    if (filters.hasta) (where.fechaServicio as Record<string, unknown>).lte = new Date(filters.hasta);
  }

  if (filters?.estado) {
    where.estadoCita = filters.estado;
  }

  return prisma.cita.findMany({
    where,
    orderBy: { fechaServicio: 'asc' },
    include: { cliente: true, cotizacion: true },
  });
}

export async function findById(id: string) {
  return prisma.cita.findUnique({
    where: { id },
    include: { cliente: true, cotizacion: true },
  });
}

export async function findByClienteId(clienteId: string) {
  return prisma.cita.findMany({
    where: { clienteId },
    orderBy: { fechaServicio: 'desc' },
    include: { cotizacion: true },
  });
}

export async function create(data: {
  clienteId?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  emailCliente?: string;
  tipoLimpieza?: any;
  totalEstimado?: number;
  cotizacionId?: string;
  fechaServicio: string;
  horaInicio: string;
  horaFin: string;
  personalAsignado?: string;
  direccionServicio: string;
  notas?: string;
}) {
  let clienteId = data.clienteId;

  if (!clienteId && data.nombreCliente && data.telefonoCliente) {
    let existingCliente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { telefono: data.telefonoCliente },
          ...(data.emailCliente ? [{ email: data.emailCliente }] : []),
        ],
      },
    });

    if (!existingCliente) {
      existingCliente = await prisma.cliente.create({
        data: {
          nombre: data.nombreCliente,
          telefono: data.telefonoCliente,
          email: data.emailCliente || undefined,
          direccion: data.direccionServicio,
          ciudad: 'Saint Cloud',
          estadoRegion: 'MN',
        },
      });
    }
    clienteId = existingCliente.id;
  }

  if (!clienteId) {
    throw new Error('Se requiere un clienteId o bien el nombre y teléfono del cliente');
  }

  let cotizacionId = data.cotizacionId;

  if (!cotizacionId && data.tipoLimpieza) {
    const nuevaCot = await prisma.cotizacion.create({
      data: {
        codigo: `COT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        clienteId,
        tipoLimpieza: data.tipoLimpieza,
        totalEstimado: data.totalEstimado || 0,
        estado: 'ACEPTADA',
        notas: data.notas || 'Cita creada manualmente (WhatsApp/Teléfono)',
      },
    });
    cotizacionId = nuevaCot.id;
  }

  const fechaServicio = new Date(data.fechaServicio);

  const hasConflict = await checkScheduleConflict(
    fechaServicio,
    data.horaInicio,
    data.horaFin
  );

  if (hasConflict) {
    throw new Error(
      `Schedule conflict: An appointment already exists on ${data.fechaServicio} ` +
      `that overlaps with the requested time ${data.horaInicio} - ${data.horaFin}`
    );
  }

  return prisma.cita.create({
    data: {
      codigo: generateCodigo(),
      clienteId,
      cotizacionId,
      fechaServicio,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      personalAsignado: data.personalAsignado,
      direccionServicio: data.direccionServicio,
      notas: data.notas,
      estadoCita: 'PROGRAMADA',
    },
    include: { cliente: true, cotizacion: true },
  });
}

export async function update(id: string, data: {
  fechaServicio?: string;
  horaInicio?: string;
  horaFin?: string;
  personalAsignado?: string;
  direccionServicio?: string;
  notas?: string;
  estadoCita?: EstadoCita;
}) {

  if (data.fechaServicio || data.horaInicio || data.horaFin) {
    const existing = await prisma.cita.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Cita no encontrada');
    }

    const fechaServicio = data.fechaServicio ? new Date(data.fechaServicio) : existing.fechaServicio;
    const horaInicio = data.horaInicio || existing.horaInicio;
    const horaFin = data.horaFin || existing.horaFin;

    const hasConflict = await checkScheduleConflict(fechaServicio, horaInicio, horaFin, id);

    if (hasConflict) {
      throw new Error(
        `Schedule conflict: An appointment already exists that overlaps ` +
        `with the requested time ${horaInicio} - ${horaFin}`
      );
    }
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.fechaServicio) {
    updateData.fechaServicio = new Date(data.fechaServicio);
  }
  return prisma.cita.update({
    where: { id },
    data: updateData,
    include: { cliente: true },
  });
}

export async function updateEstado(id: string, estadoCita: EstadoCita) {
  return prisma.cita.update({
    where: { id },
    data: { estadoCita },
    include: { cliente: true, cotizacion: true },
  });
}

export async function remove(id: string) {
  return prisma.cita.delete({ where: { id } });
}
