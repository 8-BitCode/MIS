import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Nav from "./Nav";
import DecryptText from "./DecryptText";
import { useEvidenceSFX } from "./useEvidenceSFX";
import { useClearance, markStage, isTypingTarget, isAllComplete, STAGES } from "./clearance";
import Ending from "./Misc";

const CIPHER_ANSWERS = {
  committee: "no",
  events: "one",
  partnerships: "leaves",
  contact: "hungry",
};

import spyVideo1 from "../Assets/spy.mp4";
import spyVideo2 from "../Assets/spy2.mp4";
import spyVideo3 from "../Assets/spy3.mp4";
import spyVideo4 from "../Assets/spy4.mp4";

const VIDEOS = [spyVideo1, spyVideo2, spyVideo3, spyVideo4];

const AsciiCorners = memo(() => (
  <>
    <span className="ascii-corner tl" aria-hidden="true">+</span>
    <span className="ascii-corner tr" aria-hidden="true">+</span>
    <span className="ascii-corner bl" aria-hidden="true">+</span>
    <span className="ascii-corner br" aria-hidden="true">+</span>
  </>
));

const STATS = [
  { code: "01", label: "SOCIETY FOUNDED", value: "2025" },
  { code: "02", label: "ACTIVE MEMBERS", value: "70+" },
  { code: "03", label: "EVENTS DELIVERED (25/26)", value: "13" },
  { code: "04", label: "INSTAGRAM FOLLOWERS", value: "260+" },
  { code: "05", label: "LINKEDIN FOLLOWERS", value: "200+" },
  { code: "06", label: "ACADEMIC DISCIPLINES", value: "8+" },
];

const CASE_FILES = [
  {
    code: "01",
    to: "/committee",
    title: "COMMITTEE",
    blurb: "Meet the operatives running the society — roles, units, and personnel files.",
    accent: "var(--accent-committee)",
  },
  {
    code: "02",
    to: "/events",
    title: "EVENTS",
    blurb: "Upcoming briefings, socials, and workshops. Clearance: open to all members.",
    accent: "var(--accent-events)",
  },
  {
    code: "03",
    to: "/partnerships",
    title: "PARTNERSHIPS",
    blurb: "Sponsors and allied organizations backing the mission.",
    accent: "var(--accent-partnerships)",
  },
  {
    code: "04",
    to: "/contact",
    title: "CONTACT",
    blurb: "Open a channel. Questions, sponsorships, or requests to join.",
    accent: "var(--accent-contact)",
  },
];

const STAT_ACCENTS = [
  "var(--accent-committee)",
  "var(--accent-events)",
  "var(--accent-partnerships)",
  "var(--accent-contact)",
];

function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function CountUpValue({ value }) {
  const ref = useRef(null);
  const hasRunRef = useRef(false);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const match = String(value).match(/^(\d+)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const target = parseInt(match[1], 10);
    const suffix = match[2] || "";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRunRef.current) {
          hasRunRef.current = true;
          const duration = 900;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(`${Math.round(target * eased)}${suffix}`);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display}</span>;
}

function useScrollProgress(ref, revealStart = 0.92, revealEnd = 0.5) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const compute = () => {
      rafRef.current = null;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - vh;
      const atBottom = maxScroll <= 0 || window.scrollY >= maxScroll - 2;

      if (atBottom) {
        setProgress(1);
        return;
      }

      const start = vh * revealStart;
      const end = vh * revealEnd;
      const raw = (start - rect.top) / (start - end);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(compute);
      }
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [ref, revealStart, revealEnd]);

  return progress;
}

