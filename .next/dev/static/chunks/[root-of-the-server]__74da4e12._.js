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
            default: "bg-primary text-primary-foreground shadow-md",
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
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/badge.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])(// Whitespace-nowrap: Badges should never wrap.
"whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" + " hover-elevate ", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground shadow-xs",
            secondary: "border-transparent bg-secondary text-secondary-foreground",
            destructive: "border-transparent bg-destructive text-destructive-foreground shadow-xs",
            outline: " border [border-color:var(--badge-outline)] shadow-xs"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/badge.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_c = Badge;
;
var _c;
__turbopack_context__.k.register(_c, "Badge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/skeleton.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Skeleton",
    ()=>Skeleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
function Skeleton({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("animate-pulse rounded-md bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/skeleton.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
_c = Skeleton;
;
var _c;
__turbopack_context__.k.register(_c, "Skeleton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BlogSection",
    ()=>BlogSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@tanstack/react-query/build/modern/useQuery.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/badge.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/clock.js [client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/calendar.js [client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/skeleton.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
function BlogSection({ limit }) {
    _s();
    const { data: posts, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "/api/blog"
        ],
        queryFn: {
            "BlogSection.useQuery": async ()=>{
                const response = await fetch("/api/blog");
                if (!response.ok) throw new Error("Failed to fetch blog posts");
                return response.json();
            }
        }["BlogSection.useQuery"]
    });
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
            children: Array.from({
                length: limit || 3
            }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                            className: "h-48 w-full"
                        }, void 0, false, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "p-6 space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                    className: "h-4 w-20"
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 30,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                    className: "h-6 w-full"
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 31,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                    className: "h-16 w-full"
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 32,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                            lineNumber: 29,
                            columnNumber: 13
                        }, this)
                    ]
                }, i, true, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                    lineNumber: 27,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this);
    }
    const displayPosts = limit ? posts?.slice(0, limit) : posts;
    if (!displayPosts || displayPosts.length === 0) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: displayPosts.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                href: `/blog/${post.slug}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: "overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group h-full",
                    "data-testid": `card-blog-${post.id}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative h-48 overflow-hidden bg-muted",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: post.featuredImage,
                                alt: post.title,
                                className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                lineNumber: 52,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                            lineNumber: 51,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "p-6 space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-xs text-muted-foreground",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Badge"], {
                                            variant: "secondary",
                                            className: "text-xs",
                                            "data-testid": `badge-category-${post.id}`,
                                            children: post.category
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                            lineNumber: 60,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex items-center gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                    className: "h-3 w-3"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                                    lineNumber: 64,
                                                    columnNumber: 19
                                                }, this),
                                                post.readTime,
                                                " min read"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                            lineNumber: 63,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 59,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-serif text-xl font-semibold line-clamp-2 group-hover:text-accent transition-colors",
                                    "data-testid": `text-blog-title-${post.id}`,
                                    children: post.title
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 69,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-muted-foreground text-sm line-clamp-3 leading-relaxed",
                                    "data-testid": `text-blog-excerpt-${post.id}`,
                                    children: post.excerpt
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 73,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-xs text-muted-foreground pt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                            className: "h-3 w-3"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                            lineNumber: 78,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: new Date(post.publishedAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                            lineNumber: 79,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                                    lineNumber: 77,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                            lineNumber: 58,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                    lineNumber: 50,
                    columnNumber: 11
                }, this)
            }, post.id, false, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
                lineNumber: 49,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
