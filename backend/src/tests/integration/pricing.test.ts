import { describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import pricingRoutes from '../../routes/pricing.routes.js';

const app = express();
app.use(express.json());
app.use('/api/pricing', pricingRoutes);

describe('Pricing Endpoints - Pruebas de Integración (Supertest)', () => {
  it('GET /api/pricing debe retornar status 200 y la estructura de tarifas dinámica', async () => {
    const response = await request(app).get('/api/pricing');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('ok', true);
    expect(response.body.data).toHaveProperty('pricing');
    expect(response.body.data).toHaveProperty('addons');
    expect(Array.isArray(response.body.data.addons)).toBe(true);
  });

  it('GET /api/pricing/admin/servicios debe rechazar con status 401 si no hay token de autenticación', async () => {
    const response = await request(app).get('/api/pricing/admin/servicios');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body.error).toBe('Token no proporcionado');
  });

  it('POST /api/pricing/admin/servicios debe rechazar con status 401 para usuarios no autenticados', async () => {
    const response = await request(app)
      .post('/api/pricing/admin/servicios')
      .send({
        clave: 'servicio_prueba',
        nombre: 'Servicio Prueba',
        etiquetaTamanio: 'Tamaño',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
  });
});

