import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useEvidenceSFX } from "./useEvidenceSFX";
import "./Committee.css";

// ── MEMBER DATA (5 ROLES / 6 POSITIONS) ─────────────────────────────
const INITIAL_MEMBERS = [
  {
    id: "member-1",
    file: "01",
    role: "Co-Chief",
    dept: "EXECUTIVE",
    name: "[MEMBER NAME 1]",
    degree: "[DEGREE / PROGRAM]",
    funFact: "[FUN FACT]",
    photo: null,
    pos: { top: 22, left: 30 },
    rotate: -4,
    tapeAngle: -12,
    connections: ["member-2", "member-3", "member-4"]
  },
  {
    id: "member-2",
    file: "02",
    role: "Co-Chief",
    dept: "EXECUTIVE",
    name: "[MEMBER NAME 2]",
    degree: "[DEGREE / PROGRAM]",
    funFact: "[FUN FACT]",
    photo: null,
    pos: { top: 22, left: 70 },
    rotate: 3,
    tapeAngle: 15,
    connections: ["member-3", "member-5"]
  },
  {
    id: "member-3",
    file: "03",
    role: "Treasurer",
    dept: "OPERATIONS",
    name: "[MEMBER NAME 3]",
    degree: "[DEGREE / PROGRAM]",
    funFact: "[FUN FACT]",
    photo: null,
    pos: { top: 52, left: 25 },
    rotate: -2,
    tapeAngle: -8,
    connections: ["member-6"]
  },
  {
    id: "member-4",
    file: "04",
    role: "Inclusion Officer",
    dept: "ADVOCACY",
    name: "[MEMBER NAME 4]",
    degree: "[DEGREE / PROGRAM]",
    funFact: "[FUN FACT]",
    photo: null,
    pos: { top: 52, left: 50 },
    rotate: 5,
    tapeAngle: 20,
    connections: ["member-5", "member-6"]
  },
  {
    id: "member-5",
    file: "05",
    role: "Secretary",
    dept: "OPERATIONS",
    name: "[MEMBER NAME 5]",
    degree: "[DEGREE / PROGRAM]",
    funFact: "[FUN FACT]",
    photo: null,
    pos: { top: 52, left: 75 },
    rotate: -3,
    tapeAngle: -10,
    connections: ["member-6"]
  },
  {
    id: "member-6",
    file: "06",
    role: "Lead Web Developer",
    dept: "DEVELOPMENT",
    name: "[MEMBER NAME 6]",
    degree: "[DEGREE / PROGRAM]",
    funFact: "[FUN FACT]",
    photo: null,
    pos: { top: 80, left: 50 },
    rotate: 2,
    tapeAngle: 6,
    connections: []
  }
];

