import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        const { category } = req.query;

        try {
            let query = supabase
                .from("products")
                .select("*");

            if (category && category !== "All") {
                query = query.eq("category", category);
            }

            const { data: products, error } = await query;

            if (error) throw error;

            // Transform snake_case to camelCase
            const formattedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                images: product.images || [],
                benefits: product.benefits || [],
                rating: product.rating || 0,
                reviewCount: product.review_count || 0,
                certified: product.certified || false,
                inStock: product.in_stock || true
            }));

            return res.status(200).json(formattedProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
            return res.status(500).json({ error: "Failed to fetch products" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
