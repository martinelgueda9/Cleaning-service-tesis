import { describe, expect, it } from 'vitest';
import { clienteCreateSchema, clienteUpdateSchema } from '../../schemas/index.js';

describe('Cliente Schema - clienteCreateSchema y clienteUpdateSchema (Pruebas Unitarias)', () => {
  it('debe validar y normalizar un cliente con todos los campos obligatorios', () => {
    const input = {
      nombre: '  Carlos Mendoza  ',
      email: 'carlos.mendoza@example.com',
      telefono: '3201234567',
      direccion: '123 4th Ave S',
      ciudad: 'Saint Cloud',
      estadoRegion: 'MN',
      codigoPostal: '56301',
    };

    const result = clienteCreateSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Carlos Mendoza');
      expect(result.data.telefono).toBe('3201234567');
      expect(result.data.direccion).toBe('123 4th Ave S');
      expect(result.data.email).toBe('carlos.mendoza@example.com');
    }
  });

  it('debe rechazar si falta el nombre o el teléfono', () => {
    const inputSinNombre = {
      nombre: '',
      telefono: '3201234567',
      direccion: '123 4th Ave S',
    };

    const result = clienteCreateSchema.safeParse(inputSinNombre);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('El nombre es requerido'))).toBe(true);
    }
  });

  it('debe rechazar si el formato del correo es inválido', () => {
    const inputEmailInvalido = {
      nombre: 'Carlos',
      email: 'correo_sin_arroba_ni_dominio',
      telefono: '3201234567',
      direccion: '123 4th Ave S',
    };

    const result = clienteCreateSchema.safeParse(inputEmailInvalido);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Correo inválido'))).toBe(true);
    }
  });

  it('debe permitir actualizaciones parciales mediante clienteUpdateSchema', () => {
    const updateInput = {
      telefono: '3209998888',
      direccion: 'Nueva Dirección 789',
    };

    const result = clienteUpdateSchema.safeParse(updateInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telefono).toBe('3209998888');
      expect(result.data.direccion).toBe('Nueva Dirección 789');
      expect(result.data.nombre).toBeUndefined();
    }
  });
});

