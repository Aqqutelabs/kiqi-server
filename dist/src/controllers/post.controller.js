"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostController = void 0;
const post_service_impl_1 = require("../services/impl/post.service.impl");
const http_status_codes_1 = require("http-status-codes");
class PostController {
    constructor() {
        this.createPost = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Incoming file:", req.file);
                console.log("Request body:", req.body);
                const { platform, message, publish_date, action } = req.body;
                // handle uploaded media (single file)
                let media = null;
                if (req.file && req.file.path) {
                    media = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
                }
                let is_draft;
                let is_published = false;
                let final_publish_date = null;
                if (action === "draft") {
                    is_draft = true;
                    is_published = false;
                }
                else if (action === "publish_now") {
                    is_draft = false;
                    is_published = true;
                    final_publish_date = new Date();
                }
                else if (action === "schedule") {
                    is_draft = false;
                    is_published = false;
                    final_publish_date = new Date(publish_date);
                }
                else {
                    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                        error: true,
                        message: "Invalid action value. Must be 'draft', 'publish_now', or 'schedule'.",
                    });
                    return;
                }
                // Validation for publish / schedule
                if (!is_draft) {
                    if (!platform || !message) {
                        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                            error: true,
                            message: "Platform and message are required for publishing.",
                        });
                        return;
                    }
                }
                const post = yield this.postService.createPost(platform, message, is_draft, is_published, media || undefined, final_publish_date);
                res.status(http_status_codes_1.StatusCodes.CREATED).json({
                    error: false,
                    message: is_draft
                        ? "Post saved as draft"
                        : action === "publish_now"
                            ? "Post published successfully"
                            : "Post scheduled successfully",
                    data: post,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAllPosts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const posts = yield this.postService.getAllPosts();
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: posts,
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getPostById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const post = yield this.postService.getPostById(id);
                if (!post) {
                    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                        error: true,
                        message: "Post not found",
                    });
                }
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    data: post
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.deletePost = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield this.postService.deletePost(id);
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    error: false,
                    message: "Post has been deleted",
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.postService = new post_service_impl_1.PostImpl();
    }
}
exports.PostController = PostController;
;
