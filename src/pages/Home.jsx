import React, { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Nav from "./Nav";
import DecryptText from "./DecryptText";
import { useEvidenceSFX } from "./useEvidenceSFX";

// Swap this import for wherever spy.mp4 lives in your project
import spyVideo from "../Assets/spy.mp4";

const AsciiCorners = memo(() => (
  <>
    <span className="ascii-corner tl" aria-hidden="true">+</span>
    <span className="ascii-corner tr" aria-hidden="true">+</span>
    <span className="ascii-corner bl" aria-hidden="true">+</span>
    <span className="ascii-corner br" aria-hidden="true">+</span>
  </>
));

const Placeholder = memo(({ children }) => (
  <span className="ph">
    <span className="ph-flag">NEEDS INPUT</span>
    {children}
  </span>
));

// ── KEY FACTS & FIGURES ───────────────────────────────────────────
const STATS = [
  { code: "01", label: "SOCIETY FOUNDED", value: "[YEAR]" },
  { code: "02", label: "ACTIVE MEMBERS", value: "[COUNT]" },
  { code: "03", label: "EVENTS RUN / YEAR", value: "[COUNT]" },
  { code: "04", label: "PARTNER ORGANIZATIONS", value: "[COUNT]" },
  { code: "05", label: "ALUMNI PLACEMENTS", value: "[COUNT]" },
  { code: "06", label: "CAMPUS CHAPTERS", value: "[COUNT]" },
];

// ── QUICK ACCESS / SITE LINKS ─────────────────────────────────────
const CASE_FILES = [
  {
    code: "01",
    to: "/committee",
    title: "COMMITTEE",
    blurb: "Meet the operatives running the society — roles, units, and personnel files.",
  },
  {
    code: "02",
    to: "/events",
    title: "EVENTS",
    blurb: "Upcoming briefings, socials, and workshops. Clearance: open to all members.",
  },
  {
    code: "03",
    to: "/partnerships",
    title: "PARTNERSHIPS",
    blurb: "Sponsors and allied organizations backing the mission.",
  },
  {
    code: "04",
    to: "/contact",
    title: "CONTACT",
    blurb: "Open a channel. Questions, sponsorships, or requests to join.",
  },
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
      { threshold: 0.15 } // Trigger slightly earlier for smoother flow
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
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
  const { playPinThud, playDossierOpen } = useEvidenceSFX();

  const [briefingRef, briefingVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [indexRef, indexVisible] = useScrollReveal();

  // Tactical HUD state
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target;
      // Trigger target lock animation on links and buttons
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

  const scrollToBriefing = () => {
    playPinThud();
    document.getElementById("briefing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page">
      {/* HUD Crosshair */}
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

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="hero">
        <div 
          className="hero-media" 
          style={{ transform: `translateY(${scrollY * 0.35}px)` }} // Parallax Scroll
        >
          <video
            className={`hero-video ${videoReady ? "is-ready" : ""}`}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoReady(true)}
            aria-hidden="true"
          >
            <source src={spyVideo} type="video/mp4" />
          </video>
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
              <Placeholder>
                [INSERT FULL SOCIETY NAME AND ONE-LINE TAGLINE HERE]
              </Placeholder>
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
                <Placeholder>[HEADLINE EVENT OR ANNOUNCEMENT]</Placeholder>
                &nbsp;&nbsp;·&nbsp;&nbsp; RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
                <Placeholder>[HEADLINE EVENT OR ANNOUNCEMENT]</Placeholder>
                &nbsp;&nbsp;·&nbsp;&nbsp; WELCOME TO M.I.S. &nbsp;&nbsp;·&nbsp;&nbsp;
                RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
              </span>
              <span aria-hidden="true">
                // WELCOME TO M.I.S. &nbsp;&nbsp;·&nbsp;&nbsp;
                <Placeholder>[HEADLINE EVENT OR ANNOUNCEMENT]</Placeholder>
                &nbsp;&nbsp;·&nbsp;&nbsp; RECRUITMENT: OPEN &nbsp;&nbsp;·&nbsp;&nbsp;
                <Placeholder>[HEADLINE EVENT OR ANNOUNCEMENT]</Placeholder>
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

      {/* ── MISSION BRIEFING ───────────────────────────────────── */}
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

            <p className="briefing-text">
              <Placeholder>
                [INSERT 2–3 SENTENCES EXPLAINING WHAT THE SOCIETY IS, WHAT
                FIELD/INDUSTRY IT FOCUSES ON, AND WHO IT'S FOR — E.G. WHICH
                STUDENTS, PROGRAMS, OR YEARS ARE WELCOME.]
              </Placeholder>
            </p>

            <p className="briefing-text">
              <Placeholder>
                [INSERT 1–2 SENTENCES ON THE SOCIETY'S MISSION OR GOALS —
                WHAT MEMBERS GET OUT OF JOINING: SKILLS, NETWORK, EVENTS,
                CAREER OUTCOMES, ETC.]
              </Placeholder>
            </p>

            <div className="briefing-tags">
              <span className="tag staggered-fade" style={{ '--stagger': 1 }}>
                <Placeholder>[FOCUS AREA]</Placeholder>
              </span>
              <span className="tag staggered-fade" style={{ '--stagger': 2 }}>
                <Placeholder>[FOCUS AREA]</Placeholder>
              </span>
              <span className="tag staggered-fade" style={{ '--stagger': 3 }}>
                <Placeholder>[FOCUS AREA]</Placeholder>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY FACTS & FIGURES ───────────────────────────────── */}
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
              <Declassify key={s.code} style={{ '--stagger': idx }} className="stat-card ascii-box">
                <AsciiCorners />
                <span className="stat-code">N-{s.code}</span>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
                <span className="stat-redact" aria-hidden="true" />
              </Declassify>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS / SITE INDEX ──────────────────────────── */}
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
                style={{ '--stagger': idx }}
                onClick={() => playDossierOpen()}
              >
                <AsciiCorners />
                <div className="case-card-top">
                  <span className="case-code">FILE {c.code}</span>
                  <span className="case-open">OPEN &gt;</span>
                </div>
                <h3 className="case-title">{c.title}</h3>
                <p className="case-blurb">{c.blurb}</p>
                <div className="case-scanner-line" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="home-footer">
        <span>
          &copy; <Placeholder>[YEAR]</Placeholder> M.I.S. — ALL TRANSMISSIONS MONITORED
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