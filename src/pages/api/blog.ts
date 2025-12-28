import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const { data: posts, error } = await supabase
                .from("blog_posts")
                .select("*")
                .order("published_at", { ascending: false });

            if (error) throw error;

            // Transform snake_case to camelCase for frontend
            const formattedPosts = posts.map(post => ({
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
            }));

            return res.status(200).json(formattedPosts);
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            return res.status(500).json({ error: "Failed to fetch blog posts" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