_s(BlogSection, "EdL4s5j3BQFeyJVnWLqYzFp6IZg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
_c = BlogSection;
var _c;
__turbopack_context__.k.register(_c, "BlogSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Accordion",
    ()=>Accordion,
    "AccordionContent",
    ()=>AccordionContent,
    "AccordionItem",
    ()=>AccordionItem,
    "AccordionTrigger",
    ()=>AccordionTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@radix-ui/react-accordion/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/chevron-down.js [client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
;
;
const Accordion = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"];
const AccordionItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Item"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("border-b", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx",
        lineNumber: 13,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = AccordionItem;
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Header"], {
        className: "flex",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Trigger"], {
            ref: ref,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className),
            ...props,
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                    className: "h-4 w-4 shrink-0 transition-transform duration-200"
                }, void 0, false, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx",
                    lineNumber: 35,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx",
            lineNumber: 26,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx",
        lineNumber: 25,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = AccordionTrigger;
AccordionTrigger.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Trigger"].displayName;
const AccordionContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"], {
        ref: ref,
        className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("pb-4 pt-0", className),
            children: children
        }, void 0, false, {
            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx",
            lineNumber: 50,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx",
        lineNumber: 45,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = AccordionContent;
AccordionContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$accordion$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "AccordionItem$React.forwardRef");
__turbopack_context__.k.register(_c1, "AccordionItem");
__turbopack_context__.k.register(_c2, "AccordionTrigger$React.forwardRef");
__turbopack_context__.k.register(_c3, "AccordionTrigger");
__turbopack_context__.k.register(_c4, "AccordionContent$React.forwardRef");
__turbopack_context__.k.register(_c5, "AccordionContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/FAQSection.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FAQSection",
    ()=>FAQSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$accordion$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/accordion.tsx [client] (ecmascript)");
;
;
function FAQSection() {
    const faqs = [
        {
            question: "Are all your gemstones certified?",
            answer: "Yes, all our gemstones come with authentic certification from recognized gemological laboratories. Each product includes detailed information about its origin, quality, and astrological properties."
        },
        {
            question: "How do I know which gemstone is right for me?",
            answer: "Our expert astrologers provide personalized consultations to recommend the perfect gemstone based on your birth chart, planetary positions, and specific life goals. You can book a consultation through our website."
        },
        {
            question: "What is your return and refund policy?",
            answer: "We offer a 7-day return policy for all products. If you're not satisfied with your purchase, you can return it in its original condition for a full refund. Custom-made items may have different terms."
        },
        {
            question: "How long does shipping take?",
            answer: "We typically ship orders within 1-2 business days. Delivery usually takes 3-7 business days depending on your location. We provide tracking information for all orders."
        },
        {
            question: "Do you offer astrology consultations?",
            answer: "Yes, we offer comprehensive astrology consultations with experienced astrologers. Sessions can be booked online and conducted via video call at your convenience."
        },
        {
            question: "How should I care for my gemstone?",
            answer: "Each gemstone comes with specific care instructions. Generally, avoid exposure to harsh chemicals, extreme temperatures, and direct sunlight. Clean regularly with a soft cloth and store separately to prevent scratches."
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$accordion$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Accordion"], {
        type: "single",
        collapsible: true,
        className: "w-full",
        children: faqs.map((faq, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$accordion$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["AccordionItem"], {
                value: `item-${index}`,
                "data-testid": `faq-item-${index}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$accordion$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["AccordionTrigger"], {
                        className: "text-left text-base font-semibold",
                        "data-testid": `faq-question-${index}`,
                        children: faq.question
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/FAQSection.tsx",
                        lineNumber: 40,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$accordion$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["AccordionContent"], {
                        className: "text-muted-foreground leading-relaxed",
                        "data-testid": `faq-answer-${index}`,
                        children: faq.answer
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/FAQSection.tsx",
                        lineNumber: 43,
                        columnNumber: 11
                    }, this)
                ]
            }, index, true, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/FAQSection.tsx",
                lineNumber: 39,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/FAQSection.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_c = FAQSection;
var _c;
__turbopack_context__.k.register(_c, "FAQSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/hooks/use-toast.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    _s();
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useToast.useEffect": ()=>{
            listeners.push(setState);
            return ({
                "useToast.useEffect": ()=>{
                    const index = listeners.indexOf(setState);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            })["useToast.useEffect"];
        }
    }["useToast.useEffect"], [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
_s(useToast, "SPWE98mLGnlsnNfIwu/IAKTSZtk=");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/calendar.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Calendar",
    ()=>Calendar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/chevron-left.js [client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/chevron-right.js [client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2d$day$2d$picker$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react-day-picker/dist/index.esm.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/button.tsx [client] (ecmascript)");
;
;
;
;
;
function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2d$day$2d$picker$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["DayPicker"], {
        showOutsideDays: showOutsideDays,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("p-3", className),
        classNames: {
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["buttonVariants"])({
                variant: "outline"
            }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["buttonVariants"])({
                variant: "ghost"
            }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            ...classNames
        },
        components: {
            IconLeft: ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("h-4 w-4", className),
                    ...props
                }, void 0, false, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/calendar.tsx",
                    lineNumber: 56,
                    columnNumber: 11
                }, void 0),
            IconRight: ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("h-4 w-4", className),
                    ...props
                }, void 0, false, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/calendar.tsx",
                    lineNumber: 59,
                    columnNumber: 11
                }, void 0)
        },
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/calendar.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_c = Calendar;
Calendar.displayName = "Calendar";
;
var _c;
__turbopack_context__.k.register(_c, "Calendar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/avatar.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Avatar",
    ()=>Avatar,
    "AvatarFallback",
    ()=>AvatarFallback,
    "AvatarImage",
    ()=>AvatarImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@radix-ui/react-avatar/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
"use client";
;
;
;
;
const Avatar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])(`
      after:content-[''] after:block after:absolute after:inset-0 after:rounded-full after:pointer-events-none after:border after:border-black/10 dark:after:border-white/10
      relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full`, className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/avatar.tsx",
        lineNumber: 12,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Avatar;
Avatar.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"].displayName;
const AvatarImage = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Image"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("aspect-square h-full w-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/avatar.tsx",
        lineNumber: 28,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = AvatarImage;
AvatarImage.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Image"].displayName;
const AvatarFallback = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Fallback"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/avatar.tsx",
        lineNumber: 40,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = AvatarFallback;
AvatarFallback.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Fallback"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Avatar$React.forwardRef");
__turbopack_context__.k.register(_c1, "Avatar");
__turbopack_context__.k.register(_c2, "AvatarImage$React.forwardRef");
__turbopack_context__.k.register(_c3, "AvatarImage");
__turbopack_context__.k.register(_c4, "AvatarFallback$React.forwardRef");
__turbopack_context__.k.register(_c5, "AvatarFallback");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/textarea.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Textarea",
    ()=>Textarea
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
;
;
;
const Textarea = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/textarea.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Textarea;
Textarea.displayName = "Textarea";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Textarea$React.forwardRef");
__turbopack_context__.k.register(_c1, "Textarea");
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
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dialog",
    ()=>Dialog,
    "DialogClose",
    ()=>DialogClose,
    "DialogContent",
    ()=>DialogContent,
    "DialogDescription",
    ()=>DialogDescription,
    "DialogFooter",
    ()=>DialogFooter,
    "DialogHeader",
    ()=>DialogHeader,
    "DialogOverlay",
    ()=>DialogOverlay,
    "DialogPortal",
    ()=>DialogPortal,
    "DialogTitle",
    ()=>DialogTitle,
    "DialogTrigger",
    ()=>DialogTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@radix-ui/react-dialog/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/x.js [client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/lib/utils.ts [client] (ecmascript)");
"use client";
;
;
;
;
;
const Dialog = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"];
const DialogTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Trigger"];
const DialogPortal = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Portal"];
const DialogClose = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Close"];
const DialogOverlay = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Overlay"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
        lineNumber: 21,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c = DialogOverlay;
DialogOverlay.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Overlay"].displayName;
const DialogContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c1 = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogOverlay, {}, void 0, false, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
                lineNumber: 37,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"], {
                ref: ref,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className),
                ...props,
                children: [
                    children,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Close"], {
                        className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
                                lineNumber: 48,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
                                lineNumber: 49,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
                        lineNumber: 47,
                        columnNumber: 7
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
                lineNumber: 38,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c2 = DialogContent;
DialogContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"].displayName;
const DialogHeader = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 text-center sm:text-left", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
        lineNumber: 60,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c3 = DialogHeader;
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
        lineNumber: 74,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c4 = DialogFooter;
DialogFooter.displayName = "DialogFooter";
const DialogTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c5 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-lg font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
        lineNumber: 88,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c6 = DialogTitle;
DialogTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const DialogDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c7 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$lib$2f$utils$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx",
        lineNumber: 103,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c8 = DialogDescription;
DialogDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
__turbopack_context__.k.register(_c, "DialogOverlay");
__turbopack_context__.k.register(_c1, "DialogContent$React.forwardRef");
__turbopack_context__.k.register(_c2, "DialogContent");
__turbopack_context__.k.register(_c3, "DialogHeader");
__turbopack_context__.k.register(_c4, "DialogFooter");
__turbopack_context__.k.register(_c5, "DialogTitle$React.forwardRef");
__turbopack_context__.k.register(_c6, "DialogTitle");
__turbopack_context__.k.register(_c7, "DialogDescription$React.forwardRef");
__turbopack_context__.k.register(_c8, "DialogDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/button.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/card.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/badge.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/shield.js [client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/award.js [client] (ecmascript) <export default as Award>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/trending-up.js [client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/circle-check.js [client] (ecmascript) <export default as CheckCircle2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/arrow-right.js [client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/zap.js [client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sunrise$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sunrise$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/sunrise.js [client] (ecmascript) <export default as Sunrise>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/clock.js [client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/settings.js [client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/house.js [client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$BlogSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/BlogSection.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$FAQSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/FAQSection.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/@tanstack/react-query/build/modern/useQuery.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/mail.js [client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/phone.js [client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/map-pin.js [client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/play.js [client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2d$icons$2f$si$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/react-icons/si/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/hooks/use-toast.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$calendar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/calendar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/avatar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/textarea.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/input.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/label.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/components/ui/dialog.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/node_modules/lucide-react/dist/esm/icons/x.js [client] (ecmascript) <export default as X>");
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
function Home() {
    _s();
    // Zodiac sign metadata (symbols and colors)
    const zodiacMeta = {
        aries: {
            symbol: "♈",
            color: "from-red-500 to-orange-500"
        },
        taurus: {
            symbol: "♉",
            color: "from-green-600 to-emerald-500"
        },
        gemini: {
            symbol: "♊",
            color: "from-yellow-500 to-amber-500"
        },
        cancer: {
            symbol: "♋",
            color: "from-blue-600 to-cyan-500"
        },
        leo: {
            symbol: "♌",
            color: "from-orange-500 to-red-500"
        },
        virgo: {
            symbol: "♍",
            color: "from-emerald-600 to-teal-500"
        },
        libra: {
            symbol: "♎",
            color: "from-pink-500 to-rose-500"
        },
        scorpio: {
            symbol: "♏",
            color: "from-purple-600 to-indigo-500"
        },
        sagittarius: {
            symbol: "♐",
            color: "from-violet-600 to-purple-500"
        },
        capricorn: {
            symbol: "♑",
            color: "from-slate-600 to-gray-600"
        },
        aquarius: {
            symbol: "♒",
            color: "from-cyan-500 to-blue-500"
        },
        pisces: {
            symbol: "♓",
            color: "from-teal-500 to-green-500"
        }
    };
    // State for horoscope data
    const [horoscope, setHoroscope] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoadingHoroscope, setIsLoadingHoroscope] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Fetch horoscope data from API
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            const fetchHoroscopes = {
                "Home.useEffect.fetchHoroscopes": async ()=>{
                    try {
                        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
                        const response = await fetch(`/api/horoscope?date=${today}`);
                        if (response.ok) {
                            const data = await response.json();
                            // Transform API data to match component format
                            const formattedHoroscopes = data.map({
                                "Home.useEffect.fetchHoroscopes.formattedHoroscopes": (item)=>({
                                        sign: item.sign.charAt(0).toUpperCase() + item.sign.slice(1),
                                        prediction: item.love || "Check back later for your daily prediction.",
                                        symbol: zodiacMeta[item.sign.toLowerCase()]?.symbol || "⭐",
                                        color: zodiacMeta[item.sign.toLowerCase()]?.color || "from-purple-500 to-pink-500"
                                    })
                            }["Home.useEffect.fetchHoroscopes.formattedHoroscopes"]);
                            setHoroscope(formattedHoroscopes);
                        } else {
                            // Fallback to default message if no data
                            setHoroscope(Object.keys(zodiacMeta).map({
                                "Home.useEffect.fetchHoroscopes": (sign)=>({
                                        sign: sign.charAt(0).toUpperCase() + sign.slice(1),
                                        prediction: "Check back later for your daily prediction.",
                                        symbol: zodiacMeta[sign].symbol,
                                        color: zodiacMeta[sign].color
                                    })
                            }["Home.useEffect.fetchHoroscopes"]));
                        }
                    } catch (error) {
                        console.error("Error fetching horoscopes:", error);
                        // Fallback to default message on error
                        setHoroscope(Object.keys(zodiacMeta).map({
                            "Home.useEffect.fetchHoroscopes": (sign)=>({
                                    sign: sign.charAt(0).toUpperCase() + sign.slice(1),
                                    prediction: "Check back later for your daily prediction.",
                                    symbol: zodiacMeta[sign].symbol,
                                    color: zodiacMeta[sign].color
                                })
                        }["Home.useEffect.fetchHoroscopes"]));
                    } finally{
                        setIsLoadingHoroscope(false);
                    }
                }
            }["Home.useEffect.fetchHoroscopes"];
            fetchHoroscopes();
        }
    }["Home.useEffect"], []);
    // State for muhurat data
    const [muhurat, setMuhurat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoadingMuhurat, setIsLoadingMuhurat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Fetch monthly muhurat data from API
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            const fetchMuhurat = {
                "Home.useEffect.fetchMuhurat": async ()=>{
                    try {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const currentMonth = `${year}-${month}`; // YYYY-MM
                        const response = await fetch(`/api/muhurat?month=${currentMonth}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.length > 0) {
                                setMuhurat(data[0]);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching muhurat:", error);
                    } finally{
                        setIsLoadingMuhurat(false);
                    }
                }
            }["Home.useEffect.fetchMuhurat"];
            fetchMuhurat();
        }
    }["Home.useEffect"], []);
    // State for panchang data
    const [panchang, setPanchang] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoadingPanchang, setIsLoadingPanchang] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Fetch daily panchang data from API
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            const fetchPanchang = {
                "Home.useEffect.fetchPanchang": async ()=>{
                    try {
                        const today = new Date().toISOString().split('T')[0];
                        const response = await fetch(`/api/panchang?date=${today}`);
                        if (response.ok) {
                            const data = await response.json();
                            setPanchang(data);
                        }
                    } catch (error) {
                        console.error("Error fetching panchang:", error);
                    } finally{
                        setIsLoadingPanchang(false);
                    }
                }
            }["Home.useEffect.fetchPanchang"];
            fetchPanchang();
        }
    }["Home.useEffect"], []);
    // State for videos
    const { data: videos, isLoading: isLoadingVideos } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "/api/videos"
        ],
        queryFn: {
            "Home.useQuery": async ()=>{
                const response = await fetch("/api/videos");
                if (!response.ok) throw new Error("Failed to fetch videos");
                return response.json();
            }
        }["Home.useQuery"]
    });
    const [selectedImage, setSelectedImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const credentials = [
        {
            image: "/gold medal.jpeg",
            title: "Gold Medalist",
            subtitle: "Jyotish Aacharya",
            colSpan: "lg:row-span-2"
        },
        {
            image: "/award.jpeg",
            title: "Excellence Award",
            subtitle: "Best Astrologer 2023",
            colSpan: "lg:row-span-2"
        },
        {
            image: "/result.jpeg",
            title: "Outstanding Result",
            subtitle: "Proven Track Record",
            colSpan: "lg:row-span-1"
        },
        {
            image: "/degree.jpeg",
            title: "Certified Degree",
            subtitle: "M.A (Astrology)",
            colSpan: "lg:row-span-1"
        }
    ];
    // Booking state
    const [bookingDate, setBookingDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(new Date());
    const [selectedTime, setSelectedTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [consultationType, setConsultationType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const services = [
        {
            id: "horoscope-analysis",
            name: "Horoscope Analysis",
            description: "A comprehensive analysis of your birth chart to provide insights into your personality, health, relationships, marriage, career, and financial gains etc.",
            price: "₹3,000 + 18% GST"
        },
        {
            id: "varshaphala",
            name: "Varshaphala (Annual Forecast)",
            description: "Detailed astrological guidance for one full year. This analysis utilizes your Janma Kundali  (parashari and jaimini systems) combined with your Varsha Kundali to predict yearly trends.",
            price: "₹6,000 + 18% GST"
        },
        {
            id: "muhurta-selection",
            name: "Muhurta Selection",
            description: "Identification of the most auspicious moments for significant life events, including marriage, travel, Griha Pravesh, and business inaugurations.",
            price: "₹6,000 + 18% GST"
        },
        {
            id: "residential-Vaastu",
            name: "Residential Vaastu Analysis",
            description: "A detailed Vaastu report for your home with effective remedies to optimize energy flow, ensuring peace and prosperity.",
            price: "₹20 / sq. ft.+  18% GST"
        },
        {
            id: "commercial-Vaastu",
            name: "Commercial Vaastu Analysis",
            description: "Specialized Vaastu assessment for offices, shops, or factories to identify remedies that remove obstacles and stimulate business growth.",
            price: "₹20 / sq. ft + 18% GST."
        },
        {
            id: "karmic-remedial",
            name: "Astrological (Karmic) Remedial Services",
            description: " Vedic remedies includes Vaastu remedies , garha anusthaan(mantra , hawan ), panch tatwa treatment and yantra therapy",
            price: "₹20,000 + 18% GST"
        }
    ];
    const timeSlots = [
        "11:00 AM",
        "12:00 PM",
        "01:00 PM",
        "02:00 PM",
        "03:00 PM",
        "04:00 PM",
        "05:00 PM",
        "06:00 PM",
        "07:00 PM",
        "08:00 PM"
    ];
    const handleBookingSubmit = (e)=>{
        e.preventDefault();
        const form = e.currentTarget;
        if (!consultationType) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["toast"])({
                title: "Selection Required",
                description: "Please select a consultation service first.",
                variant: "destructive"
            });
            return;
        }
        const name = form.querySelector("#name")?.value;
        const phone = form.querySelector("#phone")?.value;
        const birthDetails = form.querySelector("#birth-details")?.value;
        const birthPlace = form.querySelector("#birth-place")?.value;
        const message = form.querySelector("#message")?.value;
        const whatsappMessage = `Hello Aacharya Om shah,%0A%0AI would like to book a *${consultationType}* consultation.%0A%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Birth Details:* ${birthDetails}%0A*Birth Place:* ${birthPlace}%0A*Preferred Date:* ${bookingDate?.toLocaleDateString()}%0A*Preferred Time:* ${selectedTime}%0A%0A*Additional Message:* ${message || "N/A"}`;
        const adminPhoneNumber = "918527530910";
        window.open(`https://wa.me/${adminPhoneNumber}?text=${whatsappMessage}`, "_blank");
    };
    const features = [
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"],
            title: "100% Authentic",
            description: "All products certified and verified by expert Astrologers"
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$award$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Award$3e$__["Award"],
            title: "Premium Quality",
            description: "Sourced from trusted suppliers with quality assurance"
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"],
            title: "Proven Results",
            description: "Thousands of satisfied customers with life transformations"
        }
    ];
    const categories = [
        {
            name: "Gemstones",
            href: "/products/gemstones",
            image: "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400&h=300&fit=crop",
            description: "Natural certified gemstones"
        },
        {
            name: "Healing Crystals",
            href: "/products/healing-crystals",
            image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
            description: "Powerful healing crystals"
        },
        {
            name: "Rudrakshas",
            href: "/products/rudrakshas",
            image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=300&fit=crop",
            description: "Sacred Rudraksha beads"
        },
        {
            name: "Vaastu Products",
            href: "/products/Vaastu",
            image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
            description: "Energy balancing Vaastu tools"
        },
        {
            name: "Others",
            href: "/products/others",
            image: "/astro-remedies-for-all-sun-signs-2025-1733308932583.jpg",
            description: "Other spiritual items"
        }
    ];
    const benefits = [
        "Expert astrology consultations",
        "Certified authentic products",
        "Personalized recommendations",
        "Secure online payments",
        "Fast & safe delivery",
        "100% satisfaction guarantee"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Vedic Intution - Premium Gemstones, Spiritual Guidance & Authentic Remedies"
                }, void 0, false, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                    lineNumber: 299,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                lineNumber: 298,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "relative h-screen flex items-center justify-center overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 w-full h-full",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                        className: "absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2",
                                        autoPlay: true,
                                        muted: true,
                                        loop: true,
                                        playsInline: true,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("source", {
                                            src: "/videoplayback.mp4",
                                            type: "video/mp4"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 312,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 305,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 bg-gradient-to-b from-blue-950/95 via-blue-950/90 to-slate-950/95"
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 314,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                lineNumber: 304,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative z-10 container mx-auto px-4 lg:px-8 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].h1, {
                                        initial: {
                                            opacity: 0,
                                            y: 20
                                        },
                                        animate: {
                                            opacity: 1,
                                            y: 0
                                        },
                                        transition: {
                                            duration: 0.8
                                        },
                                        className: "font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 max-w-4xl mx-auto leading-tight",
                                        children: [
                                            "Decode Your ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-accent",
                                                children: "Prārabdha"
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 324,
                                                columnNumber: 27
                                            }, this),
                                            " to ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 324,
                                                columnNumber: 77
                                            }, this),
                                            "Engineer Your ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-accent",
                                                children: "Karma"
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 325,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 318,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].p, {
                                        initial: {
                                            opacity: 0,
                                            y: 20
                                        },
                                        animate: {
                                            opacity: 1,
                                            y: 0
                                        },
                                        transition: {
                                            duration: 0.8,
                                            delay: 0.2
                                        },
                                        className: "text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed",
                                        children: "Expert Vedic Astrology & Vaastu Consultation through scientific remedies to guide your journey to holistic prosperity!"
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 328,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        initial: {
                                            opacity: 0,
                                            y: 20
                                        },
                                        animate: {
                                            opacity: 1,
                                            y: 0
                                        },
                                        transition: {
                                            duration: 0.8,
                                            delay: 0.4
                                        },
                                        className: "flex flex-col sm:flex-row gap-4 justify-center items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/products",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    size: "lg",
                                                    className: "bg-accent text-accent-foreground hover:bg-accent/90 min-w-[200px]",
                                                    children: [
                                                        "Explore Products",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                            className: "ml-2 h-4 w-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 346,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 344,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 343,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/book-appointment",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    size: "lg",
                                                    className: "bg-accent text-accent-foreground hover:bg-accent/90 min-w-[200px]",
                                                    children: [
                                                        "Book Consultation",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                            className: "ml-2 h-4 w-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 352,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 349,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 337,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                lineNumber: 317,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 303,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-background overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            initial: {
                                                opacity: 0,
                                                x: -50
                                            },
                                            whileInView: {
                                                opacity: 1,
                                                x: 0
                                            },
                                            viewport: {
                                                once: true
                                            },
                                            transition: {
                                                duration: 0.8
                                            },
                                            className: "relative flex justify-center order-2 lg:order-1",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "max-w-md w-full aspect-[4/5] rounded-2xl overflow-hidden border-8 border-muted shadow-2xl relative cursor-pointer group",
                                                onClick: ()=>setSelectedImage("/WhatsApp Image 2026-01-03 at 17.07.18.jpeg"),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: "/WhatsApp Image 2026-01-03 at 17.07.18.jpeg",
                                                        alt: "Aacharya Om shah",
                                                        className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 374,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 375,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 370,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 363,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            initial: {
                                                opacity: 0,
                                                x: 50
                                            },
                                            whileInView: {
                                                opacity: 1,
                                                x: 0
                                            },
                                            viewport: {
                                                once: true
                                            },
                                            transition: {
                                                duration: 0.8
                                            },
                                            className: "order-1 lg:order-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                    className: "bg-accent/10 text-accent mb-6 px-4 py-1.5 uppercase tracking-wider font-semibold",
                                                    children: "Vedic Astrologer & Vaastu consultant"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 385,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "font-serif text-5xl md:text-6xl font-bold mb-8 leading-tight",
                                                    children: [
                                                        "Aacharya ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-accent italic",
                                                            children: "Om shah"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 387,
                                                            columnNumber: 28
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-8 text-lg text-muted-foreground leading-relaxed",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "border-l-4 border-accent/30 pl-6 py-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-bold text-foreground",
                                                                    children: "Aacharya Om shah"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 392,
                                                                    columnNumber: 21
                                                                }, this),
                                                                " is a ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-[#D4AF37] font-extrabold underline decoration-accent/20",
                                                                    children: "Gold medalist"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 392,
                                                                    columnNumber: 94
                                                                }, this),
                                                                " Astrologer from K.N.Rao Institute of Astrology, Bharati Vidya Bhavan, New Delhi."
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 391,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            children: [
                                                                "He holds ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-foreground font-medium",
                                                                    children: "M.A. (Astrology)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 396,
                                                                    columnNumber: 30
                                                                }, this),
                                                                " and ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                                    children: "Diploma"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 396,
                                                                    columnNumber: 104
                                                                }, this),
                                                                " in ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-foreground font-medium",
                                                                    children: "(Vaastu Shastra)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 396,
                                                                    columnNumber: 122
                                                                }, this),
                                                                " and ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-foreground font-medium",
                                                                    children: "(Medical Astrology)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 396,
                                                                    columnNumber: 196
                                                                }, this),
                                                                " from BVB Delhi and SLBS National Sanskrit University, respectively. Aacharya shah is an ex-microbiologist , ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                                    children: "M.Sc. (Microbiology)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 397,
                                                                    columnNumber: 61
                                                                }, this),
                                                                " and ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                                                    children: "Pre-PhD (Molecular Medicine)."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 397,
                                                                    columnNumber: 93
                                                                }, this),
                                                                " ",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 397,
                                                                    columnNumber: 130
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 398,
                                                                    columnNumber: 21
                                                                }, this),
                                                                " With Over 6 years of experience in Vedic Astrology and Vaastu Shastra, he brings remarkable changes in one's life using his astrological predictions, Vaastu, and karmic remedies."
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 395,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 378,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 362,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-32",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center mb-16",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-accent text-sm font-bold tracking-widest uppercase mb-2 block",
                                                    children: "Excellence"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 409,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-serif text-4xl font-bold mb-4",
                                                    children: "Academic Excellence & Recognition"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 410,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-24 h-1 bg-accent mx-auto"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 411,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 408,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]",
                                            children: credentials.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                    initial: {
                                                        opacity: 0,
                                                        y: 30
                                                    },
                                                    whileInView: {
                                                        opacity: 1,
                                                        y: 0
                                                    },
                                                    viewport: {
                                                        once: true
                                                    },
                                                    transition: {
                                                        duration: 0.6,
                                                        delay: index * 0.1
                                                    },
                                                    className: `relative group overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer ${item.colSpan || ""}`,
                                                    onClick: ()=>setSelectedImage(item.image),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: item.image,
                                                            alt: item.title,
                                                            className: "w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 425,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                        className: "text-white font-serif text-2xl font-bold mb-1",
                                                                        children: item.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 432,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-white/80 text-sm tracking-wide font-light",
                                                                        children: item.subtitle
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 433,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 431,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 430,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, index, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 416,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 414,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 407,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 361,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 360,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-muted/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-serif text-4xl font-bold mb-4",
                                            children: "Book Your Consultation"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 448,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg max-w-2xl mx-auto",
                                            children: "Get personalized astrology guidance from our expert Astrologers"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 449,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 447,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "lg:col-span-1",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                                className: "h-full",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                    className: "p-6 text-center space-y-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "relative mb-2",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Avatar"], {
                                                                className: "w-32 h-32 mx-auto border-4 border-accent/20",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["AvatarImage"], {
                                                                        src: "/WhatsApp Image 2026-01-03 at 17.07.18.jpeg",
                                                                        className: "object-cover"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 458,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$avatar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["AvatarFallback"], {
                                                                        children: "AOS"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 459,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 457,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 456,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                    className: "font-serif text-2xl font-bold",
                                                                    children: "Aacharya Om shah"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 463,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-accent font-medium text-sm",
                                                                    children: "Astro & Vaastu Consultant"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 464,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-muted-foreground text-xs italic",
                                                                    children: "(Karmic Consultant)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 465,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 462,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "space-y-3 text-[11px] text-muted-foreground border-t pt-4 text-left",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "flex items-start gap-3",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                                            variant: "outline",
                                                                            className: "w-[60px] h-4 px-0 justify-center text-[9px] uppercase flex-shrink-0",
                                                                            children: "Acharya"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                            lineNumber: 470,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "flex-1",
                                                                            children: "Jyotish, BVB-Delhi (Gold Medal)"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                            lineNumber: 471,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 469,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "flex items-start gap-3",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                                            variant: "outline",
                                                                            className: "w-[60px] h-4 px-0 justify-center text-[9px] uppercase flex-shrink-0",
                                                                            children: "Diploma"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                            lineNumber: 474,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "flex-1",
                                                                            children: "Medical Astrology, Vaastu Shastra & Palmistry"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                            lineNumber: 475,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 473,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "flex items-start gap-3",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                                            variant: "outline",
                                                                            className: "w-[60px] h-4 px-0 justify-center text-[9px] uppercase flex-shrink-0",
                                                                            children: "Academic"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                            lineNumber: 478,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "flex-1",
                                                                            children: [
                                                                                "M.A.(Astrology) ",
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                    lineNumber: 479,
                                                                                    columnNumber: 66
                                                                                }, this),
                                                                                " M.Sc.(Microbiology), Pre-PhD (Molecular Medicine)"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                            lineNumber: 479,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 477,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 468,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "pt-4 border-t",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-muted-foreground mb-1 uppercase tracking-wider",
                                                                    children: "Consultation Fee"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 484,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "font-bold text-accent text-2xl",
                                                                    children: services.find((s)=>s.name === consultationType)?.price || "Select Service"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 485,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 483,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 455,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 454,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 453,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "lg:col-span-2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                    className: "p-8",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                        onSubmit: handleBookingSubmit,
                                                        className: "space-y-6",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                children: "Full Name"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 499,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                                id: "name",
                                                                                placeholder: "Your Name",
                                                                                required: true
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 500,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 498,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                children: "Phone Number"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 503,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                                id: "phone",
                                                                                placeholder: "Your Phone",
                                                                                required: true
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 504,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 502,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                children: "Date & Time of Birth"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 507,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                                id: "birth-details",
                                                                                placeholder: "15 Aug 1990, 10:30 AM",
                                                                                required: true
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 508,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 506,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                children: "Place of Birth"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 511,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                                id: "birth-place",
                                                                                placeholder: "City, State, Country",
                                                                                required: true
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 512,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 510,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 497,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "space-y-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                        children: "Select Service"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 517,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "grid grid-cols-1 gap-3",
                                                                        children: services.map((service)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                onClick: ()=>setConsultationType(service.name),
                                                                                className: `p-4 rounded-lg border-2 cursor-pointer transition-all ${consultationType === service.name ? "border-accent bg-accent/5" : "border-border"}`,
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "flex justify-between items-center mb-1",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                                className: "font-bold",
                                                                                                children: service.name
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                                lineNumber: 527,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "text-accent font-bold",
                                                                                                children: service.price
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                                lineNumber: 528,
                                                                                                columnNumber: 33
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                        lineNumber: 526,
                                                                                        columnNumber: 31
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        className: "text-xs text-muted-foreground",
                                                                                        children: service.description
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                        lineNumber: 530,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, service.id, true, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 520,
                                                                                columnNumber: 29
                                                                            }, this))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 518,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 516,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                children: "Select Date"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 538,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "border rounded-md p-2 flex justify-center bg-background",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$calendar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Calendar"], {
                                                                                    mode: "single",
                                                                                    selected: bookingDate,
                                                                                    onSelect: setBookingDate,
                                                                                    disabled: (d)=>d < new Date() || d.getDay() === 0
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                    lineNumber: 540,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 539,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 537,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-4",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                children: "Select Time"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 549,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "grid grid-cols-2 gap-2",
                                                                                children: timeSlots.map((time)=>{
                                                                                    const isUnavailable = [
                                                                                        "11:00 AM",
                                                                                        "12:00 PM",
                                                                                        "01:00 PM",
                                                                                        "02:00 PM",
                                                                                        "03:00 PM"
                                                                                    ].includes(time);
                                                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                                        type: "button",
                                                                                        variant: selectedTime === time ? "default" : "outline",
                                                                                        onClick: ()=>!isUnavailable && setSelectedTime(time),
                                                                                        disabled: isUnavailable,
                                                                                        className: `text-xs relative ${isUnavailable ? "opacity-60 bg-muted cursor-not-allowed border-dashed" : ""}`,
                                                                                        children: [
                                                                                            time,
                                                                                            isUnavailable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "absolute -top-2 -right-1 bg-destructive text-[8px] text-white px-2 rounded-full uppercase",
                                                                                                children: "Unavailable"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                                lineNumber: 564,
                                                                                                columnNumber: 37
                                                                                            }, this)
                                                                                        ]
                                                                                    }, time, true, {
                                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                        lineNumber: 554,
                                                                                        columnNumber: 33
                                                                                    }, this);
                                                                                })
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 550,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "space-y-2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                                        children: "Additional Message"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                        lineNumber: 571,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                                                                        id: "message",
                                                                                        placeholder: "Optional questions...",
                                                                                        rows: 3
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                        lineNumber: 572,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                                lineNumber: 570,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 548,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 536,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                type: "submit",
                                                                size: "lg",
                                                                className: "w-full bg-accent hover:bg-accent/90",
                                                                children: "Book via WhatsApp"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 577,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 496,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 495,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 494,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 493,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 452,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 446,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 445,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-background",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-serif text-4xl font-bold mb-4",
                                            children: "Purchase Authentic Products"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 592,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg max-w-2xl mx-auto",
                                            children: "Sourced and certified by experts for your spiritual growth"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 593,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 591,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6",
                                    children: categories.map((category, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: category.href,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                whileHover: {
                                                    y: -10
                                                },
                                                transition: {
                                                    duration: 0.3
                                                },
                                                className: "group cursor-pointer",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: category.image,
                                                            alt: category.name,
                                                            className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 605,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 606,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute bottom-4 left-4",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "text-white font-bold text-lg",
                                                                children: category.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 608,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 607,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 604,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 599,
                                                columnNumber: 19
                                            }, this)
                                        }, index, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 598,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 596,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 590,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 589,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-muted/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-serif text-4xl font-bold mb-4",
                                            children: "Vedic Intuition Blogs"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 622,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg",
                                            children: "Knowledge and wisdom for your modern lifestyle"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 623,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 621,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$BlogSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["BlogSection"], {
                                    limit: 3
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 625,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mt-12",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/blog",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            size: "lg",
                                            children: "View All Blogs"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 628,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 627,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 626,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 620,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 619,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-background",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-serif text-4xl font-bold mb-4",
                                            children: "Vedic Intuition Videos"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 638,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg",
                                            children: "Watch guidances and insights from Aacharya Om Shah"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 639,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 637,
                                    columnNumber: 13
                                }, this),
                                isLoadingVideos ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse",
                                    children: [
                                        1,
                                        2,
                                        3
                                    ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "aspect-video bg-muted rounded-xl"
                                        }, i, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 644,
                                            columnNumber: 37
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 643,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-3 gap-8",
                                    children: videos?.slice(0, 3).map((video)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            whileHover: {
                                                scale: 1.02
                                            },
                                            className: "group",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                href: video.youtubeUrl,
                                                target: "_blank",
                                                rel: "noopener noreferrer",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "relative aspect-video rounded-xl overflow-hidden shadow-xl mb-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                src: video.thumbnailUrl,
                                                                alt: video.title,
                                                                className: "w-full h-full object-cover"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 652,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white shadow-2xl",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                                                        className: "fill-current w-6 h-6 ml-1"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 655,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 654,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 653,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 651,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "font-serif text-xl font-bold line-clamp-2",
                                                        children: video.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 659,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 650,
                                                columnNumber: 21
                                            }, this)
                                        }, video.id, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 649,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 647,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mt-12",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/videos",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            size: "lg",
                                            children: "See More Videos"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 667,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 666,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 665,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 636,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 635,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-muted/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-center gap-3 mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
                                                    className: "text-accent h-8 w-8"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 678,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "font-serif text-4xl font-bold",
                                                    children: "Daily Horoscope"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 679,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
                                                    className: "text-accent h-8 w-8"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 680,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 677,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg max-w-2xl mx-auto",
                                            children: "Discover what the stars have in store for you today"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 682,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 676,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
                                    children: horoscope.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "transition-all hover:border-accent hover:shadow-lg group",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "p-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col items-center text-center space-y-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `w-20 h-20 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-4xl shadow-xl transform transition-transform group-hover:scale-110`,
                                                            children: item.symbol
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 690,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                    className: "font-bold text-accent text-xl mb-2",
                                                                    children: item.sign
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 694,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-muted-foreground line-clamp-3",
                                                                    children: item.prediction
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 695,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 693,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 689,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 688,
                                                columnNumber: 19
                                            }, this)
                                        }, index, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 687,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 685,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 675,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 674,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-background",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-center gap-3 mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                    className: "text-accent h-8 w-8"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 710,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "font-serif text-4xl font-bold",
                                                    children: "Today's Panchang"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 711,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                    className: "text-accent h-8 w-8"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 712,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 709,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg max-w-2xl mx-auto",
                                            children: new Date().toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 714,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 708,
                                    columnNumber: 13
                                }, this),
                                panchang ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto",
                                    children: [
                                        {
                                            l: "Tithi",
                                            v: panchang.tithi,
                                            s: "तिथि"
                                        },
                                        {
                                            l: "Vaar",
                                            v: panchang.vaar,
                                            s: "वार"
                                        },
                                        {
                                            l: "Nakshatra",
                                            v: panchang.nakshatr,
                                            s: "नक्षत्र"
                                        },
                                        {
                                            l: "Yoga",
                                            v: panchang.yoga,
                                            s: "योग"
                                        }
                                    ].map((x, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "bg-muted/20 border-accent/10",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "p-8 text-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs uppercase tracking-widest text-muted-foreground mb-2",
                                                        children: x.l
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 729,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-serif text-2xl font-bold text-accent mb-1",
                                                        children: x.v || "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 730,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-[10px] text-muted-foreground opacity-60",
                                                        children: x.s
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 731,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 728,
                                                columnNumber: 21
                                            }, this)
                                        }, i, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 727,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 720,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center p-12 bg-muted/20 rounded-2xl max-w-2xl mx-auto",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-muted-foreground",
                                        children: "Panchang data not available for today."
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 738,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 737,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 707,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 706,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-muted/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-center gap-3 mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sunrise$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sunrise$3e$__["Sunrise"], {
                                                    className: "text-accent h-8 w-8"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 749,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "font-serif text-4xl font-bold",
                                                    children: "Auspicious Muhurat"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 750,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sunrise$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sunrise$3e$__["Sunrise"], {
                                                    className: "text-accent h-8 w-8"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 751,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 748,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg max-w-2xl mx-auto",
                                            children: "Plan your auspicious beginnings with divine timing"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 753,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 747,
                                    columnNumber: 13
                                }, this),
                                muhurat ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "bg-background",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "p-8 space-y-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start gap-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "p-3 bg-accent/10 rounded-xl text-accent",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle2$3e$__["CheckCircle2"], {
                                                                className: "h-6 w-6"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 762,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 761,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1",
                                                                    children: "General Auspicious Days"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 765,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-lg font-medium leading-relaxed",
                                                                    children: muhurat.auspiciousDays
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 766,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 764,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 760,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 759,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 758,
                                            columnNumber: 17
                                        }, this),
                                        muhurat.newHome && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "bg-background",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "p-8 space-y-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start gap-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "p-3 bg-accent/10 rounded-xl text-accent",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"], {
                                                                className: "h-6 w-6"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 777,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 776,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1",
                                                                    children: "Griha Pravesh (New Home)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 780,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-lg font-medium leading-relaxed",
                                                                    children: muhurat.newHome
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 781,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 779,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 775,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 774,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 773,
                                            columnNumber: 19
                                        }, this),
                                        muhurat.vehiclePurchase && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                            className: "bg-background md:col-span-2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "p-8 space-y-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-start gap-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "p-3 bg-accent/10 rounded-xl text-accent",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                                className: "h-6 w-6"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 793,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 792,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-1",
                                                                    children: "Vehicle Purchase"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 796,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-lg font-medium leading-relaxed",
                                                                    children: muhurat.vehiclePurchase
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 797,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 795,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 791,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 790,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 789,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 757,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center p-12 bg-background/50 rounded-2xl max-w-2xl mx-auto border border-dashed border-muted-foreground/30",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-muted-foreground",
                                        children: "No auspicious muhurats listed for this month."
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 806,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 805,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 746,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 745,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-background",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "max-w-6xl mx-auto shadow-2xl rounded-3xl overflow-hidden bg-muted/10 border border-muted flex flex-col lg:flex-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "lg:w-1/2 p-12 bg-primary text-primary-foreground space-y-8",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        className: "font-serif text-4xl font-bold mb-4",
                                                        children: "Get in Touch"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 818,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-primary-foreground/80 leading-relaxed",
                                                        children: "We're here to answer your questions and guide you on your spiritual journey. Reach out to us through any channel."
                                                    }, void 0, false, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 819,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 817,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"], {
                                                                    className: "w-5 h-5"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 827,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 826,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs opacity-70",
                                                                        children: "Phone"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 830,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "font-bold",
                                                                        children: "+91 85275 30910"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 831,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 829,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 825,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                                    className: "w-5 h-5"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 836,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 835,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs opacity-70",
                                                                        children: "Email"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 839,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "font-bold",
                                                                        children: "acharyaomshah@gmail.com"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 840,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 838,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 834,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                    className: "w-5 h-5"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                    lineNumber: 845,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 844,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs opacity-70",
                                                                        children: "Address"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 848,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "font-bold",
                                                                        children: "Greater Noida, India"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                        lineNumber: 849,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 847,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 843,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 824,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pt-8",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: "https://wa.me/918527530910",
                                                    target: "_blank",
                                                    rel: "noopener noreferrer",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "lg",
                                                        className: "w-full bg-green-600 hover:bg-green-700 text-white",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2d$icons$2f$si$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["SiWhatsapp"], {
                                                                className: "w-5 h-5 mr-3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                                lineNumber: 857,
                                                                columnNumber: 23
                                                            }, this),
                                                            "Chat on WhatsApp"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                        lineNumber: 856,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 855,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                lineNumber: 854,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 816,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "lg:w-1/2 p-12 bg-background",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            htmlFor: "c-name",
                                                            children: "Full Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 867,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                            id: "c-name",
                                                            placeholder: "Your Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 868,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 866,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            htmlFor: "c-email",
                                                            children: "Email Address"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 871,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                            id: "c-email",
                                                            type: "email",
                                                            placeholder: "Your Email"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 872,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 870,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$label$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                            htmlFor: "c-message",
                                                            children: "How can we help you?"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 875,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$textarea$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                                            id: "c-message",
                                                            placeholder: "Your message here...",
                                                            rows: 6
                                                        }, void 0, false, {
                                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                            lineNumber: 876,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 874,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    className: "w-full",
                                                    size: "lg",
                                                    children: "Send Message"
                                                }, void 0, false, {
                                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                                    lineNumber: 878,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 865,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                        lineNumber: 864,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                lineNumber: 815,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 814,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 813,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "py-24 bg-muted/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "container mx-auto px-4 lg:px-8 max-w-4xl",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center mb-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-serif text-3xl md:text-3xl font-bold mb-4",
                                            children: "Frequently Asked Questions"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 889,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground text-lg",
                                            children: "Everything you need to know about our products and services"
                                        }, void 0, false, {
                                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                            lineNumber: 892,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 888,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$FAQSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["FAQSection"], {}, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 897,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                            lineNumber: 887,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 886,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                lineNumber: 301,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["Dialog"], {
                open: !!selectedImage,
                onOpenChange: ()=>setSelectedImage(null),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["DialogContent"], {
                    className: "max-w-[90vw] md:max-w-[80vw] lg:max-w-4xl p-0 bg-transparent border-none shadow-none text-white overflow-hidden flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full h-[80vh]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSelectedImage(null),
                                className: "absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors",
                                "aria-label": "Close image",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-8 h-8"
                                }, void 0, false, {
                                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                    lineNumber: 910,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                lineNumber: 905,
                                columnNumber: 13
                            }, this),
                            selectedImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: selectedImage,
                                alt: "Full view",
                                className: "w-full h-full object-contain"
                            }, void 0, false, {
                                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                                lineNumber: 913,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                        lineNumber: 904,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                    lineNumber: 903,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx",
                lineNumber: 902,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(Home, "TxbWdf5+1yMRkUZrctPgVvKlfj0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Testing$2f$AstroWeb$2d$7ae30bc1f7a1605f38f538a70a5f77df29722c38$2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Testing/AstroWeb-7ae30bc1f7a1605f38f538a70a5f77df29722c38/src/pages/index.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__74da4e12._.js.map