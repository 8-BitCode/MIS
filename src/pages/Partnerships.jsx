import React, { useEffect, useRef, useState, memo } from "react";
import Nav from "./Nav";
import DecryptText from "./DecryptText";
import "./Partnerships.css";

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

// ── SPONSOR DATA ───────────────────────────────────────────────────
const SPONSOR_NODES = [
  {
    id: 0,
    nodeIndex: 0, // Maps to a specific vertex on the 3D shape
    name: "CYBERDYNE SYS",
    status: "ACTIVE (2025-2026)",
    tier: "DIRECTORATE PARTNER",
    reach: "98% CADET ENGAGEMENT"
  },
  {
    id: 1,
    nodeIndex: 5,
    name: "PALANTIR TECH",
    status: "ACTIVE (2024-2026)",
    tier: "STRATEGIC ALLY",
    reach: "84% CADET ENGAGEMENT"
  },
  {
    id: 2,
    nodeIndex: 10,
    name: "LOCKHEED MARTIN",
    status: "PREVIOUS (2022-2023)",
    tier: "TACTICAL SUPPLIER",
    reach: "62% CADET ENGAGEMENT"
  }
];

// ── INTERACTIVE 3D SPONSOR GLOBE ───────────────────────────────────
function WireframeCanvas({ selectedSponsor, onSelectSponsor }) {
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  // Trackball State
  const rotRef = useRef({ x: 0.2, y: 0.5 });
  const velocityRef = useRef({ x: 0, y: 0.005 }); // Constant slow auto-spin

  // Vertices for a 12-Node Icosahedron
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];

  const edges = [
    [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
    [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
    [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
    [4, 9], [9, 2], [2, 6], [6, 8], [8, 4],
    [4, 5], [5, 9], [9, 1], [1, 8], [8, 7],
    [7, 6], [6, 10], [10, 2], [2, 11], [11, 4]
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      canvas.width = size;
      canvas.height = size;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Apply drag velocity & auto-spin
      if (!isDraggingRef.current) {
        rotRef.current.x += velocityRef.current.x;
        rotRef.current.y += velocityRef.current.y;
        
        // Return X (tilt) to a neutral center slowly, keep Y spinning
        velocityRef.current.x *= 0.90;
        if (Math.abs(velocityRef.current.y) > 0.005) {
           velocityRef.current.y *= 0.95; // damp manual spin down to auto-spin speed
        } else {
           velocityRef.current.y = 0.005; // auto-spin baseline
        }
      }

      // Constrain X-axis (tilt) so the globe doesn't flip upside down (Makes dragging intuitive)
      rotRef.current.x = Math.max(-0.6, Math.min(0.6, rotRef.current.x));

      const scale = canvas.width * 0.22;
      const angleX = rotRef.current.x;
      const angleY = rotRef.current.y;

      // 3D Matrix Rotations
      const projectedNodes = rawVertices.map(([x, y, z], idx) => {
        let x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
        let z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
        let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

        const perspective = 300 / (300 + z2 * 40);
        const px = cx + x1 * scale * perspective;
        const py = cy + y2 * scale * perspective;

        // Check if this vertex represents a sponsor
        const sponsorMatch = SPONSOR_NODES.find(s => s.nodeIndex === idx);

        return { 
          id: idx, px, py, z: z2, 
          isSponsor: !!sponsorMatch,
          sponsorData: sponsorMatch 
        };
      });

      // 1. Draw Globe Equator (Visual guide for intuitive spinning)
      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale * 1.6, scale * 0.4, angleX, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Draw Edges
      edges.forEach(([i, j]) => {
        const n1 = projectedNodes[i];
        const n2 = projectedNodes[j];
        const avgZ = (n1.z + n2.z) / 2;
        const alpha = Math.max(0.05, (avgZ + 3) / 8);

        ctx.strokeStyle = `rgba(0, 255, 102, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n1.px, n1.py);
        ctx.lineTo(n2.px, n2.py);
        ctx.stroke();
      });

      // 3. Draw Nodes
      projectedNodes.sort((a, b) => b.z - a.z); // Render back to front
      projectedNodes.forEach((node) => {
        const isSelected = selectedSponsor === node.sponsorData?.id;
        
        if (node.isSponsor) {
          // SPONSOR NODE (Large, Glowing, Clickable)
          const radius = isSelected ? 8 : (node.z > 0 ? 5 : 3.5);
          
          if (isSelected) {
            // Animated Pulse Halo
            const pulse = 4 + Math.sin(Date.now() / 150) * 2;
            ctx.strokeStyle = "rgba(0, 255, 102, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(node.px, node.py, radius + pulse, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = isSelected ? "#ffffff" : node.z > 0 ? "#00ff66" : "#005522";
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
          ctx.fill();

          // Label
          if (node.z > -1 || isSelected) {
            ctx.font = isSelected ? "bold 10px 'IBM Plex Mono'" : "9px 'IBM Plex Mono'";
            ctx.fillStyle = isSelected ? "#ffffff" : "#00ff66";
            ctx.fillText(
              isSelected ? `> ${node.sponsorData.name}` : `[ ${node.sponsorData.name} ]`, 
              node.px + 12, node.py + 4
            );
          }
        } else {
          // INACTIVE NODE (Small, Dim)
          const radius = Math.max(1, 2 + node.z * 0.3);
          ctx.fillStyle = "rgba(0, 255, 102, 0.2)";
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      canvas._projectedNodes = projectedNodes;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedSponsor]);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;

    const vx = deltaY * 0.005; // Drag Y rotates X (tilt)
    const vy = deltaX * 0.005; // Drag X rotates Y (spin)

    rotRef.current.x += vx;
    rotRef.current.y += vy;

    velocityRef.current = { x: vx, y: vy };
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas || !canvas._projectedNodes) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = canvas._projectedNodes.find((n) => {
      if (!n.isSponsor) return false;
      const dist = Math.hypot(n.px - clickX, n.py - clickY);
      return dist < 15; // Generous hit area
    });

    if (clicked) {
      onSelectSponsor(clicked.sponsorData.id);
    }
  };

  return (
    <div className="wireframe-viewport-1x1">
      <canvas
        ref={canvasRef}
        className="wireframe-canvas drag-active"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="terminal-overlay-hud">
        <div className="hud-badge">[ SPONSOR NETWORK GLOBE ]</div>
        <div className="hud-instruction">&gt; DRAG GLOBE TO ROTATE / CLICK SPONSOR</div>
      </div>
    </div>
  );
}

// ── EXPONENTIAL BRAND AWARENESS GRAPH ──────────────────────────────
function GrowthGraphCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let startTime = Date.now();

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const padLeft = 40;
      const padBottom = 30;
      const graphW = w - padLeft;
      const graphH = h - padBottom - 20;
      
      const elapsed = (Date.now() - startTime) / 1000;
      const loopDuration = 4; // 4 seconds per sweep
      const t = (elapsed % loopDuration) / (loopDuration * 0.8); // 0 to 1 over 80% of loop, then holds
      const progress = Math.min(t, 1.0); // Clamp to 1 for the pause at the end

      // 1. Draw Grid & Axes
      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = 20 + (graphH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      for (let i = 0; i <= 6; i++) {
        const x = padLeft + (graphW * i) / 6;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - padBottom);
        ctx.stroke();
      }

      // Axis Labels
      ctx.fillStyle = "rgba(0, 255, 102, 0.6)";
      ctx.font = "9px 'IBM Plex Mono'";
      ctx.fillText("HIGH", 5, 25);
      ctx.fillText("LOW", 5, h - padBottom);
      ctx.fillText("Q1", padLeft, h - 10);
      ctx.fillText("Q2", padLeft + graphW * 0.33, h - 10);
      ctx.fillText("Q3", padLeft + graphW * 0.66, h - 10);
      ctx.fillText("Q4 (PROJ)", w - 45, h - 10);

      // 2. Draw Baseline Growth (Linear / Organic)
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 255, 102, 0.3)";
      ctx.setLineDash([4, 4]);
      ctx.moveTo(padLeft, h - padBottom);
      ctx.lineTo(w, h - padBottom - (graphH * 0.2));
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // 3. Draw Exponential Growth Curve (With Sponsorship)
      const points = [];
      const steps = 100;
      
      for (let i = 0; i <= steps; i++) {
        const nx = i / steps; // Normalized x (0 to 1)
        if (nx > progress) break; // Only calculate up to current progress

        const x = padLeft + nx * graphW;
        // Exponential function: y scales rapidly as nx approaches 1
        const ny = Math.pow(nx, 3.5); 
        const y = (h - padBottom) - (ny * graphH);
        
        points.push({ x, y });
      }

      if (points.length > 0) {
        // Draw Area Fill under the curve
        ctx.beginPath();
        ctx.moveTo(points[0].x, h - padBottom);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.lineTo(points[points.length - 1].x, h - padBottom);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 20, 0, h - padBottom);
        grad.addColorStop(0, "rgba(0, 255, 102, 0.3)");
        grad.addColorStop(1, "rgba(0, 255, 102, 0.0)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw the solid curve line
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#00ff66";
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 8;
        
        ctx.moveTo(points[0].x, points[0].y);
        for (const p of points) {
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw glowing leading dot
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 12;
        ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Leading indicator line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(lastPoint.x, h - padBottom);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="growth-graph-canvas" />;
}

// ── TIER BID DATA ──────────────────────────────────────────────────
const SPONSOR_TIERS = [
  {
    id: "tier-1",
    code: "CLASS-01",
    name: "TACTICAL SUPPLIER",
    price: "[£ standard_rate / YR]",
    clearance: "LEVEL 1",
    perks: [
      "[INSERT PERK 1 — e.g. Logo on site & event slides]",
      "[INSERT PERK 2 — e.g. Access to member resume book]"
    ]
  },
  {
    id: "tier-2",
    code: "CLASS-02",
    name: "STRATEGIC ALLY",
    price: "[£ premium_rate / YR]",
    clearance: "LEVEL 2",
    popular: true,
    perks: [
      "[INSERT PERK 1 — All Class-01 Perks included]",
      "[INSERT PERK 2 — e.g. Dedicated workshop/hackathon slot]",
      "[INSERT PERK 3 — e.g. Booth at Annual Intelligence Summit]"
    ]
  },
  {
    id: "tier-3",
    code: "CLASS-03",
    name: "DIRECTORATE PARTNER",
    price: "[£ custom_quote]",
    clearance: "TOP SECRET",
    perks: [
      "[INSERT PERK 1 — Full Society Co-Branding rights]",
      "[INSERT PERK 2 — Exclusive headline sponsorship events]",
      "[INSERT PERK 3 — Direct access to top-tier talent pipeline]"
    ]
  }
];

export default function Partnerships() {
  const [selectedTier, setSelectedTier] = useState("tier-2");
  const [selectedSponsor, setSelectedSponsor] = useState(0); // Default to first sponsor
  const [tenderSubmitted, setTenderSubmitted] = useState(false);

  const activeSponsorData = SPONSOR_NODES.find(s => s.id === selectedSponsor);

  const handleTender = (e) => {
    e.preventDefault();
    setTenderSubmitted(true);
    setTimeout(() => setTenderSubmitted(false), 4000);
  };

  return (
    <div className="procurement-page matrix-theme">
      <div className="noise" aria-hidden="true" />
      <Nav />

      <main className="dashboard-container">
        
        {/* ── GREEN TERMINAL HEADER ───────────────────────────────── */}
        <header className="dashboard-header ascii-box green-header">
          <AsciiCorners />
          <div className="header-top">
            <span className="path-text">~/SYS/PARTNERSHIP_PROCUREMENT.LOG</span>
            <span className="clearance-badge">[ TACTICAL NETWORK ONLINE ]</span>
          </div>

          <div className="header-title-block">
            <h1 className="dashboard-h1">
              <span className="prompt">&gt;</span>
              <DecryptText text="PARTNERSHIP & PROCUREMENT CONSOLE" speed={25} />
            </h1>
            <p className="dashboard-sub">
              INTELLIGENCE NETWORK · SYSTEM STATUS: <span>NOMINAL (100% LINK)</span>
            </p>
          </div>
        </header>

        {/* ── 3D GLOBE + SPONSOR DATA DISPLAY ─────────────────────── */}
        <section className="telemetry-top-grid">
          
          <div className="wireframe-panel ascii-box">
            <AsciiCorners />
            <div className="panel-bar">
              <span>PARTNER NETWORK TOPOLOGY</span>
              <span className="rec-indicator">ACTIVE ●</span>
            </div>
            
            <WireframeCanvas
              selectedSponsor={selectedSponsor}
              onSelectSponsor={setSelectedSponsor}
            />
          </div>

          <div className="stats-panel ascii-box">
            <AsciiCorners />
            <div className="panel-bar">SELECTED PARTNER DOSSIER</div>
            
            <div className="kpi-grid-green">
              <div className="kpi-card-green">
                <span className="kpi-code">CORPORATE ID</span>
                <span className="kpi-label">ORGANIZATION</span>
                <span className="kpi-value accent" style={{ fontSize: '1.1rem' }}>
                  {activeSponsorData.name}
                </span>
              </div>
              <div className="kpi-card-green">
                <span className="kpi-code">CONTRACT</span>
                <span className="kpi-label">LIFECYCLE STATUS</span>
                <span className="kpi-value" style={{ fontSize: '1rem' }}>
                  {activeSponsorData.status}
                </span>
              </div>
              <div className="kpi-card-green">
                <span className="kpi-code">CLEARANCE</span>
                <span className="kpi-label">SPONSORSHIP TIER</span>
                <span className="kpi-value" style={{ fontSize: '1rem' }}>
                  {activeSponsorData.tier}
                </span>
              </div>
              <div className="kpi-card-green">
                <span className="kpi-code">IMPACT</span>
                <span className="kpi-label">NETWORK METRICS</span>
                <span className="kpi-value" style={{ fontSize: '1rem' }}>
                  {activeSponsorData.reach}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── EXPONENTIAL GROWTH GRAPH ────────────────────────────── */}
        <section className="graph-panel ascii-box green-graph-panel">
          <AsciiCorners />
          <div className="panel-bar">
            <span>PROJECTED AWARENESS & IMPRESSION TRAJECTORY</span>
            <span className="green-tag">IMPACT SIMULATION</span>
          </div>
          
          <div className="large-graph-viewport-green">
            <GrowthGraphCanvas />
            
            <div className="graph-hud-footer">
              <div>ORGANIC REACH: LINEAR (DASHED)</div>
              <div className="hud-center">SPONSORSHIP TRAJECTORY: EXPONENTIAL (SOLID)</div>
              <div>SIMULATION: RUNNING</div>
            </div>
          </div>
        </section>

        {/* ── CONTRACT TENDERS (SPONSORSHIP TIERS) ────────────────── */}
        <section className="tiers-section">
          <div className="section-titlebar">
            <span>&gt; AVAILABLE TACTICAL SPONSORSHIP TENDERS</span>
          </div>

          <div className="tiers-grid">
            {SPONSOR_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`tier-card ascii-box ${tier.popular ? "is-popular" : ""} ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <AsciiCorners />
                  {tier.popular && <span className="popular-badge">PRIORITY TENDER</span>}
                  
                  <div className="tier-header">
                    <span className="tier-code">{tier.code}</span>
                    <h2 className="tier-name">{tier.name}</h2>
                    <div className="tier-price">{tier.price}</div>
                  </div>

                  <div className="tier-clearance">
                    <span>REQ CLEARANCE:</span> <strong>{tier.clearance}</strong>
                  </div>

                  <ul className="tier-perks">
                    {tier.perks.map((perk, i) => (
                      <li key={i}>
                        <span className="bullet">+</span>
                        <Placeholder>{perk}</Placeholder>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`tier-btn ${isSelected ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTier(tier.id);
                    }}
                  >
                    {isSelected ? "[ TENDER SELECTED ]" : "SELECT TENDER"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── TENDER SUBMISSION FORM ──────────────────────────────── */}
        <section className="tender-form-section ascii-box">
          <AsciiCorners />
          <div className="panel-bar">&gt; SUBMIT TENDER / TRANSMIT PROPOSAL</div>

          <form className="tender-form" onSubmit={handleTender}>
            <div className="form-grid">
              <div className="form-group">
                <label>&gt; ORGANIZATION / CONTRACTOR</label>
                <input type="text" required placeholder="e.g. Acme Corp / BAE Systems" />
              </div>
              <div className="form-group">
                <label>&gt; OFFICIAL REPRESENTATIVE EMAIL</label>
                <input type="email" required placeholder="representative@organization.com" />
              </div>
              <div className="form-group">
                <label>&gt; SELECTED CLEARANCE TIER</label>
                <input
                  type="text"
                  readOnly
                  value={SPONSOR_TIERS.find((t) => t.id === selectedTier)?.name || ""}
                />
              </div>
              <div className="form-group full-width">
                <label>&gt; PROPOSAL / PROCUREMENT BRIEF</label>
                <textarea rows="3" placeholder="Specify interest, custom requirements, or timeline..."></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                [ TRANSMIT TENDER BID ]
              </button>
              {tenderSubmitted && (
                <span className="submit-msg">
                  &gt; TRANSMISSION RECEIVED. LINK ESTABLISHED.
                </span>
              )}
            </div>
          </form>
        </section>

      </main>
    </div>
  );
}