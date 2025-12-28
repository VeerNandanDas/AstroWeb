(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/supabase.ts [client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@supabase/supabase-js/dist/module/index.js [client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://cxanroyrcrsacyvlehxb.supabase.co") || "https://your-project.supabase.co";
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YW5yb3lyY3JzYWN5dmxlaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODI1NDcsImV4cCI6MjA3OTY1ODU0N30.VYCdmvFjopRd06VqhzLN8wI_i93vaz-8kEGPnlvj0Hc") || "your-anon-key";
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/authContext.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/supabase.ts [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Admin email domains
const ADMIN_EMAILS = [
    "admin@example.com",
    "veernandan00u@gmail.com"
];
const ADMIN_DOMAINS = [
    "@admin.divine"
];
const isAdminUser = (email)=>{
    if (!email) return false;
    return ADMIN_EMAILS.includes(email) || ADMIN_DOMAINS.some((domain)=>email.endsWith(domain));
};
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const checkAuth = {
                "AuthProvider.useEffect.checkAuth": async ()=>{
                    try {
                        const { data: { user: supabaseUser } } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
                        if (supabaseUser?.email) {
                            const adminStatus = isAdminUser(supabaseUser.email);
                            const accountType = adminStatus ? "admin" : "customer";
                            // Try to save/update user in our users table
                            try {
                                await fetch("/api/users", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        id: supabaseUser.id,
                                        email: supabaseUser.email,
                                        isAdmin: adminStatus,
                                        accountType: accountType,
                                        fullName: supabaseUser.user_metadata?.full_name || ""
                                    })
                                });
                            } catch (err) {
                                console.log("User profile sync failed (backend may not be ready):", err);
                            }
                            setUser({
                                id: supabaseUser.id,
                                email: supabaseUser.email,
                                isAdmin: adminStatus,
                                accountType: accountType
                            });
                        } else {
                            setUser(null);
                        }
                    } catch (error) {
                        console.error("Auth check error:", error);
                        setUser(null);
                    } finally{
                        setLoading(false);
                    }
                }
            }["AuthProvider.useEffect.checkAuth"];
            checkAuth();
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": async (_event, session)=>{
                    if (session?.user?.email) {
                        const adminStatus = isAdminUser(session.user.email);
                        const accountType = adminStatus ? "admin" : "customer";
                        // Try to save/update user in our users table
                        try {
                            await fetch("/api/users", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    id: session.user.id,
                                    email: session.user.email,
                                    isAdmin: adminStatus,
                                    accountType: accountType,
                                    fullName: session.user.user_metadata?.full_name || ""
                                })
                            });
                        } catch (err) {
                            console.log("User profile sync failed:", err);
                        }
                        setUser({
                            id: session.user.id,
                            email: session.user.email,
                            isAdmin: adminStatus,
                            accountType: accountType
                        });
                    } else {
                        setUser(null);
                    }
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>subscription?.unsubscribe()
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const signUp = async (name, email, password)=>{
        try {
            const { error, data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        email: email
                    }
                }
            });
            if (error) throw error;
            // Save user to our database
            if (data.user) {
                const adminStatus = isAdminUser(email);
                const accountType = adminStatus ? "admin" : "customer";
                await fetch("/api/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: data.user.id,
                        email: email,
                        isAdmin: adminStatus,
                        accountType: accountType,
                        fullName: name
                    })
                }).catch((err)=>console.log("User profile save failed:", err));
            }
        } catch (error) {
            throw error;
        }
    };
    const signIn = async (email, password)=>{
        try {
            const { error, data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            // Update user in our database
            if (data.user) {
                const adminStatus = isAdminUser(email);
                const accountType = adminStatus ? "admin" : "customer";
                await fetch("/api/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: data.user.id,
                        email: email,
                        isAdmin: adminStatus,
                        accountType: accountType,
                        fullName: data.user.user_metadata?.full_name || ""
                    })
                }).catch((err)=>console.log("User profile update failed:", err));
            }
        } catch (error) {
            throw error;
        }
    };
    const signOut = async ()=>{
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if (error) throw error;
            setUser(null);
        } catch (error) {
            throw error;
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            isAdmin: user?.isAdmin || false,
            signUp,
            signIn,
            signOut
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/authContext.tsx",
        lineNumber: 194,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) {
        return {
            user: null,
            loading: true,
            isAdmin: false,
            signUp: async ()=>{},
            signIn: async ()=>{},
            signOut: async ()=>{}
        };
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/clsx/dist/clsx.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/tailwind-merge/dist/bundle-mjs.mjs [client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/button.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@radix-ui/react-slot/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" + " hover-elevate active-elevate-2", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground border border-primary-border",
            destructive: "bg-destructive text-destructive-foreground border border-destructive-border",
            outline: // Shows the background color of whatever card / sidebar / accent background it is inside of.
            // Inherits the current text color.
            " border [border-color:var(--button-outline)]  shadow-xs active:shadow-none ",
            secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
            // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
            ghost: "border border-transparent"
        },
        // Heights are set as "min" heights, because sometimes Ai will place large amount of content
        // inside buttons. With a min-height they will look appropriate with small amounts of content,
        // but will expand to fit large amounts of content.
        size: {
            default: "min-h-9 px-4 py-2",
            sm: "min-h-8 rounded-md px-3 text-xs",
            lg: "min-h-10 rounded-md px-8",
            icon: "h-9 w-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/button.tsx",
        lineNumber: 52,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = "Button";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx",
        lineNumber: 9,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Card;
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx",
        lineNumber: 24,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = CardHeader;
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-2xl font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = CardTitle;
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx",
        lineNumber: 51,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c7 = CardDescription;
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx",
        lineNumber: 63,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c9 = CardContent;
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx",
        lineNumber: 71,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c11 = CardFooter;
CardFooter.displayName = "CardFooter";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Card$React.forwardRef");
__turbopack_context__.k.register(_c1, "Card");
__turbopack_context__.k.register(_c2, "CardHeader$React.forwardRef");
__turbopack_context__.k.register(_c3, "CardHeader");
__turbopack_context__.k.register(_c4, "CardTitle$React.forwardRef");
__turbopack_context__.k.register(_c5, "CardTitle");
__turbopack_context__.k.register(_c6, "CardDescription$React.forwardRef");
__turbopack_context__.k.register(_c7, "CardDescription");
__turbopack_context__.k.register(_c8, "CardContent$React.forwardRef");
__turbopack_context__.k.register(_c9, "CardContent");
__turbopack_context__.k.register(_c10, "CardFooter$React.forwardRef");
__turbopack_context__.k.register(_c11, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/input.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, type, ...props }, ref)=>{
    // h-9 to match icon buttons and default buttons.
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/input.tsx",
        lineNumber: 9,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Input;
Input.displayName = "Input";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input$React.forwardRef");
__turbopack_context__.k.register(_c1, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/label.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Label",
    ()=>Label
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@radix-ui/react-label/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
;
;
const labelVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])(labelVariants(), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/label.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Label;
Label.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Label$React.forwardRef");
__turbopack_context__.k.register(_c1, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminVideos
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$authContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/authContext.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/supabase.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/button.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/input.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/label.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/arrow-left.js [client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Video$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/video.js [client] (ecmascript) <export default as Video>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/loader-circle.js [client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/trash-2.js [client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/plus.js [client] (ecmascript) <export default as Plus>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
;
;
;
function AdminVideos() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { isAdmin, loading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$authContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [videos, setVideos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingData, setLoadingData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isAdding, setIsAdding] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [deletingId, setDeletingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Form state
    const [showForm, setShowForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [title, setTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [youtubeUrl, setYoutubeUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [thumbnailUrl, setThumbnailUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminVideos.useEffect": ()=>{
            if (!loading && !isAdmin) {
                router.push("/");
            }
        }
    }["AdminVideos.useEffect"], [
        loading,
        isAdmin,
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminVideos.useEffect": ()=>{
            if (isAdmin) {
                fetchVideos();
            }
        }
    }["AdminVideos.useEffect"], [
        isAdmin
    ]);
    const fetchVideos = async ()=>{
        try {
            setLoadingData(true);
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from("videos").select("*").order("created_at", {
                ascending: false
            });
            if (error) throw error;
            setVideos(data || []);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally{
            setLoadingData(false);
        }
    };
    const addVideo = async (e)=>{
        e.preventDefault();
        if (!title || !youtubeUrl || !thumbnailUrl) {
            alert("Please fill in all fields");
            return;
        }
        try {
            setIsAdding(true);
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from("videos").insert([
                {
                    title,
                    youtube_url: youtubeUrl,
                    thumbnail_url: thumbnailUrl
                }
            ]).select().single();
            if (error) throw error;
            setVideos((prev)=>[
                    data,
                    ...prev
                ]);
            // Reset form
            setTitle("");
            setYoutubeUrl("");
            setThumbnailUrl("");
            setShowForm(false);
            alert("Video added successfully!");
        } catch (error) {
            console.error("Error adding video:", error);
            alert(`Failed to add video: ${error.message}`);
        } finally{
            setIsAdding(false);
        }
    };
    const deleteVideo = async (id)=>{
        if (!confirm("Are you sure you want to delete this video?")) {
            return;
        }
        try {
            setDeletingId(id);
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from("videos").delete().eq("id", id);
            if (error) throw error;
            setVideos((prev)=>prev.filter((video)=>video.id !== id));
        } catch (error) {
            console.error("Error deleting video:", error);
            alert("Failed to delete video");
        } finally{
            setDeletingId(null);
        }
    };
    const extractVideoId = (url)=>{
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    };
    const getThumbnailFromUrl = (url)=>{
        const videoId = extractVideoId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        return "";
    };
    const autoFillThumbnail = ()=>{
        if (youtubeUrl && !thumbnailUrl) {
            const thumbnail = getThumbnailFromUrl(youtubeUrl);
            if (thumbnail) {
                setThumbnailUrl(thumbnail);
            }
        }
    };
    if (loading || !isAdmin) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                className: "h-8 w-8 animate-spin text-primary"
            }, void 0, false, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                lineNumber: 154,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
            lineNumber: 153,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Manage Videos - Admin Dashboard"
                }, void 0, false, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                    lineNumber: 162,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                lineNumber: 161,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen bg-background",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-primary text-primary-foreground py-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/admin",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "ghost",
                                        className: "mb-4 text-primary-foreground hover:bg-primary-foreground/10",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                                className: "h-4 w-4 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                lineNumber: 171,
                                                columnNumber: 33
                                            }, this),
                                            "Back to Dashboard"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                        lineNumber: 170,
                                        columnNumber: 29
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                    lineNumber: 169,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                    className: "font-serif text-4xl font-bold mb-2",
                                                    children: "Videos"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 177,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-primary-foreground/90",
                                                    children: "Manage video content"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                            lineNumber: 176,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                            onClick: ()=>setShowForm(!showForm),
                                            className: "bg-accent text-accent-foreground hover:bg-accent/90",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                    className: "h-4 w-4 mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 184,
                                                    columnNumber: 33
                                                }, this),
                                                "Add Video"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                            lineNumber: 180,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                    lineNumber: 175,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                            lineNumber: 168,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                        lineNumber: 167,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "container mx-auto px-4 lg:px-8 py-8",
                        children: [
                            showForm && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                className: "mb-8 border-primary/20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                children: "Add New Video"
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                lineNumber: 196,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                                children: "Add a YouTube video to the gallery"
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                lineNumber: 197,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                        lineNumber: 195,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                            onSubmit: addVideo,
                                            className: "space-y-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            htmlFor: "title",
                                                            children: "Video Title"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 202,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                            id: "title",
                                                            value: title,
                                                            onChange: (e)=>setTitle(e.target.value),
                                                            placeholder: "Enter video title",
                                                            required: true
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 203,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 201,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            htmlFor: "youtubeUrl",
                                                            children: "YouTube URL"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 213,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                            id: "youtubeUrl",
                                                            value: youtubeUrl,
                                                            onChange: (e)=>setYoutubeUrl(e.target.value),
                                                            onBlur: autoFillThumbnail,
                                                            placeholder: "https://www.youtube.com/watch?v=...",
                                                            required: true
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 214,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 212,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            htmlFor: "thumbnailUrl",
                                                            children: "Thumbnail URL"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 225,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                    id: "thumbnailUrl",
                                                                    value: thumbnailUrl,
                                                                    onChange: (e)=>setThumbnailUrl(e.target.value),
                                                                    placeholder: "https://img.youtube.com/vi/...",
                                                                    required: true
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                                    lineNumber: 227,
                                                                    columnNumber: 45
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                    type: "button",
                                                                    variant: "outline",
                                                                    onClick: autoFillThumbnail,
                                                                    children: "Auto-fill"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                                    lineNumber: 234,
                                                                    columnNumber: 45
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 226,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-muted-foreground mt-1",
                                                            children: 'Click "Auto-fill" to generate thumbnail from YouTube URL'
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 242,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 224,
                                                    columnNumber: 37
                                                }, this),
                                                thumbnailUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            children: "Preview"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 249,
                                                            columnNumber: 45
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: thumbnailUrl,
                                                            alt: "Thumbnail preview",
                                                            className: "w-full max-w-md rounded-lg mt-2",
                                                            onError: (e)=>{
                                                                e.currentTarget.src = "https://via.placeholder.com/480x360?text=Invalid+Thumbnail";
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 250,
                                                            columnNumber: 45
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 248,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            type: "submit",
                                                            disabled: isAdding,
                                                            children: isAdding ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                                        className: "h-4 w-4 mr-2 animate-spin"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                                        lineNumber: 265,
                                                                        columnNumber: 53
                                                                    }, this),
                                                                    "Adding..."
                                                                ]
                                                            }, void 0, true) : "Add Video"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 262,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            type: "button",
                                                            variant: "outline",
                                                            onClick: ()=>setShowForm(false),
                                                            children: "Cancel"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 272,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 261,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                            lineNumber: 200,
                                            columnNumber: 33
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                        lineNumber: 199,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                lineNumber: 194,
                                columnNumber: 25
                            }, this),
                            loadingData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center py-12",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "h-8 w-8 animate-spin text-primary mx-auto"
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                        lineNumber: 284,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-4 text-muted-foreground",
                                        children: "Loading videos..."
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                        lineNumber: 285,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                lineNumber: 283,
                                columnNumber: 25
                            }, this) : videos.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    className: "py-12 text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Video$3e$__["Video"], {
                                            className: "h-12 w-12 text-muted-foreground mx-auto mb-4"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                            lineNumber: 290,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground",
                                            children: "No videos found"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                            lineNumber: 291,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                            onClick: ()=>setShowForm(true),
                                            className: "mt-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                    className: "h-4 w-4 mr-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 293,
                                                    columnNumber: 37
                                                }, this),
                                                "Add Your First Video"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                            lineNumber: 292,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                    lineNumber: 289,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                lineNumber: 288,
                                columnNumber: 25
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                children: videos.map((video)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                        className: "overflow-hidden hover-elevate transition-all",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative aspect-video",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: video.thumbnail_url,
                                                    alt: video.title,
                                                    className: "w-full h-full object-cover",
                                                    onError: (e)=>{
                                                        e.currentTarget.src = "https://via.placeholder.com/480x360?text=Video";
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 303,
                                                    columnNumber: 41
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                lineNumber: 302,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                        className: "line-clamp-2",
                                                        children: video.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                        lineNumber: 313,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                                        children: [
                                                            "Added: ",
                                                            new Date(video.created_at).toLocaleDateString()
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                        lineNumber: 314,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                lineNumber: 312,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            variant: "outline",
                                                            size: "sm",
                                                            className: "flex-1",
                                                            onClick: ()=>window.open(video.youtube_url, "_blank"),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$video$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Video$3e$__["Video"], {
                                                                    className: "h-4 w-4 mr-1"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                                    lineNumber: 326,
                                                                    columnNumber: 49
                                                                }, this),
                                                                "Watch"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 320,
                                                            columnNumber: 45
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            variant: "destructive",
                                                            size: "sm",
                                                            onClick: ()=>deleteVideo(video.id),
                                                            disabled: deletingId === video.id,
                                                            children: deletingId === video.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                                className: "h-4 w-4 animate-spin"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                                lineNumber: 336,
                                                                columnNumber: 53
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                className: "h-4 w-4"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                                lineNumber: 338,
                                                                columnNumber: 53
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                            lineNumber: 329,
                                                            columnNumber: 45
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                    lineNumber: 319,
                                                    columnNumber: 41
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                                lineNumber: 318,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, video.id, true, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                        lineNumber: 301,
                                        columnNumber: 33
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                                lineNumber: 299,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                        lineNumber: 191,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx",
                lineNumber: 165,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true);
}
_s(AdminVideos, "Jlt6kGwoYHozFi+jmSJfYbIaZr0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$authContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = AdminVideos;
var _c;
__turbopack_context__.k.register(_c, "AdminVideos");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/admin/videos";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/admin/videos.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f80fe13d._.js.map