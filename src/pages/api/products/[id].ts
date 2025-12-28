import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (req.method === "GET") {
        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        try {
            const { data: product, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }

            // Transform snake_case to camelCase
            const formattedProduct = {
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
            };

            return res.status(200).json(formattedProduct);
        } catch (error) {
            console.error("Error fetching product:", error);
            return res.status(500).json({ error: "Failed to fetch product" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
