import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "./Nav";
import DecryptText from "./DecryptText";
import { useEvidenceSFX } from "./useEvidenceSFX";
import "./Contact.css";

/* ══════════════════════════════════════════════════════════════════
   CONTACT.SYS — Transmission Hub
   Purposeful Uplink & Broadcast Sequence (3D Projected HUD)
   ══════════════════════════════════════════════════════════════════ */

const COS_ISO = Math.cos(Math.PI / 6);
const SIN_ISO = Math.sin(Math.PI / 6);

const LOGICAL_W = 760;
const LOGICAL_H = 560;
const CENTER_X = 380;
const CENTER_Y = 300;
const SCALE = 1.7;

function terrainHeight(x, y) {
  return 16 * Math.sin(x / 60) * Math.cos(y / 60);
}

function project(x, y, z, theta) {
  const rx = x * Math.cos(theta) - y * Math.sin(theta);
  const ry = x * Math.sin(theta) + y * Math.cos(theta);
  return {
    sx: (rx - ry) * COS_ISO,
    sy: (rx + ry) * SIN_ISO - z,
    depth: rx + ry,
  };
}

function toPixels(x, y, z, theta) {
  const p = project(x, y, z, theta);
  return {
    x: CENTER_X + p.sx * SCALE,
    y: CENTER_Y + p.sy * SCALE,
    depth: p.depth,
  };
}

function getBezierPoint(t, p0, p1, p2) {
  const inv = 1 - t;
  return {
    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
  };
}

function toPct(px) {
  return { left: `${(px.x / LOGICAL_W) * 100}%`, top: `${(px.y / LOGICAL_H) * 100}%` };
}

const GRID_EXTENT = 3;
const GRID_STEP = 35;

function buildTerrainLines(theta) {
  const lines = [];
  for (let g = -GRID_EXTENT; g <= GRID_EXTENT; g++) {
    const rowPts = [];
    for (let i = -GRID_EXTENT; i <= GRID_EXTENT; i++) {
      const x = i * GRID_STEP;
      const y = g * GRID_STEP;
      const p = toPixels(x, y, terrainHeight(x, y), theta);
      rowPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    lines.push(rowPts.join(" L "));

    const colPts = [];
    for (let i = -GRID_EXTENT; i <= GRID_EXTENT; i++) {
      const x = g * GRID_STEP;
      const y = i * GRID_STEP;
      const p = toPixels(x, y, terrainHeight(x, y), theta);
      colPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    lines.push(colPts.join(" L "));
  }
  return lines;
}

function buildRing(radius, segments = 48) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const phi = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(phi);
    const y = radius * Math.sin(phi);
    const p = toPixels(x, y, terrainHeight(x, y), 0);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(" L ");
}

const CHANNELS = [
  {
    id: "email",
    code: "N-01",
    glyph: "@",
    label: "EMAIL",
    tag: "PRIORITY — PARTNERS & ORGS",
    priority: true,
    desc: "The fastest way to reach the desk. Companies and organisations: please route enquiries here first.",
    display: "manchester.intelligence@manchesterstudentsunion.com",
    href: "mailto:manchester.intelligence@manchesterstudentsunion.com",
    copyValue: "manchester.intelligence@manchesterstudentsunion.com",
    external: false,
    angleDeg: 90,
    radius: 95,
    height: 56,
  },
  {
    id: "linkedin",
    code: "N-02",
    glyph: "in",
    label: "LINKEDIN",
    tag: "PROFESSIONAL NETWORK",
    desc: "Society announcements, alumni network, and professional postings.",
    display: "linkedin.com/company/manchester-intelligence-society",
    href: "https://www.linkedin.com/company/manchester-intelligence-society/",
    external: true,
    angleDeg: 150,
    radius: 95,
    height: 40,
  },
  {
    id: "instagram",
    code: "N-03",
    glyph: "IG",
    label: "INSTAGRAM",
    tag: "EVENT COVERAGE",
    desc: "Photos, event announcements, and day-to-day activity.",
    display: "instagram.com/uom_mis",
    href: "https://www.instagram.com/uom_mis/",
    external: true,
    angleDeg: 210,
    radius: 95,
    height: 40,
  },
  {
    id: "discord",
    code: "N-04",
    glyph: "//",
    label: "DISCORD",
    tag: "MEMBER COMMS",
    desc: "Live server for members — discussion, socials, and quick questions.",
    display: "discord.gg/acnwqfk3X2",
    href: "https://discord.gg/acnwqfk3X2",
    external: true,
    angleDeg: 270,
    radius: 95,
    height: 40,
  },
  {
    id: "whatsapp",
    code: "N-05",
    glyph: "WA",
    label: "WHATSAPP",
    tag: "BROADCAST LIST",
    desc: "Broadcast list for announcements and last-minute updates.",
    display: "chat.whatsapp.com/FTGb…59Gs",
    href: "https://chat.whatsapp.com/FTGbKuhj0OJ9eHVsnO59Gs",
    external: true,
    angleDeg: 330,
    radius: 95,
    height: 40,
  },
  {
    id: "linktree",
    code: "N-06",
    glyph: "::",
    label: "LINKTREE",
    tag: "MASTER INDEX",
    desc: "One link carrying every channel M.I.S. runs, always kept current.",
    display: "linktr.ee/manchester.intelligence",
    href: "https://linktr.ee/manchester.intelligence",
    external: true,
    angleDeg: 30,
    radius: 95,
    height: 40,
  },
];

const CALENDLY = {
  id: "calendly",
  code: "N-07",
  glyph: "??",
  label: "BOOK A SLOT",
  tag: "PENDING SETUP",
  desc: "Direct booking isn't wired up yet. Email the desk in the meantime and we'll find a time that works.",
  angleDeg: 250,
  radius: 152,
  height: 13,
  dormant: true,
};

const HUB_HEIGHT = 82;

// ── Uplink sequence phase boundaries ────────────────────────────────
const SEQ_LOCK = 0.12;
const SEQ_ROUTE = 0.42;
const SEQ_HANDSHAKE = 0.68;
const SEQ_ENCRYPT = 0.9;

const HEX_CHARS = "0123456789ABCDEF";
function randomHex(len) {
  let out = "";
  for (let i = 0; i < len; i++) out += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  return out;
}

const AsciiCorners = () => (
  <>
    <span className="ascii-corner tl" aria-hidden="true">+</span>
    <span className="ascii-corner tr" aria-hidden="true">+</span>
    <span className="ascii-corner bl" aria-hidden="true">+</span>
    <span className="ascii-corner br" aria-hidden="true">+</span>
  </>
);

function useMatchMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia(query).matches
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [query]);
  return matches;
}

