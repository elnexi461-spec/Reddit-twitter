---
name: Sovereign Operator architecture
description: Live mode overhaul — active command center replaces passive states; data normalization + export pipeline; mobile hamburger nav
---

## Rule
In Live Mode the dashboard is an **active command center**, not a passive listener:
- `ControlBar` renders above tab content showing ENGINE IDLE / HARVESTING status + "Execute Mining Matrix" CTA
- `DataArbitragePanel` renders below tab content with live stats (total outputs, KB payload, market %) + streaming terminal log + Export JSON/CSV buttons
- All `LiveEmptyState` components removed — every tab shows its real component in both demo and live mode (HomeFeed handles the demo/live distinction internally via `mode` prop)

## Key Files
- `src/hooks/useMiningEngine.ts` — manages MiningStatus ("idle"|"harvesting"|"complete"), TerminalEntry[] stream, 28-step mining script with realistic delays
- `src/hooks/useNormalizedData.ts` — normalizeLeads(Lead[]) → NormalizedLead[], computeStats() → NormalizedStats; exportAsJSON/exportAsCSV for client-side downloads
- `src/components/ControlBar.tsx` — live mode sub-header with animated status badge + Execute Mining Matrix button
- `src/components/DataArbitragePanel.tsx` — "Data Arbitrage Ingress" bulk hub; TerminalLog component shows streaming entries with color-coded level prefixes
- `src/components/MobileTabMenu.tsx` — hamburger slide-up sheet showing all 10 tabs in 2-column grid
- `src/components/tabs/HomeFeed.tsx` — CopyPayloadButton added per row (normalizes single lead → clipboard JSON with checkmark animation)

## Mobile hamburger
- `BottomNav` component removed from rendering; `MobileTabMenu` overlay triggered by hamburger button in mobile top bar
- All 10 tabs accessible from hamburger sheet; active tab gets green accent; hot count badge on feed tab

## Normalized schema
```typescript
interface NormalizedLead {
  target_id: string;        // FNV-1a hash of URL
  company_name: string;     // extracted from title or keyword-derived
  intent_source: "registry_tracking" | "job_board_scraping" | "infrastructure_fingerprint";
  signal_strength: "Low" | "Medium" | "High";  // score ≥80 High, ≥60 Medium
  extracted_metadata: { packages?, keyword?, raw_title?, url?, score?, source_platform? };
  discovery_timestamp: string; // ISO 8601
}
```

**Why:** User requested removal of all "passive ingress" states in live mode, replacing them with an active operator command center that drives real data collection, normalization, and export.

**How to apply:** Any new tab content should render normally in both demo and live mode. The ControlBar/DataArbitragePanel wrap around the entire tab area — no per-tab special casing needed.
