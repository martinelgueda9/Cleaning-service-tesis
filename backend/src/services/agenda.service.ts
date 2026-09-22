import prisma from '../config/db.js';

function generateCodigo(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CIT-${rand}`;
}

async function checkScheduleConflict(
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

export async function findAll(filters?: { desde?: string; hasta?: string }) {
  const where: Record<string, unknown> = {};

  if (filters?.desde || filters?.hasta) {
    where.fechaServicio = {};
    if (filters.desde) (where.fechaServicio as Record<string, unknown>).gte = new Date(filters.desde);
    if (filters.hasta) (where.fechaServicio as Record<string, unknown>).lte = new Date(filters.hasta);
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

export async function create(data: {
  clienteId: string;
  cotizacionId?: string;
  fechaServicio: string;
  horaInicio: string;
  horaFin: string;
  personalAsignado?: string;
  direccionServicio: string;
  notas?: string;
}) {
  const fechaServicio = new Date(data.fechaServicio);

  const hasConflict = await checkScheduleConflict(
    fechaServicio,
    data.horaInicio,
    data.horaFin
  );

  if (hasConflict) {
    throw new Error(
      `Conflicto de horario: ya existe una cita programada en la fecha ${data.fechaServicio} ` +
      `que se solapa con el horario ${data.horaInicio} - ${data.horaFin}`
    );
  }

  return prisma.cita.create({
    data: {
      codigo: generateCodigo(),
      clienteId: data.clienteId,
      cotizacionId: data.cotizacionId,
      fechaServicio,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      personalAsignado: data.personalAsignado,
      direccionServicio: data.direccionServicio,
      notas: data.notas,
    },
    include: { cliente: true },
  });
}

export async function update(id: string, data: {
  fechaServicio?: string;
  horaInicio?: string;
  horaFin?: string;
  personalAsignado?: string;
  direccionServicio?: string;
  notas?: string;
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
        `Conflicto de horario: ya existe una cita programada que se solapa ` +
        `con el horario ${horaInicio} - ${horaFin}`
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

export async function remove(id: string) {
  return prisma.cita.delete({ where: { id } });
}
