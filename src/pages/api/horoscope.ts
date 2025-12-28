import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            const { date, sign } = req.query;

            let query = supabase.from("daily_horoscopes").select("*");

            if (date) {
                query = query.eq("date", date);
            }
            if (sign) {
                query = query.eq("sign", sign.toString().toLowerCase());
            }

            const { data, error } = await query;

            if (error) {
                // If table doesn't exist yet, return empty array instead of crashing
                if (error.code === '42P01') {
                    return res.status(200).json([]);
                }
                throw error;
            }

            // Transform snake_case to camelCase
            const formattedData = data.map(item => ({
                id: item.id,
                date: item.date,
                sign: item.sign,
                love: item.love,
                career: item.career,
                finance: item.finance,
                health: item.health,
                luckyNumber: item.lucky_number,
                luckyColor: item.lucky_color,
                luckyTime: item.lucky_time,
                luckyGem: item.lucky_gem,
                createdAt: item.created_at
            }));

            return res.status(200).json(formattedData);
        } catch (error) {
            console.error("Error fetching horoscopes:", error);
            return res.status(500).json({ error: "Failed to fetch horoscopes" });
        }
    }

    if (req.method === "POST") {
        try {
            // Basic auth check - in a real app, verify the token
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const {
                date,
                sign,
                love,
                career,
                finance,
                health,
                luckyNumber,
                luckyColor,
                luckyTime,
                luckyGem
            } = req.body;

            const { data, error } = await supabase
                .from("daily_horoscopes")
                .upsert({
                    date,
                    sign: sign.toLowerCase(),
                    love,
                    career,
                    finance,
                    health,
                    lucky_number: luckyNumber,
                    lucky_color: luckyColor,
                    lucky_time: luckyTime,
                    lucky_gem: luckyGem,
                }, { onConflict: 'date, sign' })
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json(data);
        } catch (error) {
            console.error("Error saving horoscope:", error);
            return res.status(500).json({ error: "Failed to save horoscope" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
