import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { id, email, fullName, isAdmin, accountType } = req.body;

        if (!id || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            const { data, error } = await supabase
                .from("users")
                .upsert({
                    id,
                    email,
                    full_name: fullName,
                    is_admin: !!isAdmin,
                    account_type: accountType || "customer",
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' })
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json(data);
        } catch (error) {
            console.error("Error syncing user profile:", error);
            return res.status(500).json({ error: "Failed to sync user profile" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
