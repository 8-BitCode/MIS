import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import Nav from "./Nav";
import { markStage, isTypingTarget } from "./clearance";
import DecryptText from "./DecryptText";
import "./Partnerships.css";

// Receiving inbox for tender transmissions.
const PARTNERSHIP_EMAIL = "manchester.intelligence@manchesterstudentsunion.com";

const FORM_ENDPOINT = `https://formsubmit.co/ajax/${PARTNERSHIP_EMAIL}`;

const AsciiCorners = memo(() => (
  <>
    <span className="ascii-corner tl" aria-hidden="true">+</span>
    <span className="ascii-corner tr" aria-hidden="true">+</span>
    <span className="ascii-corner bl" aria-hidden="true">+</span>
    <span className="ascii-corner br" aria-hidden="true">+</span>
  </>
));

const SPONSOR_NODES = [
  {
    id: 0,
    nodeIndex: 8,
    name: "BRIGHT NETWORK",
    status: "PARTNER CONFIRMED",
    tier: "SOCIETY PARTNER",
    reach: "REFERRAL PROGRAMME · CAREER RESOURCES · EVENT ACCESS",
    tierId: null
  },
  {
    id: 1,
    nodeIndex: 4,
    name: "YOUR COMPANY",
    status: "SLOT OPEN",
    tier: "OPEN SPONSORSHIP",
    reach: "CUSTOM EVENT ACCESS · BRAND VISIBILITY · TALENT PIPELINE",
    tierId: "tier-custom"
  }
];

