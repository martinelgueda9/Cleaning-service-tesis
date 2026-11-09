import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Rol } from '@prisma/client';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: Rol;
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.activo) {
    throw new Error('Credenciales incorrectas');
  }

  const valid = await bcrypt.compare(password, usuario.password);
  if (!valid) {
    throw new Error('Credenciales incorrectas');
  }

  const token = jwt.sign(
    { userId: usuario.id, email: usuario.email, rol: usuario.rol },
    env.jwtSecret,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}

export async function getMe(userId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      clienteId: true,
    },
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  return usuario;
}

export async function register(data: {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
}) {
  const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('Ya existe un usuario con ese correo electrónico');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const cliente = await prisma.cliente.create({
    data: {
      nombre: data.nombre,
      telefono: data.telefono || 'Sin teléfono',
      direccion: data.direccion || 'Por confirmar',
      email: data.email,
    },
  });

  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      rol: Rol.CLIENTE,
      clienteId: cliente.id,
    },
  });

  const token = jwt.sign(
    { userId: usuario.id, email: usuario.email, rol: usuario.rol },
    env.jwtSecret,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}
