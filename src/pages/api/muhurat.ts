import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const { month, year } = req.query;

            let query = supabase.from("muhurats").select("*");

            // If month/year provided, filter by it. Else get the current/latest one.
            if (month) {
                query = query.eq("month", month);
            }

            // Order by created_at desc to get the latest entry for the month/default
            const { data, error } = await query.order("created_at", { ascending: false }).limit(1);

            if (error) {
                // If table doesn't exist yet, return empty array
                if (error.code === '42P01') {
                    return res.status(200).json([]);
                }
                throw error;
            }

            // Transform snake_case to camelCase
            const formattedData = data.map(item => ({
                id: item.id,
                month: item.month,
                year: item.year,
                monthName: item.month_name,
                vehiclePurchase: item.vehicle_purchase,
                miscellaneousPurchase: item.miscellaneous_purchase,
                newHome: item.new_home,
                auspiciousDays: item.auspicious_days,
                inauspiciousDays: item.inauspicious_days,
                note: item.note,
                createdAt: item.created_at
            }));

            return res.status(200).json(formattedData);
        } catch (error) {
            console.error("Error fetching muhurat:", error);
            return res.status(500).json({ error: "Failed to fetch muhurat" });
        }
    }

    if (req.method === "POST") {
        try {
            // Basic auth check
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const {
                month, // Format: "YYYY-MM"
                year,
                monthName,
                vehiclePurchase,
                miscellaneousPurchase,
                newHome,
                auspiciousDays,
                inauspiciousDays,
                note
            } = req.body;

            const { data, error } = await supabase
                .from("muhurats")
                .upsert({
                    month,
                    year,
                    month_name: monthName,
                    vehicle_purchase: vehiclePurchase,
                    miscellaneous_purchase: miscellaneousPurchase,
                    new_home: newHome,
                    auspicious_days: auspiciousDays,
                    inauspicious_days: inauspiciousDays,
                    note
                }, { onConflict: 'month' })
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error) {
            console.error("Error saving muhurat:", error);
            return res.status(500).json({ error: "Failed to save muhurat" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
