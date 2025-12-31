import { Response, Request, NextFunction } from "express";
import { PostImpl } from "../services/impl/post.service.impl";
import { StatusCodes } from "http-status-codes";
import { error } from "console";

export class PostController {
    private postService: PostImpl;

    constructor() {
        this.postService = new PostImpl();
    }


    public createPost = async (
        req: Request,
        res: Response,
        next: NextFunction

    ): Promise<void> => {
        try {
            console.log("Incoming file:", req.file);
            console.log("Request body:", req.body);

            const { platform, message, publish_date, action } = req.body;

            // handle uploaded media (single file)
            let media: string | null = null;
            if (req.file && req.file.path) {
                media = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
            }

            let is_draft: boolean;
            let is_published = false;
            let final_publish_date: Date | null = null;

            if (action === "draft") {
                is_draft = true;
                is_published = false;
            } else if (action === "publish_now") {
                is_draft = false;
                is_published = true;
                final_publish_date = new Date();
            }
            else if (action === "schedule") {
                is_draft = false;
                is_published = false;
                final_publish_date = new Date(publish_date);
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({
                    error: true,
                    message: "Invalid action value. Must be 'draft', 'publish_now', or 'schedule'.",
                });
                return;
            }

            // Validation for publish / schedule
            if (!is_draft) {
                if (!platform || !message) {
                    res.status(StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Platform and message are required for publishing.",
                    });
                    return;
                }
            }

            const post = await this.postService.createPost(
                platform,
                message,
                is_draft,
                is_published,
                media || undefined,
                final_publish_date
            );

            res.status(StatusCodes.CREATED).json({
                error: false,
                message: is_draft
                    ? "Post saved as draft"
                    : action === "publish_now"
                        ? "Post published successfully"
                        : "Post scheduled successfully",
                data: post,
            });
        } catch (error) {
            next(error);
        }
    }

    public getAllPosts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const posts = await this.postService.getAllPosts();
            res.status(StatusCodes.OK).json({
                error: false,
                data: posts,
            });
        } catch (error) {
            next(error);
        }
    }

    public getPostById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const post = await this.postService.getPostById(id);

            if (!post) {
                res.status(StatusCodes.NOT_FOUND).json({
                    error: true,
                    message: "Post not found",
                });
            }

            res.status(StatusCodes.OK).json({
                error: false,
                data: post
            })
        } catch (error) {
            next(error);
        }
    }

    public deletePost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            await this.postService.deletePost(id);

            res.status(StatusCodes.OK).json({
                error: false,
                message: "Post has been deleted",
            });
        } catch (error) {
            next(error);
        }
    }
};