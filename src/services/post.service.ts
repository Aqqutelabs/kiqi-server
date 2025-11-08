import { PostDoc } from "../models/Post";

export interface PostService {
    createPost(
        platform: string,
        message: string,
        is_draft: boolean,
        is_published: boolean,
        media?: string,        
        publish_date?: Date | null
    ): Promise<PostDoc>;

    getAllPosts(): Promise<PostDoc[]>;

    getPostById(id: string): Promise<PostDoc | null>;

    deletePost(id: string): Promise<void>;
}