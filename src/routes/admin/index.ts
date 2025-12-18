import { Router } from "express";
import { adminOnly } from "../../middlewares/admin.middleware";
import { adminLogin } from "../../controllers/admin/adminLogin.controller";
import { isAuthenticated } from "../../middlewares/Auth.middlewares";
import * as adminUserController from "../../controllers/admin/user.controller";

const router = Router();

router.use(isAuthenticated, adminOnly);

// USER ROUTES
router.get("/users", adminUserController.listUsers);
router.post("/users", adminUserController.createUser);
router.get("/users/:id", adminUserController.getUser);
router.put("/users/:id", adminUserController.updateUser);
router.delete("/users/:id", adminUserController.deleteUser);

export default router;