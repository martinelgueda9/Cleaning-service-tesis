import { describe, expect, it } from 'vitest';
import { cotizacionPublicSchema, cotizacionAdminSchema } from '../../schemas/index.js';

describe('Cotización Schemas - cotizacionPublicSchema y cotizacionAdminSchema (Pruebas Unitarias)', () => {
  it('debe aceptar una cotización pública con tipo de servicio válido y datos básicos', () => {
    const input = {
      serviceType: 'regular_cleaning',
      sizeId: '2bed_1bath',
      fullName: 'María Gómez',
      phone: '3205551234',
      email: 'maria@example.com',
      address: '742 Evergreen Terrace',
      frequency: 'one-time',
    };

    const result = cotizacionPublicSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceType).toBe('regular_cleaning');
      expect(result.data.fullName).toBe('María Gómez');
    }
  });

  it('debe rechazar una cotización pública con un serviceType desconocido', () => {
    const input = {
      serviceType: 'servicio_inexistente',
      fullName: 'María Gómez',
      phone: '3205551234',
    };

    const result = cotizacionPublicSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Tipo de servicio inválido'))).toBe(true);
    }
  });

  it('debe validar cotizacionAdminSchema exigiendo clienteId como UUID y totalEstimado positivo', () => {
    const validUuid = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

    const inputValido = {
      clienteId: validUuid,
      tipoLimpieza: 'ESTANDAR',
      numHabitaciones: 3,
      numBanos: 2,
      totalEstimado: 210,
    };

    const result = cotizacionAdminSchema.safeParse(inputValido);
    expect(result.success).toBe(true);

    const inputIdInvalido = {
      clienteId: 'id-no-uuid',
      tipoLimpieza: 'ESTANDAR',
      totalEstimado: 150,
    };

    const resultInvalido = cotizacionAdminSchema.safeParse(inputIdInvalido);
    expect(resultInvalido.success).toBe(false);
  });

  describe('propertyType (Apartment / House)', () => {
    const base = { serviceType: 'regular_cleaning', sizeId: '2bed_1bath', fullName: 'María Gómez', phone: '3205551234' };

    it('debe aceptar propertyType válido ("apartment" y "house")', () => {
      for (const propertyType of ['apartment', 'house']) {
        const result = cotizacionPublicSchema.safeParse({ ...base, propertyType });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.propertyType).toBe(propertyType);
      }
    });

    it('debe rechazar un propertyType inválido', () => {
      for (const propertyType of ['condo', 'DEPARTAMENTO', '', 1]) {
        const result = cotizacionPublicSchema.safeParse({ ...base, propertyType });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((i) => i.path.includes('propertyType'))).toBe(true);
        }
      }
    });

    it('debe aceptar la cotización cuando propertyType no viene (es opcional)', () => {
      const result = cotizacionPublicSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.propertyType).toBeUndefined();
    });
  });
});
