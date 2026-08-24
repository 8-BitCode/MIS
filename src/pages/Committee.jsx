import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
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
    pos: { top: 82, left: 50 },
    connections: []
  }
];

const DEPARTMENTS = ["ALL UNITS", "EXECUTIVE", "OPERATIONS", "ADVOCACY", "DEVELOPMENT"];

// A block of deterministic "static" tiles standing in for a redacted photo.
const REDACT_TILES = Array.from({ length: 110 }, (_, i) => i);

// Slightly bowed bezier between two board points, deterministic per pair.
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

const Portrait = memo(({ member }) => {
  if (member.photo) {
    return <img src={member.photo} alt={member.name} className="portrait-img" />;
  }
  return (
    <div className="portrait-redacted" role="img" aria-label="No photo on file">
      {REDACT_TILES.map((i) => (
        <span key={i} />
      ))}
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
  
  // Zoom state variables for localized board zoom transition
  const [boardZoomed, setBoardZoomed] = useState(false);
  const [zoomVars, setZoomVars] = useState({ "--zoom-x": "50%", "--zoom-y": "50%" });

  const boardRef = useRef(null);
  const draggingRef = useRef(null);
  const triggerRef = useRef(null);
  const openTimestampRef = useRef(0);

  const activeMember = useMemo(() => members.find((m) => m.id === activeId), [members, activeId]);

  const visibleMembers = useMemo(
    () => members.filter((m) => deptFilter === "ALL UNITS" || m.dept === deptFilter),
    [members, deptFilter]
  );

  const activeIndex = useMemo(
    () => visibleMembers.findIndex((m) => m.id === activeId),
    [visibleMembers, activeId]
  );

  const openFile = useCallback((member, targetElement) => {
    if (targetElement) triggerRef.current = targetElement;
    openTimestampRef.current = Date.now();
    setClosing(false);
    setEntryMode("open");

    // Calculate center origin of the selected card and zoom board locally
    setZoomVars({ "--zoom-x": `${member.pos.left}%`, "--zoom-y": `${member.pos.top}%` });
    setBoardZoomed(true);
    setActiveId(member.id);
  }, []);

  const closeFile = useCallback(() => {
    setClosing(true);
    setBoardZoomed(false); // Reverses board zoom smoothly
    window.setTimeout(() => {
      setActiveId(null);
      setClosing(false);
      if (triggerRef.current) triggerRef.current.focus();
    }, 500); // Matches board transition timing
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
    if (dx > 6 || dy > 6) current.hasDragged = true;

    if (current.hasDragged) {
      const draggedId = current.member.id;
      const rect = boardRef.current.getBoundingClientRect();
      const left = Math.max(6, Math.min(94, ((e.clientX - rect.left) / rect.width) * 100));
      const top = Math.max(8, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
      setMembers((prev) => prev.map((m) => (m.id === draggedId ? { ...m, pos: { top, left } } : m)));
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const current = draggingRef.current;
    if (!current) return;
    if (!current.hasDragged) openFile(current.member, current.targetElement);
    draggingRef.current = null;
  }, [openFile]);

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
      
      setZoomVars({ "--zoom-x": `${nextMember.pos.left}%`, "--zoom-y": `${nextMember.pos.top}%` });
      setActiveId(nextMember.id);
    },
    [activeIndex, visibleMembers]
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

      <div className="board-frame ascii-box">
        <AsciiCorners />
        <div 
          className={`board ${boardZoomed ? "is-zoomed" : ""}`} 
          ref={boardRef}
          style={zoomVars}
        >
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
              const matchesFilter = deptFilter === "ALL UNITS" || m.dept === deptFilter;
              return (
                <li
                  key={m.id}
                  className={`pin-wrapper ${!matchesFilter ? "is-filtered-out" : ""}`}
                  style={{ top: `${m.pos.top}%`, left: `${m.pos.left}%` }}
                  onPointerDown={(e) => handlePointerDown(m, e)}
                  onMouseEnter={() => setHoveredId(m.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="pin-card ascii-box" role="button" tabIndex={0} aria-label={`Open personnel file for ${m.role}`}>
                    <AsciiCorners />
                    <div className="pin-photo-frame">
                      <span className="pin-id">N-{m.file}</span>
                      <Portrait member={m} />
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
                <button className="dossier-close" onClick={closeFile} autoFocus>
                  [ ESC ] CLOSE
                </button>
              </div>

              <div className="dossier-body">
                <div className="dossier-portrait-frame ascii-box">
                  <AsciiCorners />
                  <Portrait member={activeMember} />
                  <div className="portrait-caption">{activeMember.photo ? "ON FILE" : "NO IMAGE ON FILE"}</div>
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
                      <span className="field-label">INTEL</span>
                      <span className="field-value">{activeMember.funFact}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dossier-nav">
                <button
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
    </div>
  );
}