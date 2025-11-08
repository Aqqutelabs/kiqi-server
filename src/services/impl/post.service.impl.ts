import { PostDoc, PostModel } from "../../models/Post";
import { PostService } from "../post.service";
import { ApiError } from "../../utils/ApiError";
import { StatusCodes } from "http-status-codes";

export class PostImpl implements PostService {
    async createPost(
        platform: string,
        message: string,
        is_draft: boolean,
        is_published: boolean,
        media?: string,
        publish_date?: Date | null
    ): Promise<PostDoc> {

       // console.log("Creating post:", { platform, message, is_draft, media, publish_date });
        const post = await PostModel.create({
            platform,
            message,
            is_draft,
            is_published,
            media,
            publish_date,
        });

        return post;
    }

    async getAllPosts(): Promise<PostDoc[]> {
        return PostModel.find();
    }

    async getPostById(id: string): Promise<PostDoc | null> {
        return PostModel.findById(id);
    }

    async deletePost(id: string): Promise<void> {
        await PostModel.findByIdAndDelete(id);
    }
}