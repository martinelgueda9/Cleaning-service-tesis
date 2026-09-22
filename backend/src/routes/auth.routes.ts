import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../schemas/index.js';

const router = Router();

router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authController.me);

export default router;
