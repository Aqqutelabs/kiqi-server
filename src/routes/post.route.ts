import { Router } from "express";
import { isAuthenticated } from "../middlewares/Auth.middlewares";
import { PostController } from "../controllers/post.controller";

const postRouter = Router()
const postController = new PostController();

postRouter.post("/", isAuthenticated, postController.createPost);
postRouter.get("/:id", isAuthenticated, postController.getPostById);
postRouter.get("/", isAuthenticated, postController.getAllPosts);
postRouter.delete("/:id", isAuthenticated, postController.deletePost)

export default postRouter