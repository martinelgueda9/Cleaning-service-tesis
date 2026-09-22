import { Router } from 'express';
import authRoutes from './auth.routes.js';
import clientesRoutes from './clientes.routes.js';
import cotizacionRoutes from './cotizacion.routes.js';
import agendaRoutes from './agenda.routes.js';
import contactRoutes from './contact.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);
router.use('/cotizaciones', cotizacionRoutes);
router.use('/agenda', agendaRoutes);
router.use('/contact', contactRoutes);

export default router;

