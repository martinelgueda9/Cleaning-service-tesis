import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import * as pricingController from '../controllers/pricing.controller.js';

const router = Router();

router.get('/', pricingController.getPublicPricing);

router.get('/admin/servicios', requireAuth, requireRole('PROPIETARIA'), pricingController.getAllServices);
router.post('/admin/servicios', requireAuth, requireRole('PROPIETARIA'), pricingController.createService);
router.put('/admin/servicios/:id', requireAuth, requireRole('PROPIETARIA'), pricingController.updateService);
router.delete('/admin/servicios/:id', requireAuth, requireRole('PROPIETARIA'), pricingController.deleteService);

router.post('/admin/opciones', requireAuth, requireRole('PROPIETARIA'), pricingController.createSizeOption);
router.put('/admin/opciones/:id', requireAuth, requireRole('PROPIETARIA'), pricingController.updateSizeOption);
router.delete('/admin/opciones/:id', requireAuth, requireRole('PROPIETARIA'), pricingController.deleteSizeOption);

router.get('/admin/addons', requireAuth, requireRole('PROPIETARIA'), pricingController.getAllAddons);
router.post('/admin/addons', requireAuth, requireRole('PROPIETARIA'), pricingController.createAddon);
router.put('/admin/addons/:id', requireAuth, requireRole('PROPIETARIA'), pricingController.updateAddon);
router.delete('/admin/addons/:id', requireAuth, requireRole('PROPIETARIA'), pricingController.deleteAddon);

export default router;
