import React, { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Nav from "./Nav";
import DecryptText from "./DecryptText";
import { useEvidenceSFX } from "./useEvidenceSFX";

// Import all spy video assets
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

// ── KEY FACTS & FIGURES ───────────────────────────────────────────
const STATS = [
  { code: "01", label: "SOCIETY FOUNDED", value: "2025" },
  { code: "02", label: "ACTIVE MEMBERS", value: "70+" },
  { code: "03", label: "EVENTS DELIVERED (25/26)", value: "13" },
  { code: "04", label: "INSTAGRAM FOLLOWERS", value: "260+" },
  { code: "05", label: "LINKEDIN FOLLOWERS", value: "200+" },
  { code: "06", label: "ACADEMIC DISCIPLINES", value: "8+" },
];

// ── QUICK ACCESS / SITE LINKS ─────────────────────────────────────
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

// Scroll-linked progress (0 → 1) for how far a node has travelled through
// a "reveal window" in the viewport. Used to drive the redaction peel.
// `revealStart`/`revealEnd` are fractions of viewport height measured from
// the top: progress hits 0 when the node's top is at `revealStart` and 1
// once it reaches `revealEnd`. A tighter window (smaller gap between the
// two) means less scrolling is needed to fully declassify — useful for
// content further down the page where there's less room left to scroll.
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

      // Once the page itself can't scroll any further, force full reveal —
      // otherwise content near the bottom (which never reaches the normal
      // "end" trigger position because there's no more room to scroll)
      // would stay stuck partially redacted forever.
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

// RedactedText — renders `text` word-by-word, each hidden under a
// redaction bar. As the paragraph scrolls up through the viewport, the
// bars peel off left-to-right in step with scroll position, "declassifying"
// the copy in real time rather than on a single mount/visibility trigger.
// `variant`: "solid" (default, flat black bar — briefing text & case
// index) or "stripe" (diagonal hatch, matching the stat cards' own
// declassify-tape look) so different sections don't all peel identically.
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

export default function Home() {
  const [videoReady, setVideoReady] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const videoRefs = useRef([]);

  const { playPinThud, playDossierOpen } = useEvidenceSFX();

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

  // Handle the seamless transition to the next video
  const handleVideoEnd = () => {
    const nextIdx = (activeVideoIndex + 1) % VIDEOS.length;
    setActiveVideoIndex(nextIdx);
    
    // Play the next video programmatically from the start
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
          {/* Map through all videos and stack them */}
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
                NATIONAL SECURITY
              </span>
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
      </footer>
    </div>
  );
}