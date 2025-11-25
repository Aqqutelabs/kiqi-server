import { Router } from 'express';
import { verifyJWT } from '../middlewares/Auth.middlewares';
import { conversionController } from '../controllers/conversion.controller';

const router = Router();

// Protect all conversion routes
router.use(verifyJWT);

// User endpoints
router.post('/', conversionController.createRequest);
router.get('/', conversionController.listUser);

// Admin endpoints (simple role checks in controller)
router.get('/admin/all', conversionController.listAll);
router.post('/admin/:id/approve', conversionController.approve);
router.post('/admin/:id/reject', conversionController.reject);

export default router;
