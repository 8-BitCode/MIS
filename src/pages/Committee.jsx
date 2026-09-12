import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import "./Committee.css";
import Nav from "./Nav";
import { markStage, useClearance } from "./clearance";
import Sana1 from "../Assets/Sana1.jpeg";
import Pau1 from "../Assets/Pau1.jpeg";
import Pau2 from "../Assets/Pau2.jpeg";
import Pau3 from "../Assets/Pau3.jpeg";
import Pau4 from "../Assets/Pau4.jpeg";
import Pau5 from "../Assets/Pau5.jpeg";
import Akram1 from "../Assets/Akram1.png";
import Akram2 from "../Assets/Akram2.png";
import Amelia1 from "../Assets/Amelia1.jpeg";
import Amelia2 from "../Assets/Amelia2.jpeg";
import Viral1 from "../Assets/Viral1.png"
import Viral2 from "../Assets/Viral2.png"
import Viral3 from "../Assets/Viral3.png"
import Valeria1 from "../Assets/Valeria1.png"

// ── MEMBER DATA ──────────────────────────────────────────────────
const INITIAL_MEMBERS = [
  {
    id: "member-1",
    file: "01",
    role: "Founder / Co-Chief",
    dept: "EXECUTIVE",
    name: "Amelia",
    degree: "Computer Science",
    funFact: "You’re on my watchlist",
    photos: [Amelia1, Amelia2],
    pos: { top: 22, left: 30 },
    connections: ["member-2", "member-3", "member-4"]
  },
  {
    id: "member-2",
    file: "02",
    role: "Co-Chief",
    dept: "EXECUTIVE",
    name: "Viral",
    degree: "Computer Science",
    funFact: "I love caffeine",
    photos: [Viral1, Viral2, Viral3],
    pos: { top: 22, left: 70 },
    connections: ["member-3", "member-5"]
  },
  {
    id: "member-3",
    file: "03",
    role: "Treasurer",
    dept: "OPERATIONS",
    name: " Valeria",
    degree: "Computer Science",
    funFact: "I know how to embroider",
    photos: [Valeria1],
    pos: { top: 52, left: 25 },
    connections: ["member-6"]
  },
  {
    id: "member-4",
    file: "04",
    role: "Inclusion Officer",
    dept: "ADVOCACY",
    name: "Sana Irfan",
    degree: "Computer Science",
    funFact: "I can never say no to dessert",
    photos: [Sana1],
    pos: { top: 52, left: 50 },
    connections: ["member-5", "member-6"]
  },
  {
    id: "member-5",
    file: "05",
    role: "Secretary",
    dept: ["OPERATIONS", "EXECUTIVE"],
    name: "Pau Carrillo Velasco",
    degree: "Computer Science",
    funFact: "I’ve lived in 4 different continents",
    photos: [Pau1, Pau2, Pau3, Pau4, Pau5],
    pos: { top: 52, left: 75 },
    connections: ["member-6"]
  },
  {
    id: "member-6",
    file: "06",
    role: "Lead Web Developer",
    dept: "DEVELOPMENT",
    name: "Akram",
    degree: "Computer Science",
    funFact: "Im secretly an alien",
    photos: [Akram1, Akram2],
    pos: { top: 82, left: 50 },
    connections: []
  }
];

const DEPARTMENTS = ["ALL UNITS", "EXECUTIVE", "OPERATIONS", "ADVOCACY", "DEVELOPMENT"];

function matchesDept(member, filter) {
  if (filter === "ALL UNITS") return true;
  const depts = Array.isArray(member.dept) ? member.dept : [member.dept];
  return depts.includes(filter);
}

const REDACT_TILES = Array.from({ length: 110 }, (_, i) => i);
const ALIEN_NEAR_RADIUS = 70;
const ALIEN_HIT_RADIUS = 24;
const CLAMP_LEFT_MIN = 6;
const CLAMP_LEFT_MAX = 94;
const CLAMP_TOP_MIN = 8;
const CLAMP_TOP_MAX = 92;
const JOLT_TRIGGER_MARGIN = 4;

