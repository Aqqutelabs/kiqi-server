import { Router } from 'express';
import { adminLogin, adminLogout } from "../../controllers/admin/adminAuth.controller";
import { verifyJWT } from '../../middlewares/Auth.middlewares';
import { logoutUser } from '../../middlewares/Validation.middlewares';

const router = Router();

router.post("/login", adminLogin);
router.post("/logout", adminLogout);

export default router;
