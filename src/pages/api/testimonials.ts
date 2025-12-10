import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["admin@example.com", "veernandan00u@gmail.com"];
const ADMIN_DOMAINS = ["@admin.divine"];

const isAdminUser = (email: string | undefined) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email) || ADMIN_DOMAINS.some(domain => email.endsWith(domain));
};

// Demo testimonials data
const DEMO_TESTIMONIALS = [
    {
        id: "demo-1",
        name: "Priya Sharma",
        location: "Mumbai, Maharashtra",
        rating: 5,
        review: "The Blue Sapphire gemstone I purchased has brought incredible positive changes to my career. Within weeks of wearing it, I received a promotion I had been waiting for years. The quality is exceptional and the guidance from the astrologer was spot-on!",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        verified: true
    },
    {
        id: "demo-2",
        name: "Rajesh Kumar",
        location: "Delhi, NCR",
        rating: 5,
        review: "I consulted for marriage issues and was recommended a specific Yantra. The difference it made in my relationship is phenomenal. My wife and I are closer than ever. Thank you for the authentic products and genuine spiritual guidance!",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
        verified: true
    },
    {
        id: "demo-3",
        name: "Anita Desai",
        location: "Bangalore, Karnataka",
        rating: 5,
        review: "The Rudraksha bracelet I bought is absolutely beautiful and I can feel its positive energy. My anxiety has reduced significantly and I feel more centered in my daily life. Highly recommend Divine Astrology for genuine spiritual products!",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita",
        verified: true
    },
    {
        id: "demo-4",
        name: "Vikram Singh",
        location: "Jaipur, Rajasthan",
        rating: 5,
        review: "I was skeptical at first, but the consultation changed my perspective. The gemstone recommendation for my daughter's education has worked wonders. She's now more focused and her grades have improved dramatically. The products are 100% authentic!",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
        verified: true
    },
    {
        id: "demo-5",
        name: "Meera Patel",
        location: "Ahmedabad, Gujarat",
        rating: 5,
        review: "The Navratna ring I ordered is stunning! The craftsmanship is excellent and I've noticed positive changes in my overall well-being. The customer service was outstanding and delivered right on time. Will definitely shop again!",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meera",
        verified: true
    },
    {
        id: "demo-6",
        name: "Arjun Menon",
        location: "Chennai, Tamil Nadu",
        rating: 5,
        review: "After years of financial struggles, the remedies suggested and the emerald gemstone have turned my fortune around. My business is thriving and I'm finally debt-free. I cannot thank Divine Astrology enough for their authentic guidance and products!",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
        verified: true
    }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        try {
            // Try to fetch from database first
            const { data: dbTestimonials, error } = await supabase
                .from("testimonials")
                .select("*")
                .eq("verified", true);

            // If database has testimonials, return them
            if (!error && dbTestimonials && dbTestimonials.length > 0) {
                return res.status(200).json(dbTestimonials);
            }

            // Otherwise, return demo testimonials
            return res.status(200).json(DEMO_TESTIMONIALS);
        } catch (error) {
            console.error("Error in testimonials API:", error);
            // If there's any error, still return demo testimonials
            return res.status(200).json(DEMO_TESTIMONIALS);
        }
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

        const { name, location, rating, review, avatar, verified } = req.body;

        if (!name || !location || !rating || !review) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { data, error } = await supabase
            .from("testimonials")
            .insert([
                {
                    name,
                    location,
                    rating,
                    review,
                    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                    verified: verified !== undefined ? verified : true
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Error adding testimonial:", error);
            return res.status(500).json({ error: error.message || "Failed to add testimonial", details: error });
        }

        return res.status(201).json(data);
    }

    if (req.method === "DELETE") {
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

        const { id } = req.query;

        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Missing testimonial ID" });
        }

        const { error } = await supabase
            .from("testimonials")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting testimonial:", error);
            return res.status(500).json({ error: "Failed to delete testimonial" });
        }

        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
