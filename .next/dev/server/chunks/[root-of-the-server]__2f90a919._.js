module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/@supabase/supabase-js [external] (@supabase/supabase-js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@supabase/supabase-js", () => require("@supabase/supabase-js"));

module.exports = mod;
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/supabase.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAuthToken",
    ()=>getAuthToken,
    "getCurrentUser",
    ()=>getCurrentUser,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut,
    "signUp",
    ()=>signUp,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$supabase$2d$js__$5b$external$5d$__$2840$supabase$2f$supabase$2d$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@supabase/supabase-js [external] (@supabase/supabase-js, cjs)");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://cxanroyrcrsacyvlehxb.supabase.co") || "https://your-project.supabase.co";
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YW5yb3lyY3JzYWN5dmxlaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODI1NDcsImV4cCI6MjA3OTY1ODU0N30.VYCdmvFjopRd06VqhzLN8wI_i93vaz-8kEGPnlvj0Hc") || "your-anon-key";
const supabase = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$supabase$2d$js__$5b$external$5d$__$2840$supabase$2f$supabase$2d$js$2c$__cjs$29$__["createClient"])(supabaseUrl, supabaseAnonKey);
async function getAuthToken() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error("Error getting auth token:", error);
        return null;
    }
}
async function signUp(email, password) {
    return await supabase.auth.signUp({
        email,
        password
    });
}
async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({
        email,
        password
    });
}
async function signOut() {
    return await supabase.auth.signOut();
}
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/api/panchang.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/supabase.ts [api] (ecmascript)");
;
async function handler(req, res) {
    if (req.method === "GET") {
        try {
            const { date } = req.query;
            let query = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["supabase"].from("panchangs").select("*");
            if (date) {
                query = query.eq("date", date);
            } else {
                // Default to today if no date provided
                const today = new Date().toISOString().split('T')[0];
                query = query.eq("date", today);
            }
            const { data, error } = await query.order("created_at", {
                ascending: false
            }).limit(1);
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
            return res.status(500).json({
                error: "Failed to fetch panchang"
            });
        }
    }
    if (req.method === "POST") {
        try {
            // Basic auth check (similar to muhurat API)
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }
            const { date, tithi, vaar, nakshatr, yoga, karan } = req.body;
            if (!date) {
                return res.status(400).json({
                    error: "Date is required"
                });
            }
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["supabase"].from("panchangs").upsert({
                date,
                tithi,
                vaar,
                nakshatr,
                yoga,
                karan
            }, {
                onConflict: 'date'
            }).select().single();
            if (error) throw error;
            return res.status(200).json(data);
        } catch (error) {
            console.error("Error saving panchang:", error);
            return res.status(500).json({
                error: "Failed to save panchang"
            });
        }
    }
    return res.status(405).json({
        error: "Method not allowed"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2f90a919._.js.map