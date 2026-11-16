import { describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import ventasRoutes from '../../routes/ventas.routes.js';
import clientesRoutes from '../../routes/clientes.routes.js';

const app = express();
app.use(express.json());
app.use('/api/ventas', ventasRoutes);
app.use('/api/clientes', clientesRoutes);

describe('Ventas Endpoints - Pruebas de Integración (Supertest)', () => {
  it('GET /api/ventas debe rechazar con 401 sin token', async () => {
    const response = await request(app).get('/api/ventas');
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body.error).toBe('Token no proporcionado');
  });

  it('GET /api/ventas/resumen y /export requieren autenticación', async () => {
    expect((await request(app).get('/api/ventas/resumen')).statusCode).toBe(401);
    expect((await request(app).get('/api/ventas/export')).statusCode).toBe(401);
  });

  it('POST /api/ventas debe rechazar la creación sin token administrativo', async () => {
    const response = await request(app).post('/api/ventas').send({
      nombreCliente: 'Test',
      telefonoCliente: '3205550000',
      tipoLimpieza: 'ESTANDAR',
      fechaServicio: '2026-11-20',
      montoCotizado: 150,
    });
    expect(response.statusCode).toBe(401);
  });

  it('PATCH /api/ventas/:id/pago y /anular rechazan con token inválido', async () => {
    const pago = await request(app)
      .patch('/api/ventas/123/pago')
      .set('Authorization', 'Bearer token-falso')
      .send({ montoFinal: 100, metodoPago: 'ZELLE', fechaPago: '2026-11-20' });
    expect(pago.statusCode).toBe(401);
    expect(pago.body.error).toBe('Token inválido o expirado');

    const anular = await request(app).patch('/api/ventas/123/anular').set('Authorization', 'Bearer token-falso');
    expect(anular.statusCode).toBe(401);
  });

  it('GET /api/clientes/crm requiere autenticación', async () => {
    const response = await request(app).get('/api/clientes/crm');
    expect(response.statusCode).toBe(401);
  });
});
