---
name: Terminology conventions
description: User-facing developer terminology replacing AI/sci-fi phrases
---

**Replacements applied system-wide:**
- "Sentinel" (tab label) → "Alpha Monitor"  
- "Sentinel Monitor" (page title) → "Alpha Monitor"
- "Kill Switch" / "Abuse Auto-Kill Switch" (card label) → "Circuit Breaker"
- "Self-Healing Pool" (card label) → "Node Recovery Pool"
- "Sentinel Engine · All systems nominal" (status banner) → "Alpha Monitor · All systems nominal"
- "IP Reputation Sentinel" (card label) → "IP Reputation Tracker"
- "[Sentinel]" (event log prefix) → "[alpha]"
- "[Kill Switch]" (event log prefix) → "[circuit-breaker]"
- "[Self-Heal]" (event log prefix) → "[auto-recovery]"
- source field in webhook payload: "proxies_sx_sentinel" → "proxies_sx_alpha_monitor"

**Internal identifiers kept unchanged (internal routing/types only):**
- Tab id `"sentinel"` (routing id, never shown to user)
- TypeScript type `SentinelState` / `MonitorState` (exported as alias)
- Constant `SENTINEL_EVENTS` (internal array name)
- React type union `"sentinel"` within `NotifEvent` (internal icon/color map key)

**Why:** User requested developer-familiar naming (alpha, omega, etc.) over marketing AI phrases.
**How to apply:** New user-facing labels for monitoring features use "Alpha Monitor", "Circuit Breaker", "Node Recovery Pool". Internal code ids can stay as-is.
