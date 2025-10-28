import { Router } from 'express';
import { validateRequest } from '../middlewares/zod.validation.middleware';
import { isAuthenticated } from '../middlewares/Auth.middlewares';
import { 
    getDashboardMetrics,
    getPressReleaseDetails,
    createPressRelease,
    getPressReleasesList,
    updatePressRelease,
    deletePressRelease,
    getPublishers,
    getPublisherDetails,
    createOrder,
    getOrderDetails
} from '../controllers/pressRelease.controller';

import { 
    createPressReleaseSchema,
    updatePressReleaseSchema,
    createOrderSchema 
} from '../validation/pressRelease.validation';

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// Dashboard routes
router.get('/dashboard', getDashboardMetrics);
router.get('/list', getPressReleasesList);

// Press Release CRUD
router.post('/create', validateRequest(createPressReleaseSchema), createPressRelease);
router.get('/:id', getPressReleaseDetails);
router.put('/:id', validateRequest(updatePressReleaseSchema), updatePressRelease);
router.delete('/:id', deletePressRelease);

// Publisher routes
router.get('/publishers', getPublishers);
router.get('/publishers/:id', getPublisherDetails);

// Order routes
router.post('/orders', validateRequest(createOrderSchema), createOrder);
router.get('/orders/:id', getOrderDetails);

export default router;