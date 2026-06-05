---
name: Telemetry tab (Client Telemetry Visualizer)
description: Architecture and TypeScript gotchas for the enterprise telemetry tab.
---

## Tab config
- Tab id: `"telemetry"` — added to the Tab union type in `dashboard.tsx`
- Icon: `Gauge` from lucide-react
- Component: `TelemetryVisualizer` from `@/components/tabs/TelemetryVisualizer`
- Hook: `useTelemetry` from `@/hooks/useTelemetry`

## Architecture
Entirely frontend-simulated — no API calls. The `useTelemetry` hook runs a `setInterval(1800ms)` tick that drifts:
- 8 domains' active slot counts (0–100 cap)
- RPS (60–280)
- Credit multiplier request counts
- Sentinel event log (warning/critical/recovery/info events)

## Key features
1. 3 metric cards: API Gateway Throughput (RPS sparkline), Active Concurrency Slots (radial ring), Aggregated Cost Efficiency (credits saved)
2. Domain Concurrency table with animated progress bars + risk badges (safe/warning/critical)
3. Credit Multiplier Breakdown (1x Standard, 5x JS Render, 10x Stealth, 25x Premium Residential)
4. Rate-Limit Pre-Emptive Sentinel log panel — scrolls to top on new events
5. "Test Auto-Throttling Loop" button — manually triggers throttle, shows collision banner, auto-recovers after 4s

## TypeScript gotcha
When building `SentinelEvent` arrays inline inside `setState` callbacks, the `kind` field is widened to `string` by TypeScript inference. Must use `as const`: `kind: "critical" as const`.

**Why:** TypeScript infers object literal properties as their base type (`string`) when mixed with computed values in array spread expressions unless `as const` is applied.