//ignore scrapped code
const COMMITTEE_CHAPTER_PARAGRAPHS = [
  "\"No,\" he said, waving off the sommelier's fifth suggestion before they had even finished. \"What would they think if they saw me with a bottle so garish? I need something more appropriate, something more audience-friendly.\"",
  "With a kind smile and a clenched jaw, the sommelier replied simply, \"I will check in the back.\"",
  "There was no back. In fact, the restaurant had no sommelier. A waiter, befuddled by this situation for the briefest moment, smirked, thinking, Did he bring his own wine expert? before realizing it was their table.",
  "\"It was too garish, wasn't it?\"",
  "\"What was, sir?\"",
  "\"The bottle, the bottle was too much!\" the man said with deep concern. \"Please don't tell the kitchen staff.\"",
  "His concern was genuine, which stood in stark contrast to every instinct telling the waiter that the man standing right in front of them was deeply duplicitous.",
  "\"My lips are sealed, sir. It's not my problem,\" said the waiter.",
  "\"That's the exact kind of mindset I like, the kind that keeps me in this seat, getting served by strong men like you,\" the man said with all too much enthusiasm.",
  "The waiter gritted their teeth. \"So, what will it be today, sir?\"",
  "\"Well, what does the kitchen recommend? If you recall.\"",
  "\"I'm not su...\"",
  "\"Surprise me,\" the man said, throwing his menu down with a gnashing grin. \"Everyone's eating on my account anyway,\" he added much too audibly, in a clear attempt for the other tables to hear.",
  "\"I will check in the ba... kitchen, sir.\"",
  "\"No... no, my apologies. I'll actually have the chicken. The working man's meat.\"",
  "\"Excellent choice, sir.\"",
  "The waiter scurried along to an access panel in a private room. Knocking on the hatch, they called out, \"Uhh... the chicken dish, please.\"",
  "Silence echoed.",
  "\"For the wine guy?\"",
  "As soon as they said it, the hatch opened, sliding out an exquisite yet small dish of marbled chicken.",
  "\"That was quick?!\"",
  "Bringing themself back to composure, the waiter gracefully walked back to the table, dish in hand. \"Compliments of the chef.\"",
  "The man hadn't even noticed the waiter had arrived, peering all around him, trying to listen in on the other tables. Something told the waiter he wouldn't be touching his food.",
];

function stringPath(x1, y1, x2, y2, seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 10007;
  }
  const norm = (hash / 10007) * 2 - 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const sag = 2.2 + Math.abs(norm * 3.0);
  const bow = norm * 3.5;
  const cx = mx + (dy / 100) * bow;
  const cy = my + sag + Math.abs(dx / 100) * 1.2;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

const AsciiCorners = memo(() => (
  <>
    <span className="ascii-corner tl" aria-hidden="true">+</span>
    <span className="ascii-corner tr" aria-hidden="true">+</span>
    <span className="ascii-corner bl" aria-hidden="true">+</span>
    <span className="ascii-corner br" aria-hidden="true">+</span>
  </>
));

const Portrait = memo(({ member, photoIndex = 0 }) => {
  const currentPhoto = member.photos && member.photos.length > 0 ? member.photos[photoIndex] : null;

  if (currentPhoto) {
    return (
      <img
        src={currentPhoto}
        alt={member.name}
        className="portrait-img"
        draggable="false"
      />
    );
  }
  return (
    <div className="portrait-redacted" role="img" aria-label="No photo on file">
      {REDACT_TILES.map((i) => (
        <span key={i} />
      ))}
    </div>
  );
});

