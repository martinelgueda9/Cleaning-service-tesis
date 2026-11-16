import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { clienteCreateSchema, clienteUpdateSchema } from '../schemas/index.js';
import * as clientesController from '../controllers/clientes.controller.js';
import * as ventasController from '../controllers/ventas.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/crm', requireRole('PROPIETARIA'), ventasController.getClientesCrm);
router.get('/:id/historial', requireRole('PROPIETARIA'), ventasController.getClienteHistorial);

router.get('/', clientesController.getAll);
router.get('/:id', clientesController.getById);
router.post('/', validateBody(clienteCreateSchema), clientesController.create);
router.put('/:id', validateBody(clienteUpdateSchema), clientesController.update);
router.delete('/:id', clientesController.remove);

export default router;
