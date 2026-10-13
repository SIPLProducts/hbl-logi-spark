// Carries the Supply ("with") / Other than Supply ("without") mode forward when a screen's
// "Save & Next" / "Save & Previous" moves to the neighbouring LE screen, so that screen opens
// with Outward + the same mode already selected.
//
// It is a one-time, in-memory hand-off: the receiving screen reads it once when it opens and
// it is then discarded. Nothing is stored in the browser, and opening a screen from the menu
// is unaffected (it opens unselected, as before). A hand-off nobody picks up expires quickly.

import { useEffect } from "react";

export type HandOffSapMode = "with" | "without";

const HANDOFF_TTL_MS = 10_000;

let pending: { mode: HandOffSapMode; at: number } | null = null;

/** Call right before Save & Next / Save & Previous navigates to the neighbouring screen. */
export function handOffSapMode(mode: string | null | undefined) {
  pending = mode === "with" || mode === "without" ? { mode, at: Date.now() } : null;
}

/** Mode handed over by the previous screen's Save & Next / Previous, if any (not consumed). */
export function getHandedOffSapMode(): HandOffSapMode | null {
  if (!pending) return null;
  if (Date.now() - pending.at > HANDOFF_TTL_MS) {
    pending = null;
    return null;
  }
  return pending.mode;
}

/** Initial Direction for a screen that received a hand-off (Save & Next flows are Outward). */
export function getHandedOffDirection(): "outward" | null {
  return getHandedOffSapMode() ? "outward" : null;
}

/** Discard the hand-off once the receiving screen has opened, so it's used only once. */
export function useConsumeSapModeHandOff() {
  useEffect(() => {
    pending = null;
  }, []);
}
