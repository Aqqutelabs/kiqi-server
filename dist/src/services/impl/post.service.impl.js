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
exports.PostImpl = void 0;
const Post_1 = require("../../models/Post");
class PostImpl {
    createPost(platform, message, is_draft, is_published, media, publish_date) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("Creating post:", { platform, message, is_draft, media, publish_date });
            const post = yield Post_1.PostModel.create({
                platform,
                message,
                is_draft,
                is_published,
                media,
                publish_date,
            });
            return post;
        });
    }
    getAllPosts() {
        return __awaiter(this, void 0, void 0, function* () {
            return Post_1.PostModel.find();
        });
    }
    getPostById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return Post_1.PostModel.findById(id);
        });
    }
    deletePost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Post_1.PostModel.findByIdAndDelete(id);
        });
    }
}
exports.PostImpl = PostImpl;
