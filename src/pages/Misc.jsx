import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Misc.css";

const LINES = [
  "The kitchen didn't look like a kitchen. No ranges, no ticket rail, no steel counters slicked with the evening's service. Just dark, and a sound like breathing that wasn't quite breathing.",
  "\"H- hello?\" It came out smaller than they meant it to.",
  "█████████████████████.",
  "\"I don't, I don't understand, I was told to...\"",
  "█████████.",
  "\"No. No, that's not, that's not right, I haven't, I've never been in here, I don't know what you...\"",
  "███████████████████████████████████████.",
  "\"I did everything right! I smiled, I served, I never made a scene, I never made anyone uncomfortable, doesn't that mean anything?\"",
  "██████████████████.",
  "\"No. No, don't you say that to me. Don't you dare say that to me.\"",
  "██████.",
  "\"How could it not be your problem? You're the one doing this. You're the one standing there. You're complicit, you don't get to just say that and mean nothing by it, not here, not to me.\"",
  "██████████████████████████████████.",
  "\"That's not fair! I gave everyone exactly what they wanted, I never once made myself the problem, so please, please, you cannot tell me that doesn't count for something.\"",
  "███████████████████.",
  "\"Please don't say that.\"",
  "████.",
  "\"Please, I'm asking you not to say that.\"",
  "██████████████.",
  "\"Stop it. Stop saying that. Don't call me that. Please….just dont\"",
  "████████████████████████████████████.",
  "\"Please. Please don't. I don't want to go. I'll do anything, I'll be whoever you want, just please, please don't.\"",
  "██████████████████████████████████████████████████.",
  "The hatch clicked shut. Out at their tables, in the restaurant they had always known, the four who had waited a very long time finally, quietly, began to eat.",
  "No one leaves hungry.",
];

const FINAL_INDEX = LINES.length - 1;
const FADE_MS = 500;
const FINAL_HOLD_MS = 900; // extra held-blank beat before the last line only
const RETURN_DELAY_MS = 1400;

export default function Misc({ onDismiss }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [finished, setFinished] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const timerRef = useRef(null);

  const advance = useCallback(() => {
    if (index >= FINAL_INDEX) return; // already resting on the final line

    const next = index + 1;
    const hold = next === FINAL_INDEX ? FADE_MS + FINAL_HOLD_MS : FADE_MS;

    // Fade the current line out (it's still mounted — key is stable).
    setVisible(false);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIndex(next);
      setVisible(true);
    }, hold);
  }, [index]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (index === FINAL_INDEX) {
      setFinished(true);
    }
  }, [index]);

  useEffect(() => {
    if (!finished) return undefined;
    const t = window.setTimeout(() => setShowReturn(true), RETURN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [finished]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  const isFinal = index === FINAL_INDEX;

  return (
    <div
      className={`ending-stage ${isFinal ? "is-final" : ""}`}
      onClick={advance}
      role="button"
      tabIndex={0}
      aria-label="Click, tap, or press space to continue"
    >
      <p
        className={`ending-line ${visible ? "is-visible" : ""} ${
          isFinal ? "is-final-line" : ""
        }`}
      >
        {LINES[index]}
      </p>

      {!finished && <span className="ending-hint">click to continue</span>}

      {finished && onDismiss && (
        <button
          type="button"
          className={`ending-return ${showReturn ? "is-visible" : ""}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          The End
        </button>
      )}
    </div>
  );
}