export default function Contact() {
  const [activeId, setActiveId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [theta, setTheta] = useState(-0.5);
  const [dragging, setDragging] = useState(false);
  const [viewMode, setViewMode] = useState("3d");
  
  // Transmitter state
  const [isHoveringNode, setIsHoveringNode] = useState(false);
  const [signalBurst, setSignalBurst] = useState(false);
  
  // Sequence State
  const [transmittingNode, setTransmittingNode] = useState(null);
  const [seqProgress, setSeqProgress] = useState(0);
  const [packetId, setPacketId] = useState("");

  // Mobile List Accordion State
  const [openMobileId, setOpenMobileId] = useState(null);

  const { playDossierOpen, playPinThud } = useEvidenceSFX();

  const dragRef = useRef({
    startX: 0,
    startTheta: 0,
    totalDist: 0,
    pointerId: null,
    target: null,
    hasCaptured: false,
    isDown: false,
  });
  const readoutRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const burstTimerRef = useRef(null);

  const reducedMotion = useMatchMedia("(prefers-reduced-motion: reduce)");
  const supportsHover = useMatchMedia("(hover: hover) and (pointer: fine)");

  // ── Auto-Rotation ──────────────────────────────────────────────────
  useEffect(() => {
    if (reducedMotion || dragging || activeId || transmittingNode) return undefined;
    let raf;
    let last = performance.now();
    const tick = (t) => {
      const dt = t - last;
      last = t;
      setTheta((prev) => prev + dt * 0.00011);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, dragging, activeId, transmittingNode]);

  // ── Signal burst effect ──────────────────────────────────────────
  const triggerSignalBurst = useCallback(() => {
    setSignalBurst(true);
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(() => {
      setSignalBurst(false);
    }, 800);
  }, []);

  // ── Uplink Broadcast Sequence ──────────────────────────────────────
  const triggerUplinkSequence = useCallback((channel) => {
    if (!channel || !channel.href || channel.dormant) return;

    // Trigger the signal burst effect
    triggerSignalBurst();

    playDossierOpen();
    setActiveId(channel.id);
    setTransmittingNode(channel);
    setSeqProgress(0);
    setPacketId(randomHex(10));

    const targetTheta = -((channel.angleDeg * Math.PI) / 180) + Math.PI / 4;
    const startTheta = theta;
    const duration = reducedMotion ? 550 : 1900;
    const startTime = performance.now();

    const updateSequence = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (!reducedMotion) {
        const ease = 1 - Math.pow(1 - progress, 3);
        setTheta(startTheta + (targetTheta - startTheta) * ease);
      }
      setSeqProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateSequence);
      } else {
        if (channel.external) {
          window.open(channel.href, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = channel.href;
        }

        redirectTimerRef.current = setTimeout(() => {
          setTransmittingNode(null);
          setSeqProgress(0);
        }, 800);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateSequence);
  }, [theta, playDossierOpen, reducedMotion, triggerSignalBurst]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  // ── Drag Operations ────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (transmittingNode) return;
    dragRef.current = {
      startX: e.clientX,
      startTheta: theta,
      totalDist: 0,
      pointerId: e.pointerId,
      target: e.currentTarget,
      hasCaptured: false,
      isDown: true,
    };
  }, [theta, transmittingNode]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.isDown || transmittingNode) return;
    const dx = e.clientX - dragRef.current.startX;
    const dist = Math.abs(dx);
    dragRef.current.totalDist = dist;

    if (dist > 5) {
      if (!dragRef.current.hasCaptured) {
        dragRef.current.hasCaptured = true;
        setDragging(true);
        try {
          dragRef.current.target?.setPointerCapture?.(dragRef.current.pointerId);
        } catch (err) { /* ignore */ }
      }
      setTheta(dragRef.current.startTheta + dx * 0.007);
    }
  }, [transmittingNode]);

  const endDrag = useCallback(() => {
    if (dragRef.current.hasCaptured) {
      try {
        dragRef.current.target?.releasePointerCapture?.(dragRef.current.pointerId);
      } catch (err) { /* ignore */ }
    }
    dragRef.current.isDown = false;
    dragRef.current.hasCaptured = false;
    setDragging(false);
  }, []);

  const active = useMemo(() => {
    if (activeId === CALENDLY.id) return CALENDLY;
    return CHANNELS.find((c) => c.id === activeId) || null;
  }, [activeId]);

  const focusChannel = useCallback((id) => {
    if (transmittingNode) return;
    setActiveId(id);
    setCopied(false);
  }, [transmittingNode]);

  const clearChannel = useCallback((id) => {
    if (transmittingNode) return;
    setActiveId((current) => (current === id ? null : current));
  }, [transmittingNode]);

  const handleCopy = useCallback(
    async (value) => {
      playPinThud();
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch (e) { /* fallback */ }
    },
    [playPinThud]
  );

  const handleNodeHover = useCallback((c) => {
    if (!c.dormant && !transmittingNode) {
      setIsHoveringNode(true);
      if (supportsHover) focusChannel(c.id);
    }
  }, [supportsHover, transmittingNode, focusChannel]);

  const handleNodeLeave = useCallback(() => {
    setIsHoveringNode(false);
    if (supportsHover && !transmittingNode) {
      // Don't clear immediately to allow smooth transition
      setTimeout(() => {
        if (!document.querySelector('.node-chip:hover')) {
          // Keep the active ID if it's not being hovered
        }
      }, 100);
    }
  }, [supportsHover, transmittingNode]);

  const handleNodeClick = useCallback(
    (c) => (e) => {
      e.preventDefault();
      if (dragRef.current.totalDist > 8 || transmittingNode) return;

      if (c.dormant) {
        focusChannel(c.id);
        return;
      }

      if (!supportsHover) {
        if (activeId !== c.id) {
          focusChannel(c.id);
          if (window.innerWidth < 960 && readoutRef.current) {
            readoutRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          return;
        }
      }

      triggerUplinkSequence(c);
    },
    [supportsHover, activeId, focusChannel, transmittingNode, triggerUplinkSequence]
  );

  const terrainLines = useMemo(() => buildTerrainLines(theta), [theta]);
  const rings = useMemo(() => [buildRing(48), buildRing(76), buildRing(112)], []);

  const hubGeom = useMemo(() => {
    const base = toPixels(0, 0, terrainHeight(0, 0), theta);
    const top = toPixels(0, 0, terrainHeight(0, 0) + HUB_HEIGHT, theta);
    return { base, top };
  }, [theta]);

  const allNodes = useMemo(() => {
    const nodes = [...CHANNELS, CALENDLY].map((c) => {
      const isTransmitting = transmittingNode?.id === c.id;
      const rad = (c.angleDeg * Math.PI) / 180;
      const x = c.radius * Math.cos(rad);
      const y = c.radius * Math.sin(rad);
      const z = terrainHeight(x, y);
      
      let currentHeight = c.height;
      if (isTransmitting && seqProgress > SEQ_ROUTE) {
        const elevationProgress = Math.min(1, (seqProgress - SEQ_ROUTE) / (SEQ_HANDSHAKE - SEQ_ROUTE));
        currentHeight += (1 - Math.pow(1 - elevationProgress, 3)) * 25; 
      }

      const base = toPixels(x, y, z, theta);
      const top = toPixels(x, y, z + currentHeight, theta);
      const mid = toPixels(x * 0.5, y * 0.5, terrainHeight(x * 0.5, y * 0.5) + 24, theta);
      
      return { ...c, base, top, mid, depth: base.depth, ogZ: z };
    });
    return nodes.sort((a, b) => a.depth - b.depth);
  }, [theta, transmittingNode, seqProgress]);

  const activeNodeGeom = useMemo(() => {
    if (!transmittingNode) return null;
    return allNodes.find((n) => n.id === transmittingNode.id) || null;
  }, [transmittingNode, allNodes]);

  const payloadPos = useMemo(() => {
    if (!activeNodeGeom || seqProgress === 0 || seqProgress >= SEQ_ROUTE) return null;
    const t = seqProgress / SEQ_ROUTE;
    return getBezierPoint(t, hubGeom.top, activeNodeGeom.mid, activeNodeGeom.top);
  }, [activeNodeGeom, seqProgress, hubGeom.top]);

  const bearing = Math.round((((theta * 180) / Math.PI) % 360 + 360) % 360);

  // Calculate charge level based on hover state
  const chargeLevel = isHoveringNode && !transmittingNode ? 1 : 0;

  return (
    <>
      <Nav />
      <div className={`relay-page ${transmittingNode ? "is-transmitting" : ""}`}>
        <div className="noise" aria-hidden="true" />
        <div className="relay-vignette" aria-hidden="true" />

        <header className="relay-header">
          <div className="titlebar">
            <span className="titlebar-path">~/contact/relay.sys</span>
            <div className="view-toggle" role="group" aria-label="View Mode">
              <button type="button" className={`toggle-btn ${viewMode === "3d" ? "is-active" : ""}`} onClick={() => setViewMode("3d")}>3D FIELD</button>
              <button type="button" className={`toggle-btn ${viewMode === "list" ? "is-active" : ""}`} onClick={() => setViewMode("list")}>LIST VIEW</button>
            </div>
          </div>
          <p className="relay-eyebrow"><span className="rec-dot" aria-hidden="true" />TRANSMISSION HUB · CLEARANCE: PUBLIC</p>
          <h1 className="relay-h1"><span className="prompt">&gt;</span><DecryptText text="OPEN A CHANNEL" trigger="mount" speed={30} /></h1>
          <p className="relay-sub">Six live masts on the relay field. Companies and organisations — route enquiries through <strong>email</strong>.</p>
          <p className="relay-status">SIGNAL STATUS: <span className="ok">6 CHANNELS LIVE</span> · <span className="pending">1 PENDING SETUP</span> · <span className="bearing">BEARING {String(bearing).padStart(3, "0")}°</span></p>
        </header>

        <section className="relay-main" style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : undefined}>
          {viewMode === "3d" ? (
            <>
              <div className="relay-field-wrap">
                <div
                  className={`relay-field ${dragging ? "is-dragging" : ""} ${transmittingNode ? "is-sequence-active" : ""}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onPointerLeave={endDrag}
                >
                  <svg
                    className="relay-terrain"
                    viewBox={`0 0 ${LOGICAL_W} ${LOGICAL_H}`}
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                  >
                    {rings.map((d, i) => <path key={`ring-${i}`} d={`M ${d}`} className="ground-ring" />)}
                    <g className="terrain-mesh">
                      {terrainLines.map((d, i) => <path key={`grid-${i}`} d={`M ${d}`} className="terrain-line" />)}
                    </g>

                    <g className="signal-links">
                      {allNodes.map((n) => {
                        const isActiveRoute = transmittingNode?.id === n.id;
                        const isDormant = n.dormant;
                        return (
                          <path
                            key={`link-${n.id}`}
                            id={`link-${n.id}`}
                            d={`M ${hubGeom.top.x.toFixed(1)} ${hubGeom.top.y.toFixed(1)} Q ${n.mid.x.toFixed(1)} ${n.mid.y.toFixed(1)} ${n.top.x.toFixed(1)} ${n.top.y.toFixed(1)}`}
                            className={`signal-link ${isDormant ? "is-dormant" : ""} ${n.priority ? "is-priority" : ""} ${isActiveRoute ? "is-active-route" : ""}`}
                          />
                        );
                      })}
                      
                      {!transmittingNode && allNodes.filter((n) => !n.dormant).map((n) => (
                        <circle key={`packet-${n.id}`} r="2.2" className={`signal-packet ${n.priority ? "is-priority" : ""}`}>
                          <animateMotion dur={n.priority ? "2s" : "2.8s"} repeatCount="indefinite">
                            <mpath href={`#link-${n.id}`} xlinkHref={`#link-${n.id}`} />
                          </animateMotion>
                        </circle>
                      ))}
                    </g>

                    {/* ── Signal Burst Effect ── */}
                    {signalBurst && (
                      <g className="signal-burst" style={{ 
                        opacity: 1,
                        animation: 'burst-fade 0.8s ease-out forwards'
                      }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                          const angle = (i / 8) * Math.PI * 2;
                          const radius = 30 + i * 8;
                          return (
                            <circle
                              key={i}
                              cx={hubGeom.top.x + Math.cos(angle) * radius * 0.5}
                              cy={hubGeom.top.y + Math.sin(angle) * radius * 0.5}
                              r={3 + i * 1.5}
                              fill="none"
                              stroke={i % 2 === 0 ? '#39d0ff' : '#ffcf5c'}
                              strokeWidth={1.5 - i * 0.15}
                              opacity={0.8 - i * 0.08}
                              style={{
                                animation: `burst-wave ${0.6 + i * 0.05}s ease-out forwards`,
                                transform: `scale(${1 + i * 0.15})`,
                              }}
                            />
                          );
                        })}
                        {/* Concentric rings */}
                        {[1, 2, 3].map((i) => (
                          <circle
                            key={`ring-${i}`}
                            cx={hubGeom.top.x}
                            cy={hubGeom.top.y}
                            r={i * 20}
                            fill="none"
                            stroke="#39d0ff"
                            strokeWidth={1.5 - i * 0.3}
                            opacity={0.6 - i * 0.15}
                            style={{
                              animation: `burst-ring ${0.4 + i * 0.1}s ease-out forwards`,
                            }}
                          />
                        ))}
                        {/* Central flash */}
                        <circle
                          cx={hubGeom.top.x}
                          cy={hubGeom.top.y}
                          r={8}
                          fill="#fff"
                          opacity={0.9}
                          style={{
                            animation: 'burst-flash 0.3s ease-out forwards',
                          }}
                        />
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            @keyframes burst-ring {
                              0% { transform: scale(0.3); opacity: 0; }
                              30% { opacity: 0.8; }
                              100% { transform: scale(1.5); opacity: 0; }
                            }
                            @keyframes burst-wave {
                              0% { transform: scale(0.5); opacity: 0; }
                              20% { opacity: 1; }
                              100% { transform: scale(2); opacity: 0; }
                            }
                            @keyframes burst-flash {
                              0% { transform: scale(0.5); opacity: 0; }
                              50% { transform: scale(1.5); opacity: 1; }
                              100% { transform: scale(0.8); opacity: 0.3; }
                            }
                            @keyframes burst-fade {
                              0% { opacity: 1; }
                              100% { opacity: 0; }
                            }
                          `
                        }} />
                      </g>
                    )}

                    {transmittingNode && activeNodeGeom && seqProgress < SEQ_HANDSHAKE && (
                      <g
                        className="target-acquisition-beam"
                        style={{
                          opacity:
                            seqProgress < SEQ_ROUTE
                              ? 1
                              : Math.max(0, 1 - (seqProgress - SEQ_ROUTE) / (SEQ_HANDSHAKE - SEQ_ROUTE)),
                        }}
                      >
                        <line
                          x1={activeNodeGeom.top.x}
                          y1="0"
                          x2={activeNodeGeom.top.x}
                          y2={activeNodeGeom.top.y}
                          className="laser-beam"
                        />
                        <circle cx={activeNodeGeom.top.x} cy={activeNodeGeom.top.y} r="14" className="target-reticle-ring r1" />
                        <circle cx={activeNodeGeom.top.x} cy={activeNodeGeom.top.y} r="21" className="target-reticle-ring r2" />
                        <line
                          x1={activeNodeGeom.top.x - 26}
                          y1={activeNodeGeom.top.y}
                          x2={activeNodeGeom.top.x + 26}
                          y2={activeNodeGeom.top.y}
                          className="target-crosshair"
                        />
                        <line
                          x1={activeNodeGeom.top.x}
                          y1={activeNodeGeom.top.y - 26}
                          x2={activeNodeGeom.top.x}
                          y2={activeNodeGeom.top.y + 26}
                          className="target-crosshair"
                        />
                      </g>
                    )}

                    <g className="masts">
                      {allNodes.map((n) => {
                        const isExtending = transmittingNode?.id === n.id && seqProgress > SEQ_ROUTE;
                        return (
                          <g key={`mast-${n.id}`}>
                            <line
                              x1={n.base.x}
                              y1={n.base.y}
                              x2={n.top.x}
                              y2={n.top.y}
                              className={`mast-line ${n.dormant ? "is-dormant" : ""} ${n.priority ? "is-priority" : ""} ${isExtending ? "is-extending" : ""}`}
                            />
                            <ellipse cx={n.base.x} cy={n.base.y} rx="7" ry="3.2" className={`mast-foot ${n.dormant ? "is-dormant" : ""}`} />
                          </g>
                        );
                      })}
                      <line x1={hubGeom.base.x} y1={hubGeom.base.y} x2={hubGeom.top.x} y2={hubGeom.top.y} className="mast-line hub-mast" />
                    </g>

                    {payloadPos && (
                      <circle cx={payloadPos.x} cy={payloadPos.y} r="3.5" className="routing-payload" />
                    )}

                    {activeNodeGeom && seqProgress >= 0.4 && (
                      <g
                        className="crypto-handshake"
                        transform={`translate(${activeNodeGeom.top.x}, ${activeNodeGeom.top.y}) scale(${Math.min(1, (seqProgress - 0.4) / 0.15)})`}
                      >
                        <path d="M -12 -6 L -12 -12 L -6 -12" className="crypto-bracket" />
                        <path d="M 12 -6 L 12 -12 L 6 -12" className="crypto-bracket" />
                        <path d="M -12 6 L -12 12 L -6 12" className="crypto-bracket" />
                        <path d="M 12 6 L 12 12 L 6 12" className="crypto-bracket" />
                        <circle cx="0" cy="0" r="18" className="crypto-ring" />
                      </g>
                    )}
                  </svg>

                  {/* ── Transmitter with Charge Effect ── */}
                  <div 
                    className="signal-transmitter"
                    style={{ 
                      position: 'absolute',
                      left: `${(hubGeom.top.x / LOGICAL_W) * 100}%`, 
                      top: `${(hubGeom.top.y / LOGICAL_H) * 100}%`,
                      transform: 'translate(-50%, -100%)',
                      zIndex: 3,
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1px',
                    }}
                  >
                    {/* Charge ring */}
                    <div style={{
                      position: 'absolute',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: `2px solid ${chargeLevel > 0 ? 'rgba(57, 208, 255, 0.6)' : 'rgba(57, 208, 255, 0.1)'}`,
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) scale(${1 + chargeLevel * 0.3})`,
                      opacity: 0.2 + chargeLevel * 0.5,
                      transition: 'all 0.3s ease',
                      boxShadow: chargeLevel > 0 ? '0 0 30px rgba(57, 208, 255, 0.2)' : 'none',
                    }} />
                    
                    {/* Antenna mast with charge glow */}
                    <div style={{
                      width: '2px',
                      height: `${12 + chargeLevel * 8}px`,
                      background: chargeLevel > 0 
                        ? `linear-gradient(to top, #39d0ff, ${chargeLevel > 0.5 ? '#ffcf5c' : '#39d0ff'})`
                        : '#39d0ff',
                      boxShadow: chargeLevel > 0 
                        ? `0 0 ${15 + chargeLevel * 15}px rgba(57, 208, 255, ${0.3 + chargeLevel * 0.4})`
                        : '0 0 8px rgba(57, 208, 255, 0.3)',
                      borderRadius: '1px',
                      transition: 'all 0.3s ease',
                    }} />
                    
                    {/* Signal dot / emitter with charge state */}
                    <div style={{
                      width: `${6 + chargeLevel * 4}px`,
                      height: `${6 + chargeLevel * 4}px`,
                      borderRadius: '50%',
                      background: chargeLevel > 0.7 
                        ? 'radial-gradient(circle at 50% 50%, #ffcf5c, #39d0ff)'
                        : chargeLevel > 0 
                          ? 'radial-gradient(circle at 50% 50%, #39d0ff, #39d0ff)'
                          : '#39d0ff',
                      boxShadow: chargeLevel > 0 
                        ? `0 0 ${20 + chargeLevel * 20}px rgba(57, 208, 255, ${0.4 + chargeLevel * 0.5})`
                        : '0 0 12px rgba(57, 208, 255, 0.5)',
                      animation: chargeLevel > 0 
                        ? 'transmitter-charge 0.8s ease-in-out infinite' 
                        : 'transmitter-pulse 2s ease-in-out infinite',
                      transition: 'all 0.3s ease',
                    }} />
                    
                    {/* Small base plate */}
                    <div style={{
                      width: `${14 + chargeLevel * 4}px`,
                      height: '3px',
                      background: chargeLevel > 0 
                        ? 'rgba(57, 208, 255, 0.3)' 
                        : 'rgba(31, 47, 49, 0.8)',
                      border: `1px solid ${chargeLevel > 0 ? 'rgba(57, 208, 255, 0.4)' : 'rgba(57, 208, 255, 0.15)'}`,
                      borderRadius: '1px',
                      marginTop: '1px',
                      transition: 'all 0.3s ease',
                    }} />
                    
                    {/* Tiny label */}
                    <span style={{
                      fontSize: '0.35rem',
                      letterSpacing: '0.08em',
                      color: chargeLevel > 0 
                        ? 'rgba(57, 208, 255, 0.8)' 
                        : 'rgba(205, 216, 210, 0.3)',
                      marginTop: '2px',
                      fontFamily: '"IBM Plex Mono", monospace',
                      transition: 'all 0.3s ease',
                    }}>
                      {chargeLevel > 0 ? '⚡ CHARGING' : 'RELAY'}
                    </span>
                  </div>

                  {/* Add the animations to CSS via style tag */}
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      @keyframes transmitter-pulse {
                        0%, 100% { 
                          opacity: 1;
                          transform: scale(1);
                        }
                        50% { 
                          opacity: 0.6;
                          transform: scale(0.85);
                        }
                      }
                      @keyframes transmitter-charge {
                        0%, 100% { 
                          transform: scale(1);
                          box-shadow: 0 0 20px rgba(57, 208, 255, 0.6);
                        }
                        50% { 
                          transform: scale(1.15);
                          box-shadow: 0 0 40px rgba(57, 208, 255, 0.9), 0 0 60px rgba(255, 207, 92, 0.3);
                        }
                      }
                    `
                  }} />

                  <ul className="node-list" aria-label="Contact channels">
                    {allNodes.map((c, idx) => {
                      const isActive = activeId === c.id;
                      const isTransmittingThis = transmittingNode?.id === c.id;
                      
                      return (
                        <li key={c.id} className={`node-wrapper ${c.dormant ? "node-wrapper--dormant" : ""}`} style={{ ...toPct(c.top), zIndex: 20 + idx }}>
                          <button
                            type="button"
                            className={`node-chip ascii-box ${c.priority ? "is-priority" : ""} ${c.dormant ? "node-chip--dormant" : ""} ${isActive ? "is-active" : ""} ${isTransmittingThis ? "is-routing" : ""}`}
                            onMouseEnter={() => handleNodeHover(c)}
                            onMouseLeave={handleNodeLeave}
                            onFocus={() => handleNodeHover(c)}
                            onBlur={handleNodeLeave}
                            onClick={handleNodeClick(c)}
                          >
                            <AsciiCorners />
                            <span className="node-code">{c.code}</span>
                            <span className="node-glyph" aria-hidden="true">{c.glyph}</span>
                            <span className="node-label">{c.label}</span>
                            {c.priority && <span className="node-flag">PRIORITY</span>}
                            {c.dormant && <span className="node-flag node-flag--offline">OFFLINE</span>}
                          </button>
                        </li>
                      );
                    })}

                    {/* ── 3D Projected Floating HUD Card ── */}
                    {transmittingNode && activeNodeGeom && (
                      <li
                        className="node-wrapper node-3d-hud-wrapper"
                        style={{
                          left: `${(activeNodeGeom.top.x / LOGICAL_W) * 100}%`,
                          top: `${(activeNodeGeom.top.y / LOGICAL_H) * 100}%`,
                          zIndex: 999,
                        }}
                      >
                        <div className="node-3d-hud ascii-box" role="dialog" aria-label="Transmission in progress">
                          <AsciiCorners />
                          <div className="hud-header">
                            <span className="hud-status-dot" aria-hidden="true" />
                            <span className="hud-status-title">TRANSMITTING</span>
                            <span className="hud-code">{transmittingNode.code}</span>
                          </div>
                          <div className="hud-body">
                            <h3 className="hud-target-name">{transmittingNode.label}</h3>
                            <p className="hud-target-dest">{transmittingNode.display || transmittingNode.href}</p>
                            <div className="hud-telemetry-grid">
                              <div><span>LATENCY</span><strong>12.4ms</strong></div>
                              <div><span>ENCRYPT</span><strong>AES-256</strong></div>
                            </div>
                            <div className="hud-progress-wrap">
                              <div className="hud-progress-bar" style={{ width: `${Math.round(seqProgress * 100)}%` }} />
                            </div>
                            <div className="hud-progress-meta">
                              <span>{seqProgress < 0.4 ? "ROUTING..." : seqProgress < 0.7 ? "HANDSHAKE..." : "COMPLETE"}</span>
                              <span className="hud-pct">{Math.round(seqProgress * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>

                  <span className="drag-hint">DRAG TO ROTATE FIELD · TAP MAST TO INSPECT</span>
                </div>
              </div>

              <aside ref={readoutRef} className="readout ascii-box" aria-live="polite">
                <AsciiCorners />
                <div className="readout-bar">
                  <span>READOUT_DOCK</span>
                  <span className="readout-dot" aria-hidden="true" />
                </div>
                
                <div className="readout-body">
                  {active ? (
                    <>
                      <span className="readout-eyebrow">
                        {active.code} // {active.label}
                      </span>
                      <span className={`readout-tag ${active.priority ? "is-priority" : ""} ${active.dormant ? "is-dormant" : ""}`}>
                        {active.tag}
                      </span>
                      <p className="readout-desc">{active.desc}</p>
                      
                      {!active.dormant && (
                        <>
                          <div className="readout-value">{active.display}</div>
                          <div className="readout-actions">
                            <button 
                              className="readout-btn" 
                              onClick={() => handleCopy(active.copyValue || active.display)}
                            >
                              {copied ? "COPIED!" : "COPY_DATA"}
                            </button>
                            
                            <button
                              className="readout-btn readout-btn--ghost"
                              onClick={() => triggerUplinkSequence(active)}
                            >
                              INITIATE_LINK
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="readout-default">
                      <p className="readout-hint">AWAITING INPUT...</p>
                      <p>SELECT A MAST TO INSPECT CHANNEL TELEMETRY.</p>
                    </div>
                  )}
                </div>
              </aside>
            </>
          ) : (
            /* ── Fully Wired Mobile / List Mode ── */
            <div className="relay-list-mode">
              <ul className="mobile-chain">
                {[...CHANNELS, CALENDLY].map((c) => {
                  const isOpen = openMobileId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`mobile-row ascii-box ${c.priority ? "is-priority" : ""} ${c.dormant ? "is-dormant" : ""} ${isOpen ? "is-open" : ""}`}
                        onClick={() => setOpenMobileId(isOpen ? null : c.id)}
                      >
                        <span className="mobile-row-code">{c.code}</span>
                        <span className="mobile-row-glyph" aria-hidden="true">{c.glyph}</span>
                        <span className="mobile-row-label">{c.label}</span>
                        {c.priority && <span className="node-flag">PRIORITY</span>}
                        {c.dormant && <span className="node-flag node-flag--offline">OFFLINE</span>}
                        <span className="mobile-row-chevron" aria-hidden="true">{isOpen ? "[-]" : "[+]"}</span>
                      </button>
                      <div className={`mobile-drawer ${isOpen ? "is-open" : ""}`}>
                        <div className="mobile-drawer-inner">
                          <span className="readout-eyebrow">{c.code} // {c.label}</span>
                          <span className={`readout-tag ${c.priority ? "is-priority" : ""} ${c.dormant ? "is-dormant" : ""}`}>
                            {c.tag}
                          </span>
                          <p className="readout-desc">{c.desc}</p>
                          {!c.dormant && (
                            <>
                              <div className="readout-value">{c.display}</div>
                              <div className="readout-actions">
                                <button 
                                  className="readout-btn" 
                                  onClick={() => handleCopy(c.copyValue || c.display)}
                                >
                                  {copied && activeId === c.id ? "COPIED!" : "COPY_DATA"}
                                </button>
                                <button
                                  className="readout-btn readout-btn--ghost"
                                  onClick={() => triggerUplinkSequence(c)}
                                >
                                  INITIATE_LINK
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
}