// ── INTERACTIVE 3D SPONSOR GLOBE ───────────────────────────────────
function WireframeCanvas({ selectedSponsor, onSelectSponsor }) {
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const rotRef = useRef({ x: 0.2, y: 0.5 });
  const velocityRef = useRef({ x: 0, y: 0.005 });

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

      if (!isDraggingRef.current) {
        rotRef.current.x += velocityRef.current.x;
        rotRef.current.y += velocityRef.current.y;

        velocityRef.current.x *= 0.90;
        if (Math.abs(velocityRef.current.y) > 0.005) {
          velocityRef.current.y *= 0.95;
        } else {
          velocityRef.current.y = 0.005;
        }
      }

      rotRef.current.x = Math.max(-0.6, Math.min(0.6, rotRef.current.x));

      const scale = canvas.width * 0.22;
      const angleX = rotRef.current.x;
      const angleY = rotRef.current.y;

      const projectedNodes = rawVertices.map(([x, y, z], idx) => {
        let x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
        let z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
        let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);

        const perspective = 300 / (300 + z2 * 40);
        const px = cx + x1 * scale * perspective;
        const py = cy + y2 * scale * perspective;

        const sponsorMatch = SPONSOR_NODES.find(s => s.nodeIndex === idx);

        return {
          id: idx, px, py, z: z2,
          isSponsor: !!sponsorMatch,
          sponsorData: sponsorMatch
        };
      });

      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale * 1.6, scale * 0.4, angleX, 0, Math.PI * 2);
      ctx.stroke();

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

      projectedNodes.sort((a, b) => b.z - a.z);
      projectedNodes.forEach((node) => {
        const isSelected = selectedSponsor === node.sponsorData?.id;
        const isConfirmed = node.sponsorData?.status === "PARTNER CONFIRMED";

        if (node.isSponsor) {
          const radius = isSelected ? 8 : (node.z > 0 ? 5 : 3.5);
          const haloColor = isConfirmed ? "rgba(255, 207, 92, 0.85)" : "rgba(0, 255, 102, 0.8)";
          const dimColor = isConfirmed ? "#8a6a1a" : "#005522";
          const brightColor = isConfirmed ? "#ffcf5c" : "#00ff66";

          if (isSelected) {
            const pulse = 4 + Math.sin(Date.now() / 150) * 2;
            ctx.strokeStyle = haloColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(node.px, node.py, radius + pulse, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = isSelected ? "#ffffff" : node.z > 0 ? brightColor : dimColor;
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
          ctx.fill();

          if (node.z > -1 || isSelected) {
            ctx.font = isSelected ? "bold 10px 'IBM Plex Mono'" : "9px 'IBM Plex Mono'";
            ctx.fillStyle = isSelected ? "#ffffff" : brightColor;
            ctx.fillText(
              isSelected ? `> ${node.sponsorData.name}` : `[ ${node.sponsorData.name} ]`,
              node.px + 12, node.py + 4
            );
          }
        } else {
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

    const vx = deltaY * 0.005;
    const vy = deltaX * 0.005;

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
      return dist < 15;
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
        <div className="hud-badge">[ AVAILABLE SPONSOR SLOTS ]</div>
        <div className="hud-instruction">&gt; DRAG GLOBE TO ROTATE / CLICK A SLOT</div>
      </div>
    </div>
  );
}

// ── EXPONENTIAL BRAND AWARENESS GRAPH ──────────────────────────────
function GrowthGraphCanvas({ onGrabDot, dotGrabbed, onDragMove, onDragEnd }) {
  const canvasRef = useRef(null);
  const grabbedRef = useRef(false);

  useEffect(() => {
    grabbedRef.current = dotGrabbed;
  }, [dotGrabbed]);

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
      const loopDuration = 4;
      const t = (elapsed % loopDuration) / (loopDuration * 0.8);
      const progress = Math.min(t, 1.0);

      ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
      ctx.lineWidth = 1;

      for (let i = 0; i <= 4; i++) {
        const y = 20 + (graphH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      for (let i = 0; i <= 6; i++) {
        const x = padLeft + (graphW * i) / 6;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - padBottom);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(0, 255, 102, 0.6)";
      ctx.font = "9px 'IBM Plex Mono'";
      ctx.fillText("HIGH", 5, 25);
      ctx.fillText("LOW", 5, h - padBottom);
      ctx.fillText("Q1", padLeft, h - 10);
      ctx.fillText("Q2", padLeft + graphW * 0.33, h - 10);
      ctx.fillText("Q3", padLeft + graphW * 0.66, h - 10);
      ctx.fillText("Q4 (PROJ)", w - 45, h - 10);

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 255, 102, 0.3)";
      ctx.setLineDash([4, 4]);
      ctx.moveTo(padLeft, h - padBottom);
      ctx.lineTo(w, h - padBottom - (graphH * 0.2));
      ctx.stroke();
      ctx.setLineDash([]);

      const points = [];
      const steps = 100;

      for (let i = 0; i <= steps; i++) {
        const nx = i / steps;
        if (nx > progress) break;
        const x = padLeft + nx * graphW;
        const ny = Math.pow(nx, 3.5);
        const y = (h - padBottom) - (ny * graphH);
        points.push({ x, y });
      }

      if (points.length > 0) {
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

        const lastPoint = points[points.length - 1];

        if (!grabbedRef.current) {
          const dotRadius = 5;

          ctx.beginPath();
          ctx.strokeStyle = "rgba(0, 255, 102, 0.45)";
          ctx.lineWidth = 1;
          ctx.arc(lastPoint.x, lastPoint.y, dotRadius + 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#00ff66";
          ctx.shadowBlur = 12;
          ctx.arc(lastPoint.x, lastPoint.y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 1;
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(lastPoint.x, h - padBottom);
          ctx.stroke();

          canvas._dotHitbox = { x: lastPoint.x, y: lastPoint.y, r: dotRadius + 8 };
        } else {
          canvas._dotHitbox = null;
        }
      } else {
        canvas._dotHitbox = null;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas._dotHitbox) return;
    const p = getCanvasPoint(e);
    const { x, y, r } = canvas._dotHitbox;
    const dist = Math.hypot(p.x - x, p.y - y);
    if (dist <= r) {
      onGrabDot(e.clientX, e.clientY);
      e.preventDefault();
    }
  }, [onGrabDot, getCanvasPoint]);

  useEffect(() => {
    if (!dotGrabbed) return undefined;

    const onMove = (e) => {
      onDragMove(e.clientX, e.clientY);
    };
    const onUp = (e) => {
      onDragEnd(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dotGrabbed, onDragMove, onDragEnd]);

  return (
    <canvas
      ref={canvasRef}
      className="growth-graph-canvas"
      style={{ touchAction: "none" }}
      onPointerDown={handlePointerDown}
    />
  );
}

const SPONSOR_TIERS = [
  {
    id: "tier-standard",
    code: "CLASS-01",
    name: "STANDARD",
    price: "£750 / YR",
    clearance: "OUTREACH + HACKATHON",
    perks: [
      "1 event per semester",
      "Social media promotion",
      "Basic brand visibility",
      "Limited CV access",
      "1 custom event"
    ]
  },
  {
    id: "tier-enhanced",
    code: "CLASS-02",
    name: "ENHANCED",
    price: "£1,250 / YR",
    clearance: "OUTREACH + HACKATHON",
    popular: true,
    perks: [
      "2 events per semester",
      "Social media promotion",
      "Standard brand visibility",
      "Limited CV access",
      "2 custom events"
    ]
  },
  {
    id: "tier-premium",
    code: "CLASS-03",
    name: "PREMIUM",
    price: "£1,700 / YR",
    clearance: "CORE TIER + BESPOKE EVENTS",
    perks: [
      "5–6 events per year",
      "Social media promotion",
      "High brand visibility",
      "Full CV access",
      "4 custom events"
    ]
  },
  {
    id: "tier-one-off",
    code: "CLASS-00",
    name: "ONE-OFF",
    price: "£300",
    clearance: "ANY SINGLE EVENT",
    perks: [
      "1 event per semester",
      "Social media promotion",
      "Event-only brand visibility"
    ]
  },
  {
    id: "tier-custom",
    code: "CLASS-XX",
    name: "CUSTOM",
    price: "QUOTE ON FILE",
    clearance: "NEGOTIATED / BESPOKE",
    custom: true,
    perks: [
      "Built around your objectives",
      "Flexible event cadence",
      "Negotiable visibility & CV access",
      "Specify scope in the brief below"
    ]
  }
];

//ignore scrapped code
const PARTNERSHIPS_CHAPTER_PARAGRAPHS = [
  "\"Leaves, mostly, were what came through the hatch: dry, stemmy plant leaves. In all their years working there, they had never seen a dish quite like this.\"",
  "\"Is this even edible?\" the waiter thought to themselves briefly.",
  "The quiet man at \"table three\" had, in fact, ordered \"the leaves,\" but the waiter presumed that was the salad of the day. They never really saw the menu, except once on their first day, although, looking back, the customer probably had brought it from home.",
  "Carrying the plate of leaves back to the table, the waiter offered a confident, \"Enjoy the salad.\" If years of service had taught them anything, it was the vital necessity of staying poised in front of clients.",
  "\"It's backed by data,\" mumbled the man.",
  "\"Pardon?\" said the waiter.",
  "\"The leaves! They will accelerate your appetite! If you eat these leaves before a feast, you can boost your ghrelin levels to as high as three thousand picograms per millilitre. I've actually been fasting for a long while now, but this doesn't count. This is just the starter! The data says it all!\" the meek man spurted out all at once.",
  "\"That's very interesting, sir.\"",
  "\"Not a curious person, are you? Do you even know where the kitchen is?\"",
  "\"I couldn't say, sir.\"",
  "\"That's not curiosity. Curiosity would be asking. You've had, what, one thousand, two thousand opportunities to ask, and the number of times you have is zero. A perfect record of not wanting to know. You want to know how I know?\"",
  "\"Be my guest, sir.\"",
  "\"I'm a 'giver,' you see. There's this thing that wants something I can give it. I give it gifts, I give it answers, I give it insight. But what does it give me? A seat at this restaurant! That's not curious at all! Not at all! The worst part is that it's been so, so, so long since I've eaten, and still, after all this time, you haven't set foot in the kitchen once! You're just like it, not curious at all!\"",
  "\"Will that be all, sir? Please enjoy the meal. Hopefully, it can satiate you,\" said the waiter, not showing a hint of emotion.",
  "\"She was right about you. Low variance, high predictability. You're not a person to me, you're a metric, and metrics don't get curious. Doesn't that bother you? Being counted instead of seen?\"",
  "The waiter's smile didn't move a muscle. \"If you say so, sir,\" they said, with the crisp, hollow politeness of someone agreeing just to end the conversation.",
  "\"That's not curious either,\" the man said.",
  "\"That's not my problem.\""
];

export default function Partnerships() {
  const [selectedTier, setSelectedTier] = useState("tier-enhanced");
  const [expandedMobileTiers, setExpandedMobileTiers] = useState({});
  const [selectedSponsor, setSelectedSponsor] = useState(0);
  const [tenderSubmitted, setTenderSubmitted] = useState(false);
  const [dossierText, setDossierText] = useState("");
  const [copyState, setCopyState] = useState("idle");
  const [sendState, setSendState] = useState("idle");

  // ── TARGET PUZZLE STATE ─────────────────────────────────────────
  const [dotGrabbed, setDotGrabbed] = useState(false);
  const [dotNearTarget, setDotNearTarget] = useState(false);
  const [targetHit, setTargetHit] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealClosing, setRevealClosing] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });

  const solvedRef = useRef(false);
  const targetRef = useRef(null);
  const nearRef = useRef(false);
  const revealCardRef = useRef(null);

  const orgRef = useRef(null);
  const emailRef = useRef(null);
  const briefRef = useRef(null);
  const honeyRef = useRef(null);
  const lastSubmitRef = useRef(0);

  const activeSponsorData = SPONSOR_NODES.find(s => s.id === selectedSponsor);

  const handleSelectSponsor = (id) => {
    setSelectedSponsor(id);
    const node = SPONSOR_NODES.find((s) => s.id === id);
    if (node?.tierId) setSelectedTier(node.tierId);
  };

  const toggleMobileExpand = (tierId, e) => {
    e.stopPropagation();
    setExpandedMobileTiers((prev) => ({
      [tierId]: !prev[tierId]
    }));
  };

  // ── TARGET PUZZLE HANDLERS ──────────────────────────────────────
  const handleGrabDot = useCallback((clientX, clientY) => {
    setBallPos({ x: clientX, y: clientY });
    setDotGrabbed(true);
    setTargetHit(false);
    setDotNearTarget(false);
    nearRef.current = false;
  }, []);

  const handleDragMove = useCallback((clientX, clientY) => {
    setBallPos({ x: clientX, y: clientY });

    if (targetRef.current) {
      const r = targetRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const near = Math.hypot(clientX - cx, clientY - cy) < 60;
      if (near !== nearRef.current) {
        nearRef.current = near;
        setDotNearTarget(near);
      }
    }
  }, []);

  const handleDragEnd = useCallback((clientX, clientY) => {
    if (!targetRef.current) {
      setDotGrabbed(false);
      return;
    }

    const r = targetRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);

    if (dist < 60) {
      setTargetHit(true);
      setDotGrabbed(false);
      setDotNearTarget(false);
      nearRef.current = false;

      if (!solvedRef.current) {
        solvedRef.current = true;
        markStage("partnerships");
      }

      setRevealOpen(true);
      setRevealStep(0);
    } else {
      setDotGrabbed(false);
      setDotNearTarget(false);
      nearRef.current = false;
    }
  }, []);

  // ── CHAPTER REVEAL HANDLERS (matching Committee/Events) ─────────
  const handleCloseReveal = useCallback(() => {
    setRevealClosing(true);
    setTimeout(() => {
      setRevealOpen(false);
      setRevealClosing(false);
      setRevealStep(0);
    }, 300);
  }, []);

  const handleRevealAdvance = useCallback(() => {
    if (revealStep < PARTNERSHIPS_CHAPTER_PARAGRAPHS.length - 1) {
      setRevealStep((s) => s + 1);
    } else {
      handleCloseReveal();
    }
  }, [revealStep, handleCloseReveal]);

  // Auto-scroll the reveal card to the bottom as new paragraphs appear
  useEffect(() => {
    if (revealOpen && revealCardRef.current) {
      revealCardRef.current.scrollTo({
        top: revealCardRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [revealStep, revealOpen]);

  const handleTender = async (e) => {
    e.preventDefault();

    if (honeyRef.current?.value) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < 30000) {
      setSendState("throttled");
      setTenderSubmitted(false);
      return;
    }
    lastSubmitRef.current = now;

    const tier = SPONSOR_TIERS.find((t) => t.id === selectedTier);
    const orgName = orgRef.current?.value?.trim() || "UNIDENTIFIED CONTRACTOR";
    const contactEmail = emailRef.current?.value?.trim() || "";
    const brief = briefRef.current?.value?.trim() || "No additional brief provided.";

    const specificTitle = `Partnership Inquiry — ${orgName} (${tier?.name || "Unspecified"} Tier)`;

    const body =
`To the MIS Partnerships Team,

${orgName} has submitted a formal partnership tender for your review.

--------------------------------------------------
SPECIFIED TIER : ${tier?.name || "Unspecified"} (${tier?.price || "N/A"})
CLEARANCE CODE : ${tier?.code || "N/A"}
--------------------------------------------------

PROPOSAL / PROCUREMENT BRIEF:
${brief}

Please let us know the next steps to proceed with this partnership.

Kind regards,
${orgName}`;

    setDossierText(body);
    setCopyState("idle");
    setSendState("sending");
    setTenderSubmitted(false);

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          _subject: specificTitle,
          _template: "box",
          _replyto: contactEmail,
          _captcha: "true",
          Organization: orgName,
          "Contact Email": contactEmail,
          Tier: `${tier?.name || "Unspecified"} (${tier?.price || "N/A"})`,
          "Proposal Brief": brief
        })
      });

      if (!res.ok) throw new Error("Non-OK response from relay");

      setSendState("sent");
      setTenderSubmitted(true);
    } catch (err) {
      setSendState("failed");
      setTenderSubmitted(true);
      window.location.href = `mailto:${PARTNERSHIP_EMAIL}?subject=${encodeURIComponent(specificTitle)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleCopyDossier = async () => {
    try {
      await navigator.clipboard.writeText(dossierText);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch (err) {
      setCopyState("failed");
    }
  };

  return (
    <div className="procurement-page matrix-theme">
      <div className="noise" aria-hidden="true" />
      <Nav />

      {/* ── HIDDEN TARGET (top right) ───────────────────────────── */}
      <div
        ref={targetRef}
        className={`hidden-target ${targetHit ? "is-hit" : ""} ${dotGrabbed ? "is-armed" : ""} ${dotNearTarget ? "is-near" : ""}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" width="32" height="32">
          <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="16" y1="1" x2="16" y2="9" stroke="currentColor" strokeWidth="1" />
          <line x1="16" y1="23" x2="16" y2="31" stroke="currentColor" strokeWidth="1" />
          <line x1="1" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="1" />
          <line x1="23" y1="16" x2="31" y2="16" stroke="currentColor" strokeWidth="1" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* ── FLOATING BALL (rendered at document level while grabbed) ── */}
      {dotGrabbed && (
        <div
          className="floating-ball"
          style={{ left: `${ballPos.x}px`, top: `${ballPos.y}px` }}
          aria-hidden="true"
        />
      )}

      <main className="dashboard-container">

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

        <section className="telemetry-top-grid">
          <div className="wireframe-panel ascii-box">
            <AsciiCorners />
            <div className="panel-bar">
              <span>OPEN SPONSORSHIP SLOTS</span>
              <span className="rec-indicator">ACTIVE ●</span>
            </div>

            <WireframeCanvas
              selectedSponsor={selectedSponsor}
              onSelectSponsor={handleSelectSponsor}
            />
          </div>

          <div className="stats-panel ascii-box">
            <AsciiCorners />
            <div className="panel-bar">SLOT PREVIEW · CLAIM THIS SPOT</div>

            <div className="kpi-grid-green">
              <div className="kpi-card-green">
                <span className="kpi-code">SLOT ID</span>
                <span className="kpi-label">ORGANIZATION</span>
                <span className="kpi-value accent" style={{ fontSize: '1.1rem' }}>
                  {activeSponsorData.name}
                </span>
              </div>
              <div className="kpi-card-green">
                <span className="kpi-code">CONTRACT</span>
                <span className="kpi-label">STATUS</span>
                <span className="kpi-value" style={{ fontSize: '1rem' }}>
                  {activeSponsorData.status}
                </span>
              </div>
              <div className="kpi-card-green">
                <span className="kpi-code">CLEARANCE</span>
                <span className="kpi-label">TIER</span>
                <span className="kpi-value" style={{ fontSize: '1rem' }}>
                  {activeSponsorData.tier}
                </span>
              </div>
              <div className="kpi-card-green">
                <span className="kpi-code">IMPACT</span>
                <span className="kpi-label">PERKS INCLUDE</span>
                <span className="kpi-value" style={{ fontSize: '1rem' }}>
                  {activeSponsorData.reach}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="graph-panel ascii-box green-graph-panel">
          <AsciiCorners />
          <div className="panel-bar">
            <span>PROJECTED AWARENESS & IMPRESSION TRAJECTORY</span>
            <span className="green-tag">IMPACT SIMULATION</span>
          </div>

          <div className="large-graph-viewport-green">
            <GrowthGraphCanvas
              onGrabDot={handleGrabDot}
              dotGrabbed={dotGrabbed}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            />

            <div className="graph-hud-footer">
              <div>ORGANIC REACH: LINEAR (DASHED)</div>
              <div className="hud-center">SPONSORSHIP TRAJECTORY: EXPONENTIAL (SOLID)</div>
              <div>SIMULATION: RUNNING</div>
            </div>
          </div>
        </section>

        <section className="tiers-section">
          <div className="section-titlebar">
            <span>&gt; AVAILABLE TACTICAL SPONSORSHIP TENDERS</span>
          </div>

          <div className="tiers-grid">
            {SPONSOR_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id;
              const isExpanded = !!expandedMobileTiers[tier.id];

              return (
                <div
                  key={tier.id}
                  className={`tier-card ascii-box ${tier.popular ? "is-popular" : ""} ${tier.custom ? "is-custom" : ""} ${isSelected ? "is-selected" : ""} ${isExpanded ? "is-mobile-expanded" : ""}`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <AsciiCorners />
                  {tier.popular && <span className="popular-badge">PRIORITY TENDER</span>}
                  {tier.custom && <span className="custom-badge">BUILD YOUR OWN</span>}

                  <div className="tier-header">
                    <span className="tier-code">{tier.code}</span>
                    <h2 className="tier-name">{tier.name}</h2>
                    <div className="tier-price">{tier.price}</div>
                  </div>

                  <div className="mobile-accordion-header" onClick={(e) => toggleMobileExpand(tier.id, e)}>
                    <div className="mobile-title-info">
                      <span className="mobile-code">[{tier.code}]</span>
                      <span className="mobile-name">{tier.name}</span>
                      <span className="mobile-price">— {tier.price}</span>
                    </div>
                    <span className="mobile-icon">{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  <div className="tier-details-collapsible">
                    <div className="tier-clearance">
                      <span>REQ CLEARANCE:</span> <strong>{tier.clearance}</strong>
                    </div>

                    <ul className="tier-perks">
                      {tier.perks.map((perk, i) => (
                        <li key={i}>
                          <span className="bullet">+</span>
                          {perk}
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
                </div>
              );
            })}
          </div>
        </section>

        <section className="tender-form-section ascii-box">
          <AsciiCorners />
          <div className="panel-bar">&gt; SUBMIT TENDER / TRANSMIT PROPOSAL</div>

          <form className="tender-form" onSubmit={handleTender}>
            <input
              ref={honeyRef}
              type="text"
              name="_honey"
              aria-hidden="true"
              tabIndex="-1"
              autoComplete="off"
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                opacity: 0
              }}
            />

            <div className="form-grid">
              <div className="form-group">
                <label>&gt; ORGANIZATION / CONTRACTOR</label>
                <input ref={orgRef} type="text" required placeholder="e.g. Acme Corp / BAE Systems" />
              </div>
              <div className="form-group">
                <label>&gt; CONTACT EMAIL</label>
                <input ref={emailRef} type="email" required placeholder="you@yourcompany.com" />
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
                <textarea ref={briefRef} rows="3" placeholder="Specify interest, custom requirements, or timeline..."></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={sendState === "sending"}>
                {sendState === "sending" ? "[ TRANSMITTING... ]" : "[ TRANSMIT TENDER BID ]"}
              </button>
              {sendState === "sent" && (
                <span className="submit-msg">
                  &gt; TENDER TRANSMITTED. REPLY PENDING FROM MIS.
                </span>
              )}
              {sendState === "failed" && (
                <span className="submit-msg submit-msg-warn">
                  &gt; RELAY UNREACHABLE. FELL BACK TO YOUR MAIL CLIENT.
                </span>
              )}
              {sendState === "throttled" && (
                <span className="submit-msg submit-msg-warn">
                  &gt; PLEASE WAIT BEFORE SUBMITTING ANOTHER TENDER.
                </span>
              )}
            </div>

            {tenderSubmitted && sendState === "failed" && (
              <div className="fallback-panel ascii-box">
                <AsciiCorners />
                <div className="panel-bar fallback-bar">
                  <span>&gt; MANUAL TRANSMISSION FALLBACK</span>
                  <span className="green-tag">STANDBY</span>
                </div>
                <p className="fallback-note">
                  The direct relay couldn't be reached, so your mail client should have opened
                  instead. If it didn't, copy the dossier below and paste it into an email
                  addressed to <span className="fallback-addr">{PARTNERSHIP_EMAIL}</span>.
                </p>
                <pre className="fallback-dossier">{dossierText}</pre>
                <div className="fallback-actions">
                  <button type="button" className="copy-btn" onClick={handleCopyDossier}>
                    {copyState === "copied"
                      ? "[ COPIED TO CLIPBOARD ]"
                      : copyState === "failed"
                      ? "[ COPY FAILED — SELECT MANUALLY ]"
                      : "[ COPY DOSSIER TEXT ]"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>

      </main>

      {revealOpen && (
        <div
          className={`chapter-reveal-overlay ${revealClosing ? "is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={handleRevealAdvance}
        >
          <div
            className="chapter-reveal-card"
            ref={revealCardRef}
            onClick={(e) => {
              // Clicking inside the card (including dragging a
              // scrollbar) never advances the story — only the
              // backdrop click or the button below does. This is
              // what lets people freely scroll/select text without
              // accidentally skipping or closing it.
              e.stopPropagation();
            }}
          >
            {PARTNERSHIPS_CHAPTER_PARAGRAPHS.slice(0, revealStep + 1).map((para, i) => (
              <p
                key={i}
                className={i === revealStep ? "is-new" : ""}
                style={{
                  animation: i === revealStep ? `reveal-line-in 0.6s ease both` : "none",
                  opacity: 1,
                  transform: "none",
                }}
              >
                {para}
              </p>
            ))}
            <button
              type="button"
              className="chapter-reveal-close"
              onClick={(e) => {
                e.stopPropagation();
                handleRevealAdvance();
              }}
            >
              {revealStep < PARTNERSHIPS_CHAPTER_PARAGRAPHS.length - 1
                ? "[ click to continue ]"
                : "[ close ]"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}