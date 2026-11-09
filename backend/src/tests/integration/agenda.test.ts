import { describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import agendaRoutes from '../../routes/agenda.routes.js';

const app = express();
app.use(express.json());
app.use('/api/agenda', agendaRoutes);

describe('Agenda Endpoints - Pruebas de Integración (Supertest)', () => {
  it('GET /api/agenda/mis-citas debe rechazar con status 401 si no se envía token', async () => {
    const response = await request(app).get('/api/agenda/mis-citas');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
    expect(response.body.error).toBe('Token no proporcionado');
  });

  it('GET /api/agenda debe rechazar con status 401 si no se cuenta con rol PROPIETARIA autenticado', async () => {
    const response = await request(app).get('/api/agenda');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
  });

  it('POST /api/agenda debe rechazar la creación de citas directas sin token administrativo', async () => {
    const response = await request(app)
      .post('/api/agenda')
      .send({
        fechaServicio: '2026-11-20T10:00:00.000Z',
        horaInicio: '09:00',
        horaFin: '11:00',
        direccionServicio: '123 Main St',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('ok', false);
  });
});

