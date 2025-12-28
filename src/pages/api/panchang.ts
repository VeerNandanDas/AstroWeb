import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const { date } = req.query;

            let query = supabase.from("panchangs").select("*");

            if (date) {
                query = query.eq("date", date);
            } else {
                // Default to today if no date provided
                const today = new Date().toISOString().split('T')[0];
                query = query.eq("date", today);
            }

            const { data, error } = await query.order("created_at", { ascending: false }).limit(1);

            if (error) {
                // If table doesn't exist yet, return empty response
                if (error.code === '42P01') {
                    return res.status(200).json(null);
                }
                throw error;
            }

            return res.status(200).json(data && data.length > 0 ? data[0] : null);
        } catch (error) {
            console.error("Error fetching panchang:", error);
            return res.status(500).json({ error: "Failed to fetch panchang" });
        }
    }

    if (req.method === "POST") {
        try {
            // Basic auth check (similar to muhurat API)
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const {
                date, // Format: "YYYY-MM-DD"
                tithi,
                vaar,
                nakshatr,
                yoga,
                karan
            } = req.body;

            if (!date) {
                return res.status(400).json({ error: "Date is required" });
            }

            const { data, error } = await supabase
                .from("panchangs")
                .upsert({
                    date,
                    tithi,
                    vaar,
                    nakshatr,
                    yoga,
                    karan
                }, { onConflict: 'date' })
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error) {
            console.error("Error saving panchang:", error);
            return res.status(500).json({ error: "Failed to save panchang" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
