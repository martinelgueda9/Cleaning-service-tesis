import { describe, expect, it } from 'vitest';
import {
  ventaCreateSchema,
  ventaPagoSchema,
  ventaUpdateSchema,
} from '../../schemas/index.js';
import { monthRange } from '../../services/ventas.service.js';

describe('Venta Schemas (Pruebas Unitarias)', () => {
  it('acepta una venta manual con cliente nuevo (nombre y teléfono)', () => {
    const result = ventaCreateSchema.safeParse({
      nombreCliente: '  Sarah Johnson ',
      telefonoCliente: '3205550199',
      tipoLimpieza: 'PROFUNDA',
      fechaServicio: '2026-11-14',
      montoCotizado: 180,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nombreCliente).toBe('Sarah Johnson');
  });

  it('rechaza la venta si no hay cliente', () => {
    const result = ventaCreateSchema.safeParse({
      tipoLimpieza: 'ESTANDAR',
      fechaServicio: '2026-11-14',
      montoCotizado: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza montos negativos y fechas inválidas', () => {
    const base = { clienteId: '8b2f5f4e-3c1a-4d2b-9a8e-1f2e3d4c5b6a', tipoLimpieza: 'ESTANDAR' };
    expect(ventaCreateSchema.safeParse({ ...base, fechaServicio: '2026-11-14', montoCotizado: -5 }).success).toBe(false);
    expect(ventaCreateSchema.safeParse({ ...base, fechaServicio: 'mañana', montoCotizado: 50 }).success).toBe(false);
  });

  it('exige método de pago cuando la venta se registra ya pagada', () => {
    const base = {
      clienteId: '8b2f5f4e-3c1a-4d2b-9a8e-1f2e3d4c5b6a',
      tipoLimpieza: 'ESTANDAR',
      fechaServicio: '2026-11-14',
      montoCotizado: 120,
      pagado: true,
    };
    expect(ventaCreateSchema.safeParse(base).success).toBe(false);
    expect(ventaCreateSchema.safeParse({ ...base, metodoPago: 'ZELLE' }).success).toBe(true);
  });

  it('el pago requiere monto final, método válido y fecha', () => {
    expect(ventaPagoSchema.safeParse({ montoFinal: 200, metodoPago: 'EFECTIVO', fechaPago: '2026-11-15' }).success).toBe(true);
    expect(ventaPagoSchema.safeParse({ montoFinal: 200, metodoPago: 'BITCOIN', fechaPago: '2026-11-15' }).success).toBe(false);
    expect(ventaPagoSchema.safeParse({ metodoPago: 'EFECTIVO', fechaPago: '2026-11-15' }).success).toBe(false);
  });

  it('la edición permite cambios parciales y borrar el monto final', () => {
    expect(ventaUpdateSchema.safeParse({ notas: 'Cliente pidió factura' }).success).toBe(true);
    expect(ventaUpdateSchema.safeParse({ montoFinal: null }).success).toBe(true);
  });
});

describe('monthRange (Pruebas Unitarias)', () => {
  it('devuelve el rango [inicio, fin) del mes en UTC', () => {
    const { gte, lt } = monthRange('2026-11');
    expect(gte.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(lt.toISOString()).toBe('2026-12-01T00:00:00.000Z');
  });

  it('cruza correctamente el cambio de año', () => {
    expect(monthRange('2026-12').lt.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('rechaza meses inválidos', () => {
    expect(() => monthRange('2026-13')).toThrow();
    expect(() => monthRange('noviembre')).toThrow();
  });
});
