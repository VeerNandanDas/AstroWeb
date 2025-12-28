import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { slug } = req.query;

    if (req.method === "GET") {
        if (!slug || typeof slug !== "string") {
            return res.status(400).json({ error: "Invalid slug" });
        }

        try {
            const { data: post, error } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            if (!post) {
                return res.status(404).json({ error: "Blog post not found" });
            }

            // Transform snake_case to camelCase
            const formattedPost = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                category: post.category,
                featuredImage: post.featured_image,
                author: post.author,
                readTime: post.read_time,
                metaDescription: post.meta_description,
                publishedAt: post.published_at
            };

            return res.status(200).json(formattedPost);
        } catch (error) {
            console.error("Error fetching blog post:", error);
            return res.status(500).json({ error: "Failed to fetch blog post" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
