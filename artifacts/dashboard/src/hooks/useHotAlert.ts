import { useState, useEffect, useRef, useCallback } from "react";
import type { Lead } from "./useLeads";

export function useHotAlert(
  leads: Lead[],
  soundEnabled: boolean,
  onNewHotLeads: (newLeads: Lead[]) => void,
) {
  const prevHotIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isFirstLoad = useRef(true);
  const [flashActive, setFlashActive] = useState(false);

  // Initialize AudioContext on first user interaction (browser policy)
  useEffect(() => {
    const init = () => {
      if (!audioCtxRef.current) {
        try { audioCtxRef.current = new AudioContext(); } catch {}
      }
    };
    window.addEventListener("pointerdown", init, { once: true });
    return () => window.removeEventListener("pointerdown", init);
  }, []);

  const playPing = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      // Two ascending tones — like a notification chime
      const tones = [880, 1108.73];
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.18;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.32);
      });
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    if (!leads.length) return;

    const hotLeads = leads.filter((l) => l.tier === "hot");

    if (isFirstLoad.current) {
      // Seed the set without triggering alerts
      for (const l of hotLeads) prevHotIds.current.add(l.id);
      isFirstLoad.current = false;
      return;
    }

    const newHotLeads = hotLeads.filter((l) => !prevHotIds.current.has(l.id));
    for (const l of hotLeads) prevHotIds.current.add(l.id);

    if (newHotLeads.length === 0) return;

    // Fire alerts
    playPing();

    setFlashActive(true);
    const clearFlash = setTimeout(() => setFlashActive(false), 2000);

    // Flash browser tab title
    const origTitle = document.title;
    document.title = `🔥 ${newHotLeads.length} New Hot Signal${newHotLeads.length > 1 ? "s" : ""}!`;
    const clearTitle = setTimeout(() => { document.title = origTitle; }, 5_000);

    onNewHotLeads(newHotLeads);

    return () => {
      clearTimeout(clearFlash);
      clearTimeout(clearTitle);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads.length]);

  return { flashActive };
}