const FormattedIntel = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(alien)/gi);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === "alien" ? (
          <span key={i} className="glowing-alien">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function Committee() {
  const clearedStages = useClearance();
  const committeeSolved = clearedStages.has("committee");

  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [hatchOpen, setHatchOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealClosing, setRevealClosing] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const alienRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [deptFilter, setDeptFilter] = useState("ALL UNITS");
  const [entryMode, setEntryMode] = useState("open");

  const [boardZoomed, setBoardZoomed] = useState(false);
  const [zoomVars, setZoomVars] = useState({ "--zoom-x": "50%", "--zoom-y": "50%" });

  const [joltingIds, setJoltingIds] = useState({});

  const boardRef = useRef(null);
  const draggingRef = useRef(null);
  const triggerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const openTimestampRef = useRef(0);
  const joltTimersRef = useRef({});
  const lastValidPosRef = useRef(null);
  const revealCardRef = useRef(null);

  // Lock the page scroll from JS too — the CSS `:has()` rule that does
  // this normally doesn't work in every browser, and when it silently
  // fails, swiping/scrolling over the reveal card scrolls the real
  // page underneath it instead of the card itself.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevHeight = document.body.style.height;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100dvh";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.height = prevHeight;
    };
  }, []);

  const activeMember = useMemo(() => members.find((m) => m.id === activeId), [members, activeId]);

  const visibleMembers = useMemo(
    () => members.filter((m) => matchesDept(m, deptFilter)),
    [members, deptFilter]
  );

  const activeIndex = useMemo(
    () => visibleMembers.findIndex((m) => m.id === activeId),
    [visibleMembers, activeId]
  );

  const triggerJolt = useCallback((id) => {
    setJoltingIds((prev) => ({ ...prev, [id]: true }));
    if (joltTimersRef.current[id]) clearTimeout(joltTimersRef.current[id]);
    joltTimersRef.current[id] = window.setTimeout(() => {
      setJoltingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      delete joltTimersRef.current[id];
    }, 450);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(joltTimersRef.current).forEach(clearTimeout);
      joltTimersRef.current = {};
    };
  }, []);

  const openFile = useCallback((member, targetElement) => {
    if (targetElement) triggerRef.current = targetElement;
    openTimestampRef.current = Date.now();
    setClosing(false);
    setEntryMode("open");
    setActivePhotoIndex(0);
    setZoomVars({ "--zoom-x": `${member.pos.left}%`, "--zoom-y": `${member.pos.top}%` });
    setBoardZoomed(true);
    setActiveId(member.id);
  }, []);

  const closeFile = useCallback(() => {
    setClosing((isAlreadyClosing) => {
      if (isAlreadyClosing) return true;

      setBoardZoomed(false);
      window.setTimeout(() => {
        setActiveId(null);
        setActivePhotoIndex(0);
        setClosing(false);
        if (triggerRef.current) triggerRef.current.focus();
      }, 300);

      return true;
    });
  }, []);

  const handleCyclePhoto = (e) => {
    e.stopPropagation();
    if (Date.now() - openTimestampRef.current < 300) return;
    if (activeMember && activeMember.photos && activeMember.photos.length > 1) {
      setActivePhotoIndex((prevIndex) => (prevIndex + 1) % activeMember.photos.length);
    }
  };

  const handlePointerDown = (member, event) => {
    if (event.button !== undefined && event.button !== 0) return;
    lastValidPosRef.current = { top: member.pos.top, left: member.pos.left };
    draggingRef.current = {
      member,
      targetElement: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      hasDragged: false,
      joltedThisDrag: false
    };
  };

  const distanceToAlien = useCallback((clientX, clientY) => {
    if (!alienRef.current) return Infinity;
    const a = alienRef.current.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    return Math.hypot(clientX - ax, clientY - ay);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const current = draggingRef.current;
    if (!current || !boardRef.current) return;

    const dx = Math.abs(e.clientX - current.startX);
    const dy = Math.abs(e.clientY - current.startY);
    if (dx > 6 || dy > 6) current.hasDragged = true;

    if (current.hasDragged) {
      const draggedId = current.member.id;
      const rect = boardRef.current.getBoundingClientRect();

      const isAkram = draggedId === "member-6";
      const nearAlien = isAkram && distanceToAlien(e.clientX, e.clientY) < ALIEN_NEAR_RADIUS;
      setHatchOpen(nearAlien);

      const rawLeft = ((e.clientX - rect.left) / rect.width) * 100;
      const rawTop = ((e.clientY - rect.top) / rect.height) * 100;

      const insideBounds =
        rawLeft >= CLAMP_LEFT_MIN && rawLeft <= CLAMP_LEFT_MAX &&
        rawTop  >= CLAMP_TOP_MIN  && rawTop  <= CLAMP_TOP_MAX;

      const pushedPastLeft =
        rawLeft < CLAMP_LEFT_MIN - JOLT_TRIGGER_MARGIN ||
        rawLeft > CLAMP_LEFT_MAX + JOLT_TRIGGER_MARGIN;
      const pushedPastTop =
        rawTop < CLAMP_TOP_MIN - JOLT_TRIGGER_MARGIN ||
        rawTop > CLAMP_TOP_MAX + JOLT_TRIGGER_MARGIN;
      const pushedPastBoundary = pushedPastLeft || pushedPastTop;

      if (!nearAlien && pushedPastBoundary && !current.joltedThisDrag) {
        current.joltedThisDrag = true;
        triggerJolt(draggedId);

        if (lastValidPosRef.current) {
          const snap = lastValidPosRef.current;
          setMembers((prev) =>
            prev.map((m) => (m.id === draggedId ? { ...m, pos: { top: snap.top, left: snap.left } } : m))
          );
        }
        return;
      }

      if (!nearAlien && insideBounds) {
        lastValidPosRef.current = {
          left: Math.max(CLAMP_LEFT_MIN, Math.min(CLAMP_LEFT_MAX, rawLeft)),
          top: Math.max(CLAMP_TOP_MIN, Math.min(CLAMP_TOP_MAX, rawTop))
        };
        if (current.joltedThisDrag) current.joltedThisDrag = false;
      }

      const left = nearAlien ? rawLeft : Math.max(CLAMP_LEFT_MIN, Math.min(CLAMP_LEFT_MAX, rawLeft));
      const top = nearAlien ? rawTop : Math.max(CLAMP_TOP_MIN, Math.min(CLAMP_TOP_MAX, rawTop));
      setMembers((prev) => prev.map((m) => (m.id === draggedId ? { ...m, pos: { top, left } } : m)));
    }
  }, [distanceToAlien, triggerJolt]);

  const handlePointerUp = useCallback((e) => {
    const current = draggingRef.current;
    if (!current) return;

    if (!current.hasDragged) {
      openFile(current.member, current.targetElement);
    } else if (current.member.id === "member-6") {
      const landedOnAlien = distanceToAlien(e.clientX, e.clientY) < ALIEN_HIT_RADIUS;

      if (landedOnAlien) {
        markStage("committee");
        setRevealOpen(true);
        setMembers((prev) =>
          prev.map((m) => (m.id === "member-6" ? { ...m, pos: { top: 82, left: 50 } } : m))
        );
      } else if (current.joltedThisDrag) {
        const snap = lastValidPosRef.current;
        if (snap) {
          setMembers((prev) =>
            prev.map((m) => (m.id === "member-6" ? { ...m, pos: { top: snap.top, left: snap.left } } : m))
          );
        }
      }
    }

    setHatchOpen(false);
    draggingRef.current = null;
    lastValidPosRef.current = null;
  }, [openFile, distanceToAlien]);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const navigateModal = useCallback(
    (direction) => {
      if (activeIndex === -1 || visibleMembers.length === 0) return;
      let nextIndex = activeIndex + direction;
      if (nextIndex < 0) nextIndex = visibleMembers.length - 1;
      if (nextIndex >= visibleMembers.length) nextIndex = 0;

      const nextMember = visibleMembers[nextIndex];
      setEntryMode(direction > 0 ? "next" : "prev");
      setActivePhotoIndex(0);
      setZoomVars({ "--zoom-x": `${nextMember.pos.left}%`, "--zoom-y": `${nextMember.pos.top}%` });
      setActiveId(nextMember.id);
    },
    [activeIndex, visibleMembers]
  );

  useEffect(() => {
    if (activeId && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        closeFile();
      }
      if (e.key === "ArrowRight") navigateModal(1);
      if (e.key === "ArrowLeft") navigateModal(-1);
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [activeId, closeFile, navigateModal]);

  const stringConnections = useMemo(() => {
    const list = [];
    const seen = new Set();
    members.forEach((m) => {
      m.connections.forEach((targetId) => {
        const target = members.find((t) => t.id === targetId);
        if (target) {
          const key = [m.id, targetId].sort().join("---");
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              id: key,
              fromId: m.id,
              toId: targetId,
              path: stringPath(m.pos.left, m.pos.top, target.pos.left, target.pos.top, key)
            });
          }
        }
      });
    });
    return list;
  }, [members]);

  const handleCloseReveal = useCallback(() => {
    setRevealClosing(true);
    setTimeout(() => {
      setRevealOpen(false);
      setRevealClosing(false);
      setRevealStep(0);
    }, 300);
  }, []);

  const handleRevealAdvance = useCallback(() => {
    if (revealStep < COMMITTEE_CHAPTER_PARAGRAPHS.length - 1) {
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

  return (
    <>
      <Nav />
      <div className="roster-page">
        <div className="noise" aria-hidden="true" />

        <header className="roster-header">
          <div className="titlebar">
            <span className="titlebar-path">~/committee/roster.sys</span>
          </div>

          <h1 className="roster-h1">
            <span className="prompt">&gt;</span>
            EXECUTIVE COMMITTEE
            <span className="cursor" aria-hidden="true" />
          </h1>

          <p className="roster-sub">
            CLEARANCE: <span>RESTRICTED</span> · UNITS: {DEPARTMENTS.length - 1} · OPERATIVES: {members.length}
          </p>

          <nav className="filter-row" aria-label="Filter by unit">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                className={`filter-btn ${deptFilter === dept ? "is-active" : ""}`}
                onClick={() => setDeptFilter(dept)}
              >
                {dept}
              </button>
            ))}
          </nav>
        </header>

        <div className={`board-frame ascii-box ${hatchOpen ? "hatch-open" : ""}`}>
          <AsciiCorners />
          <span className="hatch-gap" aria-hidden="true" />
          <div className={`board ${boardZoomed ? "is-zoomed" : ""} ${hatchOpen ? "hatch-open" : ""}`} ref={boardRef} style={zoomVars}>
            <svg className="board-strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {stringConnections.map((s) => {
                const isConnected = hoveredId === s.fromId || hoveredId === s.toId;
                const isDimmed = hoveredId !== null && !isConnected;
                return (
                  <g key={s.id} className={`string-group ${isConnected ? "is-highlighted" : ""} ${isDimmed ? "is-dimmed" : ""}`}>
                    <path d={s.path} className="string-body" />
                  </g>
                );
              })}
            </svg>

            <div className="sys-note ascii-box">
              <AsciiCorners />
              <strong>SYS.LOG</strong>
              <p>Select a node to pull its file. Drag a node to reposition it on the board.</p>
            </div>

            <ul className="board-list" aria-label="Committee members board">
              {members.map((m) => {
                const matchesFilter = matchesDept(m, deptFilter);
                const isJolting = !!joltingIds[m.id];
                return (
                  <li
                    key={m.id}
                    className={`pin-wrapper ${!matchesFilter ? "is-filtered-out" : ""} ${isJolting ? "is-jolting" : ""}`}
                    style={{ top: `${m.pos.top}%`, left: `${m.pos.left}%` }}
                    onPointerDown={(e) => handlePointerDown(m, e)}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="pin-card ascii-box" role="button" tabIndex={0} aria-label={`Open personnel file for ${m.role}`}>
                      <AsciiCorners />
                      <div className="pin-photo-frame">
                        <span className="pin-id">N-{m.file}</span>
                        <Portrait member={m} photoIndex={0} />
                        <span className="pin-hint">&gt;&gt; open</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {activeMember && (
          <div
            className={`dossier-overlay ${closing ? "is-closing" : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget && Date.now() - openTimestampRef.current > 250) {
                closeFile();
              }
            }}
          >
            <div
              key={activeMember.id}
              className={`dossier ascii-box dossier--enter-${entryMode} ${closing ? "is-closing" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dossier-title"
              onClick={(e) => e.stopPropagation()}
            >
              <AsciiCorners />
              <div className="dossier-inner">
                <div className="scan-sweep" aria-hidden="true" />
                <div className="dossier-top">
                  <span className="dossier-file-tag">
                    {activeMember.file} — {activeMember.role.toUpperCase()}
                  </span>
                  <span className="dossier-flag">RESTRICTED</span>
                  <button
                    type="button"
                    ref={closeBtnRef}
                    className="dossier-close"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeFile();
                    }}
                  >
                    [ ESC ] CLOSE
                  </button>
                </div>

                <div className="dossier-body">
                  <div
                    className={`dossier-portrait-frame ascii-box ${activeMember.photos?.length > 1 ? "is-clickable" : ""}`}
                    onClick={handleCyclePhoto}
                  >
                    <AsciiCorners />
                    <Portrait member={activeMember} photoIndex={activePhotoIndex} />

                    {activeMember.photos?.length > 1 && (
                      <div className="photo-cycle-indicator">
                        [ ↺ CLICK TO CYCLE ({activePhotoIndex + 1}/{activeMember.photos.length}) ]
                      </div>
                    )}

                    <div className="portrait-caption">
                      {activeMember.photos?.length > 0 ? "" : "NO IMAGE ON FILE"}
                    </div>
                  </div>

                  <div className="dossier-footer">
                    <div className="dossier-role-block">
                      <span className="dossier-eyebrow">OFFICIAL DESIGNATION</span>
                      <h2
                        id="dossier-title"
                        className="dossier-role"
                        style={{ "--len": activeMember.role.length, "--chw": `${activeMember.role.length}ch` }}
                      >
                        {activeMember.role}
                      </h2>
                      <div className="dossier-subject">{activeMember.name}</div>
                    </div>

                    <div className="dossier-fields">
                      <div className="field-row">
                        <span className="field-label">PROGRAM</span>
                        <span className="field-value">{activeMember.degree}</span>
                      </div>
                      <div className="field-row field-row--note">
                        <span className="field-label">FUN FACT</span>
                        <span className="field-value">
                          <FormattedIntel text={activeMember.funFact} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dossier-nav">
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateModal(-1);
                    }}
                    aria-label="Previous file"
                  >
                    &lt; PREV
                  </button>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateModal(1);
                    }}
                    aria-label="Next file"
                  >
                    NEXT &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <span
          ref={alienRef}
          className={`alien-mark ${committeeSolved ? "is-known" : ""}`}
          aria-hidden="true"
          onClick={() => {
            if (committeeSolved) setRevealOpen(true);
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <ellipse cx="12" cy="10" rx="7" ry="8" fill="none" stroke="currentColor" strokeWidth="0.7" />
            <ellipse cx="8.7" cy="9.5" rx="1.5" ry="2" fill="currentColor" />
            <ellipse cx="15.3" cy="9.5" rx="1.5" ry="2" fill="currentColor" />
            <path d="M6 15c2 3 10 3 12 0" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </svg>
        </span>

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
                // Clicking inside the card (including dragging an
                // overlay-style scrollbar, which draws on top of the
                // content instead of reserving its own space) no
                // longer advances the story — only clicking the
                // backdrop or the explicit button below does. This
                // is what lets people freely scroll/select text
                // without accidentally skipping or closing it.
                e.stopPropagation();
              }}
            >
              {COMMITTEE_CHAPTER_PARAGRAPHS.slice(0, revealStep + 1).map((para, i) => (
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
                {revealStep < COMMITTEE_CHAPTER_PARAGRAPHS.length - 1 ? "[ click to continue ]" : "[ close ]"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}