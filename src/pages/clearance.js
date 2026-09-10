import { useEffect, useState } from "react";

// ══════════════════════════════════════════════════════════════════
// CLEARANCE LEDGER
// ──────────────────────────────────────────────────────────────────
// Tiny in-memory tracker for the site-wide puzzle hunt. Each page
// "marks" its own stage id once its puzzle is solved. Nothing here
// knows or cares what the puzzle actually is — that logic lives on
// each page and just calls markStage() when satisfied.
//
// Deliberately module-scoped state, not localStorage: progress
// persists while navigating between pages (client-side routing keeps
// this module alive), but resets the moment the browser actually
// reloads the page — that's intentional, not a bug.
//
// Order here mirrors Home's own case index (Committee -> Events ->
// Partnerships -> Contact), which is also the order the diamonds are
// drawn in on Home.
// ══════════════════════════════════════════════════════════════════

const EVENT_NAME = "mis-clearance-update";

export const STAGES = ["committee", "events", "partnerships", "contact"];

let stageState = new Set();

/**
 * Call this the instant a page's puzzle is solved. Safe to call more
 * than once — it's a no-op if that stage is already marked.
 */
export function markStage(id) {
  if (!STAGES.includes(id)) return;
  if (stageState.has(id)) return;
  stageState = new Set(stageState).add(id);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function isAllComplete(stages) {
  return STAGES.every((id) => stages.has(id));
}

/**
 * React hook — returns the live Set of solved stage ids. Updates
 * automatically whenever any page (including this one) marks a stage.
 */
export function useClearance() {
  const [stages, setStages] = useState(() => stageState);

  useEffect(() => {
    const onUpdate = () => setStages(stageState);
    window.addEventListener(EVENT_NAME, onUpdate);
    return () => window.removeEventListener(EVENT_NAME, onUpdate);
  }, []);

  return stages;
}

/** True if a keydown's target is a text input — used to make sure
 * global "type a letter anywhere" listeners don't fire while someone
 * is actually typing into a real form field. */
export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

// Dev-only console escape hatch while testing: window.__resetClearance()
if (typeof window !== "undefined") {
  window.__resetClearance = () => {
    stageState = new Set();
    window.dispatchEvent(new Event(EVENT_NAME));
  };
}