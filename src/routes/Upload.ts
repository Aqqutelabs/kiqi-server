// src/routes/upload.routes.ts
import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller';
import upload from '../middlewares/upload.middleware';

const router = Router();

// The field name 'image' must match the key in the form-data request.
router.post('/', upload.single('image'), uploadImage);

export default router;