const DEPARTMENTS = [
  "ALL UNITS",
  "EXECUTIVE",
  "OPERATIONS",
  "ADVOCACY",
  "DEVELOPMENT"
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

const Pushpin = memo(() => (
  <div className="pushpin" aria-hidden="true">
    <div className="pin-head" />
    <div className="pin-shadow" />
  </div>
));

const Silhouette = memo(() => (
  <svg viewBox="0 0 100 120" className="silhouette-hero" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect width="100" height="120" fill="#ded2b5" />
    <circle cx="50" cy="45" r="22" fill="#a39675" />
    <path d="M12 120c0-28 20-44 38-44s38 16 38 44z" fill="#a39675" />
    <path d="M38 72 L50 88 L62 72 Z" fill="#7a6e50" />
  </svg>
));

const HeroPhoto = memo(({ member }) => {
  if (member.photo) {
    return <img src={member.photo} alt={member.name} className="hero-photo-img" />;
  }
  return (
    <div className="placeholder-photo hero-placeholder">
      <Silhouette />
    </div>
  );
});

export default function Committee() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [activeId, setActiveId] = useState(null);
  const [closing, setClosing] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [deptFilter, setDeptFilter] = useState("ALL UNITS");
  const [entryMode, setEntryMode] = useState("open"); // "open" | "next" | "prev"
  const [boardZoomed, setBoardZoomed] = useState(false);
  const [zoomVars, setZoomVars] = useState({ "--zoom-x": "50%", "--zoom-y": "50%" });

  const boardRef = useRef(null);
  const draggingRef = useRef(null);
  const triggerRef = useRef(null);
  const openTimestampRef = useRef(0);
  const { playPinThud, playDossierOpen } = useEvidenceSFX();

  const activeMember = useMemo(
    () => members.find((m) => m.id === activeId),
    [members, activeId]
  );

  const activeIndex = useMemo(
    () => members.findIndex((m) => m.id === activeId),
    [members, activeId]
  );

  const openFile = useCallback((member, targetElement) => {
    if (targetElement) triggerRef.current = targetElement;
    openTimestampRef.current = Date.now();
    playDossierOpen();
    setClosing(false);
    setEntryMode("open");

    setZoomVars({ "--zoom-x": `${member.pos.left}%`, "--zoom-y": `${member.pos.top}%` });
    setBoardZoomed(true);
    setActiveId(member.id);
  }, [playDossierOpen]);

  const closeFile = useCallback(() => {
    setClosing(true);
    setBoardZoomed(false);
    window.setTimeout(() => {
      setActiveId(null);
      setClosing(false);
      if (triggerRef.current) triggerRef.current.focus();
    }, 560);
  }, []);

  const handlePointerDown = (member, event) => {
    if (event.button !== undefined && event.button !== 0) return;

    draggingRef.current = {
      member,
      targetElement: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      hasDragged: false
    };
  };

  const handlePointerMove = useCallback((e) => {
    const current = draggingRef.current;
    if (!current || !boardRef.current) return;

    const dx = Math.abs(e.clientX - current.startX);
    const dy = Math.abs(e.clientY - current.startY);

    if (dx > 6 || dy > 6) {
      current.hasDragged = true;
    }

    if (current.hasDragged) {
      const draggedId = current.member.id;
      const rect = boardRef.current.getBoundingClientRect();
      const left = Math.max(6, Math.min(94, ((e.clientX - rect.left) / rect.width) * 100));
      const top = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

      setMembers((prev) =>
        prev.map((m) =>
          m.id === draggedId ? { ...m, pos: { top, left } } : m
        )
      );
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const current = draggingRef.current;
    if (!current) return;

    if (current.hasDragged) {
      playPinThud();
    } else {
      openFile(current.member, current.targetElement);
    }
    draggingRef.current = null;
  }, [openFile, playPinThud]);

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
      if (activeIndex === -1) return;
      let nextIndex = activeIndex + direction;
      if (nextIndex < 0) nextIndex = members.length - 1;
      if (nextIndex >= members.length) nextIndex = 0;
      const nextMember = members[nextIndex];
      playDossierOpen();
      setEntryMode(direction > 0 ? "next" : "prev");
      setZoomVars({ "--zoom-x": `${nextMember.pos.left}%`, "--zoom-y": `${nextMember.pos.top}%` });
      setActiveId(nextMember.id);
    },
    [activeIndex, members, playDossierOpen]
  );

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeFile();
      if (e.key === "ArrowRight") navigateModal(1);
      if (e.key === "ArrowLeft") navigateModal(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  return (
    <div className="board-page">
      <div className="grain" aria-hidden="true" />

      <header className="board-header">
        <div className="board-title-tag">
          <span className="case-label">EXECUTIVE COMMITTEE DOSSIER</span>
          <h1>COMMITTEE BOARD</h1>
        </div>

        <nav className="dept-filter-bar" aria-label="Department Filters">
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

      <div className="board-frame">
        <div
          className={`board ${boardZoomed ? "is-zoomed" : ""}`}
          ref={boardRef}
          style={zoomVars}
        >
          <svg
            className="board-strings"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {stringConnections.map((s) => {
              const isConnected = hoveredId === s.fromId || hoveredId === s.toId;
              const isDimmed = hoveredId !== null && !isConnected;

              return (
                <g
                  key={s.id}
                  className={`string-group ${isConnected ? "is-highlighted" : ""} ${
                    isDimmed ? "is-dimmed" : ""
                  }`}
                >
                  <path d={s.path} className="string-shadow" />
                  <path d={s.path} className="string-body" />
                  <path d={s.path} className="string-sheen" />
                </g>
              );
            })}
          </svg>

          <div className="sticky-note sticky-top-left">
            <Pushpin />
            <div className="note-body">
              <strong>INVESTIGATION:</strong>
              <p>Click a photo card to open credentials or drag to rearrange evidence.</p>
            </div>
          </div>

          <ul className="board-list" aria-label="Committee Members Board">
            {members.map((m) => {
              const matchesFilter = deptFilter === "ALL UNITS" || m.dept === deptFilter;

              return (
                <li
                  key={m.id}
                  className={`pin-wrapper ${!matchesFilter ? "is-filtered-out" : ""}`}
                  style={{
                    top: `${m.pos.top}%`,
                    left: `${m.pos.left}%`,
                    "--rot": `${m.rotate}deg`
                  }}
                  onPointerDown={(e) => handlePointerDown(m, e)}
                  onMouseEnter={() => setHoveredId(m.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className="pin-card"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open personnel file for ${m.role}`}
                  >
                    <Pushpin />

                    {/* ONLY THE POLAROID PICTURE FRAME REMAINS */}
                    <div className="polaroid-frame">
                      <HeroPhoto member={m} />
                      <span className="hover-hint">VIEW DOSSIER</span>
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
            className={`case-folder case-folder--enter-${entryMode} ${closing ? "is-closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scan-sweep" aria-hidden="true" />
            <div className="folder-tab">FILE #{activeMember.file} — {activeMember.role.toUpperCase()}</div>

            <div
              className="dossier dossier--hero-photo"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dossier-title"
            >
              <div className="coffee-stain" aria-hidden="true" />

              <div className="dossier-top">
                <span className="dossier-classification">RESTRICTED ACCESS</span>
                <button className="dossier-close" onClick={closeFile} autoFocus>
                  CLOSE &#10005;
                </button>
              </div>

              <div className="dossier-body dossier-body--hero">
                <div className="paperclip" aria-hidden="true" />

                <div className="dossier-hero-frame">
                  <HeroPhoto member={activeMember} />
                </div>

                <div className="dossier-meta-wrapper">
                  <div className="dossier-profile-header">
                    <div>
                      <span className="dossier-role-eyebrow">OFFICIAL DESIGNATION</span>
                      <h2 id="dossier-title" className="dossier-role-title-prominent">
                        {activeMember.role}
                      </h2>
                    </div>
                    <div className="dossier-name-sub">{activeMember.name}</div>
                  </div>

                  <div className="dossier-fields">
                    <div className="field-row">
                      <span className="field-label">DEGREE</span>
                      <span className="field-value">{activeMember.degree}</span>
                    </div>
                    <div className="field-row field-row--note">
                      <span className="field-label">FUN FACT</span>
                      <span className="field-value">{activeMember.funFact}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dossier-nav-bar">
                <button
                  className="carousel-nav nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateModal(-1);
                  }}
                  aria-label="Previous Dossier File"
                >
                  &#10094; PREV
                </button>
                <button
                  className="carousel-nav nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateModal(1);
                  }}
                  aria-label="Next Dossier File"
                >
                  NEXT &#10095;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}