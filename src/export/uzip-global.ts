// png2icons' UPNG assigns the undeclared global UZIP, which a strict bundle
// rejects; imported before png2icons so the global exists
;(globalThis as any).UZIP ??= null
