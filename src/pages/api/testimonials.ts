import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const { data, error } = await supabase
                .from("testimonials")
                .select("*");

            if (error) throw error;
            return res.status(200).json(data);
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            return res.status(500).json({ error: "Failed to fetch testimonials" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
