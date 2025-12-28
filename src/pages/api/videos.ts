import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["acharyaomshah@gmail.com"];
const ADMIN_DOMAINS = ["@admin.divine"];

const isAdminUser = (email: string | undefined) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email) || ADMIN_DOMAINS.some(domain => email.endsWith(domain));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        // Fetch videos
        const { data: videos, error } = await supabase
            .from("videos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching videos:", error);
            return res.status(500).json({ error: "Failed to fetch videos" });
        }

        // Transform snake_case to camelCase for frontend
        const formattedVideos = videos.map(video => ({
            id: video.id,
            title: video.title,
            youtubeUrl: video.youtube_url,
            thumbnailUrl: video.thumbnail_url,
            createdAt: video.created_at
        }));

        return res.status(200).json(formattedVideos);
    }

    if (req.method === "POST") {
        // Check authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Missing authorization header" });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || !isAdminUser(user.email)) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { title, youtubeUrl, thumbnailUrl } = req.body;

        if (!title || !youtubeUrl || !thumbnailUrl) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { data, error } = await supabase
            .from("videos")
            .insert([
                {
                    title,
                    youtube_url: youtubeUrl,
                    thumbnail_url: thumbnailUrl
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Error adding video:", error);
            return res.status(500).json({ error: error.message || "Failed to add video", details: error });
            // return res.status(500).json({ error: "Failed to add video" });
        }

        return res.status(201).json({
            id: data.id,
            title: data.title,
            youtubeUrl: data.youtube_url,
            thumbnailUrl: data.thumbnail_url,
            createdAt: data.created_at
        });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
