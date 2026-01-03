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
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/api/videos.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/supabase.ts [api] (ecmascript)");
;
const ADMIN_EMAILS = [
    "aacharyaomshah@gmail.com"
];
const ADMIN_DOMAINS = [
    "@admin.divine"
];
const isAdminUser = (email)=>{
    if (!email) return false;
    return ADMIN_EMAILS.includes(email) || ADMIN_DOMAINS.some((domain)=>email.endsWith(domain));
};
async function handler(req, res) {
    if (req.method === "GET") {
        // Fetch videos
        const { data: videos, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["supabase"].from("videos").select("*").order("created_at", {
            ascending: false
        });
        if (error) {
            console.error("Error fetching videos:", error);
            return res.status(500).json({
                error: "Failed to fetch videos"
            });
        }
        // Transform snake_case to camelCase for frontend
        const formattedVideos = videos.map((video)=>({
                id: video.id,
                title: video.title,
                youtubeUrl: video.youtube_url,
                thumbnailUrl: video.thumbnail_url,
                createdAt: video.created_at
            }));
        return res.status(200).json(formattedVideos);
    }
    if (req.method === "POST") {
        // Check authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                error: "Missing authorization header"
            });
        }
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["supabase"].auth.getUser(token);
        if (authError || !user || !isAdminUser(user.email)) {
            return res.status(403).json({
                error: "Unauthorized"
            });
        }
        const { title, youtubeUrl, thumbnailUrl } = req.body;
        if (!title || !youtubeUrl || !thumbnailUrl) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["supabase"].from("videos").insert([
            {
                title,
                youtube_url: youtubeUrl,
                thumbnail_url: thumbnailUrl
            }
        ]).select().single();
        if (error) {
            console.error("Error adding video:", error);
            return res.status(500).json({
                error: error.message || "Failed to add video",
                details: error
            });
        // return res.status(500).json({ error: "Failed to add video" });
        }
        return res.status(201).json({
            id: data.id,
            title: data.title,
            youtubeUrl: data.youtube_url,
            thumbnailUrl: data.thumbnail_url,
            createdAt: data.created_at
        });
    }
    return res.status(405).json({
        error: "Method not allowed"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5b09d0d5._.js.map