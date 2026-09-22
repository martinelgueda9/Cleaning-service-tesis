import prisma from '../config/db.js';

export async function findAll() {
  return prisma.cliente.findMany({
    orderBy: { createdAt: 'desc' },
    include: { cotizaciones: true, citas: true },
  });
}

export async function findById(id: string) {
  return prisma.cliente.findUnique({
    where: { id },
    include: { cotizaciones: true, citas: true },
  });
}

export async function search(query: string) {
  return prisma.cliente.findMany({
    where: {
      OR: [
        { nombre: { contains: query, mode: 'insensitive' } },
        { telefono: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function create(data: {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  direccion: string;
  ciudad?: string;
  estadoRegion?: string;
  codigoPostal?: string;
  notas?: string;
}) {
  return prisma.cliente.create({ data });
}

export async function update(id: string, data: {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  estadoRegion?: string;
  codigoPostal?: string;
  notas?: string;
}) {
  return prisma.cliente.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.cliente.delete({ where: { id } });
}