function RedactedText({
  text,
  className = "",
  tag: Tag = "p",
  style,
  revealStart = 0.92,
  revealEnd = 0.5,
  variant = "solid",
}) {
  const ref = useRef(null);
  const progress = useScrollProgress(ref, revealStart, revealEnd);
  const words = React.useMemo(() => text.split(" "), [text]);
  const revealCount = Math.floor(progress * words.length);

  return (
    <Tag ref={ref} className={`redacted-text redacted-text--${variant} ${className}`} style={style}>
      {words.map((w, i) => (
        <span
          className={`redact-word ${i < revealCount ? "is-declassified" : ""}`}
          key={i}
          style={{ '--word-i': i }}
        >
          {w}
          <span className="redact-bar" aria-hidden="true" />
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

function Declassify({ children, className = "", tag: Tag = "div", style }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={style}
      className={`declassify ${revealed ? "is-revealed" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

const STAGE_ACCENT = {
  committee: "var(--accent-committee)",
  events: "var(--accent-events)",
  partnerships: "var(--accent-partnerships)",
  contact: "var(--accent-contact)",
};

function ClearanceDiamonds({ stages, onUnlock }) {
  const complete = STAGES.every((id) => stages.has(id));

  // When every stage is filled, the diamonds hand off to the pattern
  // lock. The player draws a path through a 3×3 grid of dots; correct
  // pattern opens the clearance reveal. Until then, this is the quiet
  // progress indicator it's always been.
  if (complete) {
    return <ClearancePattern onUnlock={onUnlock} />;
  }

  return (
    <div className="clearance-row" aria-hidden="true">
      {STAGES.map((id) => (
        <span
          key={id}
          className={`clearance-diamond ${stages.has(id) ? "is-filled" : ""}`}
          style={stages.has(id) ? { color: STAGE_ACCENT[id] } : undefined}
        >
          ◆
        </span>
      ))}
      <span className="clearance-lock">⊘</span>
    </div>
  );
}

// ── Pattern lock (clearance unlock) ───────────────────────────────
// A 3×3 grid of dots. The player drags a continuous path through them.
// Index layout:
//   0 1 2
//   3 4 5
//   6 7 8
// The correct pattern is a four-point path through the corners:
// bottom-right → bottom-left → top-right → top-left.
const PATTERN_GRID_SIZE = 3;
const PATTERN_ANSWER = [8, 6, 2, 0];

function ClearancePattern({ onUnlock }) {
  const [path, setPath] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [rejected, setRejected] = useState(false);
  const [solved, setSolved] = useState(false);

  const gridRef = useRef(null);
  const dotsRef = useRef([]);
  const dragRef = useRef({ active: false });

  const gridSize = PATTERN_GRID_SIZE;
  const svgSize = 60;
  const dotSpacing = svgSize / (gridSize + 1);

  const dotPos = (i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    return {
      x: (col + 1) * dotSpacing,
      y: (row + 1) * dotSpacing,
    };
  };

  // Hit-test a client-space point against each dot. Radius is generous
  // so gliding between adjacent dots registers cleanly.
  const hitTestDot = (clientX, clientY) => {
    for (let i = 0; i < dotsRef.current.length; i++) {
      const node = dotsRef.current[i];
      if (!node) continue;
      const r = node.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(clientX - cx, clientY - cy) < 18) return i;
    }
    return null;
  };

  const startDrag = (e) => {
    if (solved) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    dragRef.current.active = true;
    setDragging(true);
    setPointerPos({ x: e.clientX, y: e.clientY });

    const hit = hitTestDot(e.clientX, e.clientY);
    setPath(hit === null ? [] : [hit]);
  };

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (e) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
      const hit = hitTestDot(e.clientX, e.clientY);
      if (hit === null) return;
      setPath((prev) => (prev.includes(hit) ? prev : [...prev, hit]));
    };

    const onUp = () => {
      dragRef.current.active = false;
      setDragging(false);
      setPath((prev) => {
        const correct =
          prev.length === PATTERN_ANSWER.length &&
          prev.every((v, i) => v === PATTERN_ANSWER[i]);

        if (correct) {
          setSolved(true);
          window.setTimeout(() => onUnlock(), 420);
        } else if (prev.length > 0) {
          setRejected(true);
          window.setTimeout(() => {
            setRejected(false);
            setPath([]);
          }, 460);
        }
        return prev;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, onUnlock]);

  // Convert the pointer's client position into SVG-space so the trail's
  // live endpoint follows the finger.
  const pointerSvg = useMemo(() => {
    if (!gridRef.current) return null;
    const r = gridRef.current.getBoundingClientRect();
    const scaleX = svgSize / r.width;
    const scaleY = svgSize / r.height;
    return {
      x: (pointerPos.x - r.left) * scaleX,
      y: (pointerPos.y - r.top) * scaleY,
    };
  }, [pointerPos]);

  const trailPoints = path.map((i) => dotPos(i));

  return (
    <div
      className={`pattern-lock ${rejected ? "is-rejected" : ""} ${solved ? "is-solved" : ""}`}
      role="group"
      aria-label="Clearance lock — draw the unlock pattern"
    >
      <div
        ref={gridRef}
        className="pattern-grid"
        onPointerDown={startDrag}
      >
        <svg
          className="pattern-trail"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {trailPoints.length > 1 && (
            <polyline
              points={trailPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {dragging && pointerSvg && trailPoints.length > 0 && (
            <line
              x1={trailPoints[trailPoints.length - 1].x}
              y1={trailPoints[trailPoints.length - 1].y}
              x2={pointerSvg.x}
              y2={pointerSvg.y}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const { x, y } = dotPos(i);
          const isActive = path.includes(i);
          return (
            <span
              key={i}
              ref={(node) => { dotsRef.current[i] = node; }}
              className={`pattern-dot ${isActive ? "is-active" : ""}`}
              style={{
                left: `${(x / svgSize) * 100}%`,
                top: `${(y / svgSize) * 100}%`,
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}

function useReducedMotionPref() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    handler();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

const GLOBE_ARC_STEPS = 40;
const GLOBE_MERIDIANS = 6;
const GLOBE_LATITUDES = [-75, -50, -25, 0, 25, 50, 75];

function rotatePoint3D(x, y, z, spinRad, tiltRad) {
  const cs = Math.cos(spinRad), sn = Math.sin(spinRad);
  const x1 = x * cs + z * sn;
  const z1 = -x * sn + z * cs;
  const ct = Math.cos(tiltRad), st = Math.sin(tiltRad);
  const y2 = y * ct - z1 * st;
  const z2 = y * st + z1 * ct;
  return { x: x1, y: y2, z: z2 };
}

function buildGlobeSegments(spinDeg, tiltDeg) {
  const spin = (spinDeg * Math.PI) / 180;
  const tilt = (tiltDeg * Math.PI) / 180;
  const segments = [];

  const pushLine = (a, b, emphasize) => {
    const avgZ = (a.z + b.z) / 2;
    const depth01 = Math.min(1, Math.max(0, (avgZ + 1) / 2));
    let opacity = 0.08 + 0.72 * Math.pow(depth01, 1.4);
    if (emphasize) opacity = Math.min(1, opacity + 0.18);
    segments.push({
      x1: a.x, y1: -a.y, x2: b.x, y2: -b.y, opacity, emphasize,
    });
  };

  for (let m = 0; m < GLOBE_MERIDIANS; m++) {
    const theta0 = (m * Math.PI) / GLOBE_MERIDIANS;
    let prev = null;
    for (let i = 0; i <= GLOBE_ARC_STEPS; i++) {
      const t = (i / GLOBE_ARC_STEPS) * Math.PI * 2;
      const x = Math.sin(t) * Math.cos(theta0);
      const y = Math.cos(t);
      const z = Math.sin(t) * Math.sin(theta0);
      const p = rotatePoint3D(x, y, z, spin, tilt);
      if (prev) pushLine(prev, p, false);
      prev = p;
    }
  }

  GLOBE_LATITUDES.forEach((latDeg) => {
    const lat = (latDeg * Math.PI) / 180;
    const y0 = Math.sin(lat);
    const r0 = Math.cos(lat);
    let prev = null;
    for (let i = 0; i <= GLOBE_ARC_STEPS; i++) {
      const t = (i / GLOBE_ARC_STEPS) * Math.PI * 2;
      const x = r0 * Math.cos(t);
      const y = y0;
      const z = r0 * Math.sin(t);
      const p = rotatePoint3D(x, y, z, spin, tilt);
      if (prev) pushLine(prev, p, latDeg === 0);
      prev = p;
    }
  });

  return segments;
}

function WireframeGlobe({ size = 360 }) {
  const reducedMotion = useReducedMotionPref();
  const [spin, setSpin] = useState(24);
  const rafRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    let last = performance.now();
    let acc = 0;
    const tick = (t) => {
      const dt = t - last;
      last = t;
      acc += dt;
      if (acc >= 45) {
        setSpin((s) => s + acc * 0.01);
        acc = 0;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  const radius = size * 0.42;
  const cx = size / 2;
  const cy = size / 2;
  const segments = useMemo(() => buildGlobeSegments(spin, -16), [spin]);

  return (
    <svg
      className="reveal-globe"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Rotating wireframe globe"
    >
      <circle cx={cx} cy={cy} r={radius * 1.34} className="globe-ring-outer" />
      <circle cx={cx} cy={cy} r={radius} className="globe-silhouette" />
      <g transform={`translate(${cx} ${cy}) scale(${radius})`}>
        {segments.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            vectorEffect="non-scaling-stroke"
            style={{ opacity: s.opacity }}
            className={`globe-line ${s.emphasize ? "is-equator" : ""}`}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={3} className="globe-core" />
    </svg>
  );
}

function ClearanceReveal({ onDismiss }) {
  const [inputs, setInputs] = useState({
    committee: "",
    events: "",
    partnerships: "",
    contact: "",
  });
  const [error, setError] = useState(false);
  const [unsealed, setUnsealed] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleChange = (id) => (e) => {
    setError(false);
    setInputs((prev) => ({ ...prev, [id]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const correct = STAGES.every(
      (id) => inputs[id].trim().toLowerCase() === CIPHER_ANSWERS[id]
    );
    if (correct) {
      setUnsealed(true);
    } else {
      setError(true);
    }
  };

  if (unsealed) {
    return (
      <div className="clearance-reveal" role="dialog" aria-label="Declassified transmission">
        <Ending onDismiss={onDismiss} />
      </div>
    );
  }

  return (
    <div className="clearance-reveal auth-theme" role="dialog" aria-label="Classified transmission">
      <div className="reveal-panel">
        <span className="reveal-mark reveal-mark--plus-a" aria-hidden="true">+</span>
        <span className="reveal-mark reveal-mark--bracket" aria-hidden="true" />
        <span className="reveal-mark reveal-mark--plus-b" aria-hidden="true">+</span>

        <div className="reveal-topbar">
          <div className="reveal-brand">
            <span className="reveal-brand-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="reveal-brand-text">
              <strong>M.I.S.</strong>
              <em>MANCHESTER<br />INTELLIGENCE<br />SOCIETY</em>
            </span>
          </div>
          <span className="reveal-tagline">OBSERVE / QUESTION / RESIST</span>
        </div>

        <div className="reveal-body reveal-body--kitchen">
          <div className="reveal-globe-wrap">
            <WireframeGlobe />
          </div>

          <div className="reveal-copy reveal-copy--kitchen">
            <h1 className="reveal-kitchen-title">The Kitchen</h1>

            <form className="cipher-form cipher-form--kitchen" onSubmit={handleSubmit}>
              {STAGES.map((id) => (
                <label key={id} className="cipher-row cipher-row--kitchen">
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    aria-label={id}
                    value={inputs[id]}
                    onChange={handleChange(id)}
                  />
                </label>
              ))}

              <div className="cipher-actions cipher-actions--kitchen">
                <button type="submit" className="clearance-reveal-close cipher-submit">
                  [ ENTER ]
                </button>
                <button
                  type="button"
                  className="clearance-reveal-close"
                  onClick={onDismiss}
                >
                  [ CONTINUE SERVING ]
                </button>
              </div>
            </form>

            {error && (
              <p className="cipher-error">
                INCORRECT SEQUENCE. FILE REMAINS SEALED.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {

  const [videoReady, setVideoReady] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const videoRefs = useRef([]);

  const { playPinThud, playDossierOpen } = useEvidenceSFX();

  const stages = useClearance();
  const [revealDismissed, setRevealDismissed] = useState(false);
  const [padlockUnlocked, setPadlockUnlocked] = useState(false);

  useEffect(() => {
    const KEY_TO_STAGE = { a: "committee", b: "events", c: "partnerships", d: "contact" };
    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      const stageId = KEY_TO_STAGE[e.key.toLowerCase()];
      if (stageId) markStage(stageId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const [briefingRef, briefingVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [indexRef, indexVisible] = useScrollReveal();

  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target;
      setIsHovering(
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('ph')
      );
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleVideoEnd = () => {
    const nextIdx = (activeVideoIndex + 1) % VIDEOS.length;
    setActiveVideoIndex(nextIdx);

    if (videoRefs.current[nextIdx]) {
      videoRefs.current[nextIdx].currentTime = 0;
      videoRefs.current[nextIdx].play().catch(() => {});
    }
  };

  const scrollToBriefing = () => {
    playPinThud();
    document.getElementById("briefing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page">
      <div
        className={`hud-crosshair ${isHovering ? "is-locked" : ""}`}
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
        aria-hidden="true"
      >
        <div className="xhair-x" />
        <div className="xhair-y" />
        <div className="xhair-box" />
      </div>

      <div className="noise" aria-hidden="true" />
      <Nav />

      <section className="hero">
        <div
          className="hero-media"
          style={{ transform: `translateY(${scrollY * 0.35}px)` }}
        >
          {VIDEOS.map((src, idx) => (
            <video
              key={src}
              ref={(el) => (videoRefs.current[idx] = el)}
              className={`hero-video ${videoReady && activeVideoIndex === idx ? "is-ready" : ""}`}
              autoPlay={idx === 0}
              muted
              playsInline
              onCanPlay={() => {
                if (idx === 0) setVideoReady(true);
              }}
              onEnded={handleVideoEnd}
              aria-hidden="true"
            >
              <source src={src} type="video/mp4" />
            </video>
          ))}
          <div className="hero-scanlines" aria-hidden="true" />
          <div className="hero-radar" aria-hidden="true" />
          <div className="hero-vignette" aria-hidden="true" />
          <div className="hero-flicker" aria-hidden="true" />
        </div>

        <div className="hero-frame ascii-box">
          <AsciiCorners />

          <div className="hero-titlebar">
            <span className="hero-titlebar-path">~/home/index.sys</span>
            <span className="hero-titlebar-flag">CLEARANCE: PUBLIC</span>
          </div>

          <div className="hero-content">
            <p className="hero-eyebrow">
              <span className="rec-dot" aria-hidden="true" />
              TRANSMISSION DECRYPTED
            </p>

            <h1 className="hero-title">
              <DecryptText text="M.I.S." speed={45} delay={200} />
            </h1>

            <p className="hero-subtitle">
              The Manchester Intelligence Society — from curiosity to capability.
            </p>

            <div className="hero-actions">
              <button className="hero-btn hero-btn--primary" onClick={scrollToBriefing}>
                &gt; ACCESS BRIEFING
              </button>
              <Link
                to="/contact"
                className="hero-btn hero-btn--ghost"
                onClick={() => playDossierOpen()}
              >
                JOIN THE UNIT &gt;
              </Link>
            </div>
          </div>

          <div className="hero-ticker" aria-hidden="true">
            <div className="hero-ticker-track">
              <span>
                // WELCOME TO M.I.S. &nbsp;&nbsp;·&nbsp;&nbsp;
                CATCH US AT THE SOCIETY FAIR
                &nbsp;&nbsp;·&nbsp;&nbsp; RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
                SPY CRAWL — DETAILS DROPPING SOON
                &nbsp;&nbsp;·&nbsp;&nbsp; WELCOME TO M.I.S. &nbsp;&nbsp;·&nbsp;&nbsp;
                RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
              </span>
              <span aria-hidden="true">
                // WELCOME TO M.I.S. &nbsp;&nbsp;·&nbsp;&nbsp;
                CATCH US AT THE SOCIETY FAIR
                &nbsp;&nbsp;·&nbsp;&nbsp; RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
                SPY CRAWL — DETAILS DROPPING SOON
                &nbsp;&nbsp;·&nbsp;&nbsp; WELCOME TO M.I.S. &nbsp;&nbsp;·&nbsp;&nbsp;
                RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
              </span>
            </div>
          </div>

          <button className="hero-scroll-cue" onClick={scrollToBriefing}>
            <span>SCROLL TO DECLASSIFY</span>
            <span className="scroll-chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </section>

      <section id="briefing" className="briefing">
        <div ref={briefingRef} className={`section-frame ascii-box ${briefingVisible ? "is-visible" : ""}`}>
          <AsciiCorners />
          <div className="section-titlebar">
            <span className="section-eyebrow">
              <span className="prompt">&gt;</span> <DecryptText text="FILE 01 — MISSION BRIEFING" trigger="visible" delay={200} speed={20} />
            </span>
          </div>

          <div className="briefing-body">
            <h2 className="section-h2">
              <DecryptText text="WHAT IS M.I.S.?" trigger="visible" delay={600} speed={25} />
            </h2>

            <RedactedText
              className="briefing-text"
              text="The Manchester Intelligence Society (MIS) is the North West's first university-level intelligence society, founded in 2025 at The University of Manchester. We bridge the gap between academic learning, practical skills, and the wider intelligence and national security community — bringing together members from computer science, politics, international relations, history, literature, and beyond."
            />

            <RedactedText
              className="briefing-text"
              text="We build critical thinking, analytical, and decision-making skills through hands-on events spanning OSINT, cyber, and national security — from workshops and speaker panels to our signature hackathon — preparing students for real careers in intelligence, cyber, and business intelligence."
            />

            <div className="briefing-tags">
              <span className="tag staggered-fade" style={{ '--stagger': 1 }}>
                INTELLIGENCE ANALYSIS
              </span>
              <span className="tag staggered-fade" style={{ '--stagger': 2 }}>
                OSINT & CYBER
              </span>
              <span className="tag staggered-fade" style={{ '--stagger': 3 }}>
                NATIONAL SECURITY              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div ref={statsRef} className={`section-frame ascii-box ${statsVisible ? "is-visible" : ""}`}>
          <AsciiCorners />
          <div className="section-titlebar">
            <span className="section-eyebrow">
              <span className="prompt">&gt;</span> <DecryptText text="FILE 02 — KEY FACTS & FIGURES" trigger="visible" speed={20} />
            </span>
          </div>

          <div className="stats-grid">
            {STATS.map((s, idx) => (
              <Declassify
                key={s.code}
                style={{ '--stagger': idx, '--stat-accent': STAT_ACCENTS[idx % STAT_ACCENTS.length] }}
                className="stat-card ascii-box"
              >
                <AsciiCorners />
                <span className="stat-code">N-{s.code}</span>
                <span className="stat-value">
                  <CountUpValue value={s.value} />
                </span>
                <RedactedText
                  tag="span"
                  className="stat-label"
                  text={s.label}
                  revealStart={0.92}
                  revealEnd={0.55}
                  variant="stripe"
                />
                <span className="stat-redact" aria-hidden="true" />
              </Declassify>
            ))}
          </div>
        </div>
      </section>

      <section className="index">
        <div ref={indexRef} className={`section-frame ascii-box ${indexVisible ? "is-visible" : ""}`}>
          <AsciiCorners />
          <div className="section-titlebar">
            <span className="section-eyebrow">
              <span className="prompt">&gt;</span> <DecryptText text="FILE 03 — CASE INDEX" trigger="visible" speed={20} />
            </span>
            <span className="section-sub">SELECT A FILE TO CONTINUE</span>
          </div>

          <div className="index-grid">
            {CASE_FILES.map((c, idx) => (
              <Link
                key={c.to}
                to={c.to}
                className="case-card ascii-box staggered-slide"
                style={{ '--stagger': idx, '--card-accent': c.accent }}
                onClick={() => playDossierOpen()}
              >
                <AsciiCorners />
                <div className="case-card-top">
                  <span className="case-code">FILE {c.code}</span>
                  <span className="case-open">OPEN &gt;</span>
                </div>
                <RedactedText
                  tag="h3"
                  className="case-title"
                  text={c.title}
                  revealStart={1.0}
                  revealEnd={0.8}
                />
                <RedactedText
                  tag="p"
                  className="case-blurb"
                  text={c.blurb}
                  revealStart={1.0}
                  revealEnd={0.8}
                />
                <div className="case-scanner-line" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <span>
          &copy; {new Date().getFullYear()} M.I.S. — ALL TRANSMISSIONS MONITORED
        </span>
        <span className="footer-links">
          {CASE_FILES.map((c, i) => (
            <React.Fragment key={c.to}>
              <Link to={c.to}>{c.title}</Link>
              {i < CASE_FILES.length - 1 && <span className="dot">·</span>}
            </React.Fragment>
          ))}
        </span>
        <ClearanceDiamonds
          stages={stages}
          onUnlock={() => setPadlockUnlocked(true)}
        />
      </footer>

      {isAllComplete(stages) && padlockUnlocked && !revealDismissed && (
        <ClearanceReveal onDismiss={() => setRevealDismissed(true)} />
      )}
    </div>
  );
}