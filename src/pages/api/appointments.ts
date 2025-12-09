import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        // Get all appointments (admin only through auth check in frontend)
        try {
            const { data: appointments, error } = await supabase
                .from("appointments")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching appointments:", error);
                return res.status(500).json({ error: "Failed to fetch appointments" });
            }

            // Transform snake_case to camelCase for frontend
            const formattedAppointments = appointments.map(apt => ({
                id: apt.id,
                name: apt.name,
                email: apt.email,
                phone: apt.phone,
                date: apt.date,
                time: apt.time,
                consultationType: apt.consultation_type,
                message: apt.message,
                status: apt.status,
                paymentStatus: apt.payment_status,
                razorpayOrderId: apt.razorpay_order_id,
                razorpayPaymentId: apt.razorpay_payment_id,
                createdAt: apt.created_at
            }));

            return res.status(200).json(formattedAppointments);
        } catch (error) {
            console.error("Error in GET /api/appointments:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    if (req.method === "POST") {
        // Create a new appointment
        try {
            const { name, email, phone, date, time, consultationType, message } = req.body;

            // Validate required fields
            if (!name || !email || !phone || !date || !time || !consultationType) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            // Insert appointment into database
            const { data, error } = await supabase
                .from("appointments")
                .insert([
                    {
                        name,
                        email,
                        phone,
                        date,
                        time,
                        consultation_type: consultationType,
                        message: message || null,
                        status: "pending",
                        payment_status: "pending"
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error("Error creating appointment:", error);
                return res.status(500).json({ error: error.message || "Failed to create appointment" });
            }

            return res.status(201).json({
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                date: data.date,
                time: data.time,
                consultationType: data.consultation_type,
                message: data.message,
                status: data.status,
                createdAt: data.created_at
            });
        } catch (error: any) {
            console.error("Error in POST /api/appointments:", error);
            return res.status(500).json({ error: error.message || "Internal server error" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
