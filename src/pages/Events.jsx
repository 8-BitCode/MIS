import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Events.css";
import Nav from "./Nav";

// ══════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR CONFIG
// ──────────────────────────────────────────────────────────────────
const CALENDAR_CONFIG = {
  apiKey: "AIzaSyB89Xs2unB2zgJgfrp0b9hcbJyBDn_rGwE",
  calendarId: "c_23fe893822771c20d4b8cc3a395d9a5aaf39d7e1767e2dd596d0989355ebca48@group.calendar.google.com",
  maxResults: 250,
  refreshMinutes: 15,
  monthsBack: 24,
  monthsForward: 12,
  archiveLimit: 5, // show the last N past events in the After-Action Archive
};

const CALENDAR_NOT_CONFIGURED =
  !CALENDAR_CONFIG.apiKey ||
  !CALENDAR_CONFIG.calendarId ||
  CALENDAR_CONFIG.apiKey.startsWith("YOUR_") ||
  CALENDAR_CONFIG.calendarId.startsWith("YOUR_");

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const AsciiCorners = React.memo(() => (
  <>
    <span className="ascii-corner tl" aria-hidden="true">+</span>
    <span className="ascii-corner tr" aria-hidden="true">+</span>
    <span className="ascii-corner bl" aria-hidden="true">+</span>
    <span className="ascii-corner br" aria-hidden="true">+</span>
  </>
));

const Placeholder = React.memo(({ children }) => (
  <span className="ph">
    <span className="ph-flag">NEEDS INPUT</span>
    {children}
  </span>
));

const Slide = React.memo(({ event }) => {
  const [attempt, setAttempt] = useState(0); // 0 = primary URL, 1 = fallback URL, 2 = gave up
  const img = event.image;
  const src = img ? (attempt === 0 ? img.primary : img.fallback) : null;

  if (src && attempt < 2) {
    return (
      <img
        src={src}
        alt={event.title}
        className="slide-img"
        referrerPolicy="no-referrer"
        onError={() => {
          if (attempt === 0 && img.fallback) setAttempt(1);
          else setAttempt(2);
        }}
      />
    );
  }
  
  return (
    <div className="slide-redacted" role="img" aria-label="No photo on file">
      <div className="redacted-bars" aria-hidden="true">
        <span className="redacted-bar w-60" />
        <span className="redacted-bar w-100" />
        <span className="redacted-stamp">■ IMAGE REDACTED ■</span>
        <span className="redacted-bar w-80" />
        <span className="redacted-bar w-40" />
      </div>
    </div>
  );
});

function getStart(event) {
  const dateTimeRaw = event?.start?.dateTime;
  if (dateTimeRaw) return new Date(dateTimeRaw);
  const dateRaw = event?.start?.date;
  if (dateRaw) {
    const [y, m, d] = dateRaw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function getEnd(event) {
  const dateTimeRaw = event?.end?.dateTime;
  if (dateTimeRaw) return new Date(dateTimeRaw);
  const dateRaw = event?.end?.date;
  if (dateRaw) {
    const [y, m, d] = dateRaw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function isAllDay(event) {
  return Boolean(event?.start?.date && !event?.start?.dateTime);
}

function toGCalDate(d, allDay) {
  if (!d) return "";
  if (allDay) {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildAddToCalendarUrl(op) {
  if (!op.start) return null;

  let end = op.end;
  if (!end) {
    end = op.allDay
      ? new Date(op.start.getFullYear(), op.start.getMonth(), op.start.getDate() + 1)
      : new Date(op.start.getTime() + 60 * 60 * 1000);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: op.title,
    dates: `${toGCalDate(op.start, op.allDay)}/${toGCalDate(end, op.allDay)}`,
  });
  if (op.description) params.set("details", op.description);
  if (op.location) params.set("location", op.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getEventImage(event) {
  const attachments = event?.attachments || [];
  const image = attachments.find((a) => (a.mimeType || "").startsWith("image/"));
  if (!image) return null;

  let fileId = image.fileId;
  if (!fileId && image.fileUrl) {
    const match = image.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || image.fileUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];
  }

  if (fileId) {
    return {
      primary: `https://lh3.googleusercontent.com/d/${fileId}`,
      fallback: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    };
  }

  if (image.fileUrl) return { primary: image.fileUrl, fallback: null };
  return null;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function formatDayHeading(key) {
  if (!key) return "SELECT A DATE";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

function getOffset(idx, activeIdx, length) {
  let diff = idx - activeIdx;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

function useTicker(intervalMs) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function Events() {
  const [rawEvents, setRawEvents] = useState([]);
  const [status, setStatus] = useState(CALENDAR_NOT_CONFIGURED ? "unconfigured" : "loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(null);
  const [rangeFilter, setRangeFilter] = useState(null);

  const now = useTicker(30000);
  const todayKey = useMemo(() => dateKey(now), [now]);

  useEffect(() => {
    if (CALENDAR_NOT_CONFIGURED) return undefined;
    let cancelled = false;

    async function load() {
      setStatus((s) => (s === "ready" ? "refreshing" : "loading"));
      try {
        const timeMin = new Date(now.getFullYear(), now.getMonth() - CALENDAR_CONFIG.monthsBack, 1).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + CALENDAR_CONFIG.monthsForward, 1).toISOString();

        let items = [];
        let pageToken;
        let pagesFetched = 0;

        do {
          const params = new URLSearchParams({
            key: CALENDAR_CONFIG.apiKey,
            timeMin,
            timeMax,
            maxResults: String(CALENDAR_CONFIG.maxResults),
            singleEvents: "true",
            orderBy: "startTime",
          });
          if (pageToken) params.set("pageToken", pageToken);

          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
            CALENDAR_CONFIG.calendarId
          )}/events?${params.toString()}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Calendar responded ${res.status}`);
          const data = await res.json();
          items = items.concat(data.items || []);
          pageToken = data.nextPageToken;
          pagesFetched += 1;
        } while (pageToken && pagesFetched < 10);

        if (cancelled) return;
        setRawEvents(items);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err.message || "Unknown error");
        setStatus("error");
      }
    }

    load();
    const poll = setInterval(load, CALENDAR_CONFIG.refreshMinutes * 60000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  const ops = useMemo(() => {
    return rawEvents
      .map((event) => {
        const start = getStart(event);
        return {
          id: event.id,
          title: event.summary || "UNTITLED OPERATION",
          location: event.location || null,
          description: event.description || "",
          link: event.htmlLink,
          allDay: isAllDay(event),
          image: getEventImage(event),
          start,
          end: getEnd(event),
          dayKey: start ? dateKey(start) : null,
        };
      })
      .filter((e) => e.start)
      .sort((a, b) => a.start - b.start);
  }, [rawEvents]);

  const opsByDay = useMemo(() => {
    const map = {};
    ops.forEach((op) => {
      if (!map[op.dayKey]) map[op.dayKey] = [];
      map[op.dayKey].push(op);
    });
    return map;
  }, [ops]);

  const upcomingOps = useMemo(() => ops.filter((op) => op.dayKey >= todayKey), [ops, todayKey]);

  const pastOps = useMemo(
    () =>
      ops
        .filter((op) => op.dayKey < todayKey)
        .slice()
        .reverse()
        .slice(0, CALENDAR_CONFIG.archiveLimit),
    [ops, todayKey]
  );

  const hasAutoJumpedRef = useRef(false);
  useEffect(() => {
    if (hasAutoJumpedRef.current || ops.length === 0) return;
    hasAutoJumpedRef.current = true;
    const target = upcomingOps[0] || ops[ops.length - 1];
    setViewMonth(startOfMonth(target.start));
  }, [ops, upcomingOps]);

  const monthCells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const monthLabel = viewMonth
    .toLocaleDateString(undefined, { month: "long", year: "numeric" })
    .toUpperCase();

  const goToMonth = useCallback((delta) => {
    setViewMonth((d) => addMonths(d, delta));
  }, []);

  const selectDay = useCallback((key, monthOfKey) => {
    setSelectedDay(key);
    setRangeFilter(null);
    setActiveId(null);
    if (monthOfKey) setViewMonth(startOfMonth(monthOfKey));
  }, []);

  const selectedOps = opsByDay[selectedDay] || [];
  const nextOpDayKey = upcomingOps.length > 0 ? upcomingOps[0].dayKey : null;

  const weekOps = useMemo(() => {
    const weekOut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    const weekOutKey = dateKey(weekOut);
    return upcomingOps.filter((op) => op.dayKey <= weekOutKey);
  }, [upcomingOps, now]);

  const monthOps = useMemo(() => {
    const monthOut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
    const monthOutKey = dateKey(monthOut);
    return upcomingOps.filter((op) => op.dayKey <= monthOutKey);
  }, [upcomingOps, now]);

  const filteredUpcoming =
    rangeFilter === "week" ? weekOps : rangeFilter === "month" ? monthOps : upcomingOps;

  const dossierList = useMemo(() => {
    if (selectedDay) return selectedOps;
    return filteredUpcoming;
  }, [selectedDay, selectedOps, filteredUpcoming]);

  const dossierTitle = selectedDay
    ? formatDayHeading(selectedDay)
    : rangeFilter === "week"
    ? "UPCOMING WEEK"
    : rangeFilter === "month"
    ? "UPCOMING MONTH"
    : "ALL UPCOMING";

  const dossierEmptyMsg = selectedDay
    ? "NO OPERATIONS LOGGED FOR THIS DATE."
    : rangeFilter === "week"
    ? "NO OPERATIONS SCHEDULED IN THE UPCOMING WEEK."
    : rangeFilter === "month"
    ? "NO OPERATIONS SCHEDULED IN THE UPCOMING MONTH."
    : "NO UPCOMING OPERATIONS SCHEDULED.";

  const archiveIndex =
    pastOps.length > 0 ? ((carouselIndex % pastOps.length) + pastOps.length) % pastOps.length : 0;

  const openOp = useCallback((op) => {
    setRangeFilter(null);
    setSelectedDay(op.dayKey);
    if (op.start) setViewMonth(startOfMonth(op.start));
    setActiveId((cur) => (cur === op.id ? null : op.id));
  }, []);

  const goToSlide = useCallback((idx) => {
    setCarouselIndex(idx);
  }, []);

  useEffect(() => {
    setCarouselIndex(0);
  }, [pastOps.length]);

  const dragRef = useRef(null);
  const onPointerDown = (e) => {
    dragRef.current = { startX: e.clientX };
  };
  const onPointerUp = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    if (dx > 40) goToSlide(carouselIndex - 1);
    if (dx < -40) goToSlide(carouselIndex + 1);
    dragRef.current = null;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") goToSlide(carouselIndex + 1);
      if (e.key === "ArrowLeft") goToSlide(carouselIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [carouselIndex, goToSlide]);

  return (
    <div className="events-page">
      <div className="noise" aria-hidden="true" />
      <Nav />

      <div className="events-shell">
        <header className="events-header ascii-box">
          <AsciiCorners />
          <div className="header-top">
            <span>~/events/tracker.sys</span>
            <span className="clearance-badge">CLEARANCE: PUBLIC</span>
          </div>
          <h1 className="events-h1">
            <span className="prompt">&gt;</span> MISSION TRACKER
            <span className="cursor" aria-hidden="true" />
          </h1>
          <p className="events-sub">
            LIVE FEED · <span>{upcomingOps.length}</span> OPERATION{upcomingOps.length === 1 ? "" : "S"} SCHEDULED ·{" "}
            SYNCED FROM SOCIETY CALENDAR
          </p>
        </header>

        <section className="tracker-panel ascii-box">
          <AsciiCorners />
          <div className="panel-bar">
            <span>&gt; FILE 01 — MISSION CALENDAR</span>
            <span className={`rec-indicator ${status === "refreshing" ? "is-live" : ""}`}>
              {status === "unconfigured" && "AWAITING CONFIG"}
              {status === "loading" && "● SCANNING…"}
              {status === "refreshing" && "● SIGNAL LIVE"}
              {status === "ready" && "● SIGNAL LIVE"}
              {status === "error" && "● SIGNAL LOST"}
            </span>
          </div>

          {CALENDAR_NOT_CONFIGURED && (
            <div className="tracker-notice">
              <p>
                <Placeholder>
                  [CONNECT A GOOGLE CALENDAR — SET apiKey AND calendarId AT THE TOP OF Events.jsx]
                </Placeholder>
              </p>
              <p className="tracker-notice-sub">
                Make the calendar public, grab its Calendar ID from Settings → Integrate Calendar,
                and drop a restricted API key in. Members can then add events directly to that
                calendar and this page updates itself — no redeploys.
              </p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && status === "error" && (
            <div className="tracker-notice tracker-notice--error">
              <p>SIGNAL LOST — could not reach the calendar feed.</p>
              <p className="tracker-notice-sub">{errorMsg}</p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && status === "loading" && (
            <div className="tracker-notice">
              <p className="scan-line">SCANNING FREQUENCIES…</p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && (status === "ready" || status === "refreshing") && (
            <div className="tracker-body">
              <div className="calendar-frame">
                <div className="calendar-nav">
                  <button type="button" className="cal-nav-btn" onClick={() => goToMonth(-1)} aria-label="Previous month">
                    &lt;
                  </button>
                  <span className="calendar-month-label">{monthLabel}</span>
                  <button type="button" className="cal-nav-btn" onClick={() => goToMonth(1)} aria-label="Next month">
                    &gt;
                  </button>
                </div>

                <div className="calendar-weekdays" aria-hidden="true">
                  {WEEKDAYS.map((w, i) => (
                    <span key={i}>{w}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {monthCells.map((cell) => {
                    const key = dateKey(cell);
                    const inMonth = cell.getMonth() === viewMonth.getMonth();
                    const dayOps = opsByDay[key] || [];
                    const isPastDay = key < todayKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={[
                          "calendar-cell",
                          inMonth ? "" : "is-outside",
                          key === todayKey ? "is-today" : "",
                          key === selectedDay ? "is-selected" : "",
                          dayOps.length ? "has-ops" : "",
                          dayOps.length && isPastDay ? "has-ops-past" : "",
                          dayOps.length && !isPastDay ? "has-ops-upcoming" : "",
                          key === nextOpDayKey ? "is-next" : "",
                        ].join(" ").trim()}
                        onClick={() => selectDay(key, cell)}
                        aria-pressed={key === selectedDay}
                        aria-label={`${cell.toDateString()}${dayOps.length ? `, ${dayOps.length} operation${dayOps.length === 1 ? "" : "s"}${isPastDay ? " (past)" : " (upcoming)"}` : ""}`}
                      >
                        <span className="cell-date">{cell.getDate()}</span>
                        {dayOps.length > 0 && (
                          <span className="cell-dots" aria-hidden="true">
                            {dayOps.slice(0, 3).map((op) => (
                              <span key={op.id} className="cell-dot" />
                            ))}
                            {dayOps.length > 3 && <span className="cell-more">+{dayOps.length - 3}</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="calendar-legend" aria-hidden="true">
                  <span className="legend-item">
                    <span className="legend-dot legend-dot--upcoming" /> UPCOMING
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot legend-dot--past" /> LOGGED
                  </span>
                </div>
              </div>

              <div className="day-dossier">
                <div className="dossier-filters" role="tablist" aria-label="Filter upcoming operations">
                  {[
                    { key: "week", label: "UPCOMING WEEK" },
                    { key: "month", label: "UPCOMING MONTH" },
                    { key: "all", label: "ALL TIME" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      role="tab"
                      className={`dossier-filter-btn ${!selectedDay && rangeFilter === f.key ? "is-active" : ""}`}
                      aria-selected={!selectedDay && rangeFilter === f.key}
                      onClick={() => {
                        setSelectedDay(null);
                        setRangeFilter((cur) => (cur === f.key ? null : f.key));
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="dossier-heading">
                  <span className="dossier-date">{dossierTitle}</span>
                  {dossierList.length > 0 && (
                    <span className="dossier-count">
                      {dossierList.length} OP{dossierList.length === 1 ? "" : "S"}
                    </span>
                  )}
                </div>

                {dossierList.length === 0 ? (
                  <p className="dossier-empty">{dossierEmptyMsg}</p>
                ) : (
                  <ul className="op-list">
                    {dossierList.map((op) => {
                      const open = activeId === op.id;
                      return (
                        <li key={op.id} className={`op-row ${open ? "is-open" : ""}`}>
                          <button type="button" className="op-row-head" onClick={() => openOp(op)} aria-expanded={open}>
                            <span className="op-title">
                              {op.title}
                              {op.start && (
                                <span className="op-title-date">
                                  {op.start
                                    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                    .toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="op-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
                          </button>
                          {open && (
                            <div className="op-detail">
                              <div className="field-row">
                                <span className="field-label">LOCATION</span>
                                {op.location ? (
                                  <a
                                    className="field-value field-value--link"
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      op.location
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {op.location}
                                  </a>
                                ) : (
                                  <span className="field-value field-value--muted">N/A</span>
                                )}
                              </div>
                              {op.description && (
                                <div className="field-row field-row--note">
                                  <span className="field-label">BRIEF</span>
                                  <span className="field-value">{op.description}</span>
                                </div>
                              )}
                              {buildAddToCalendarUrl(op) && (
                                <a
                                  className="op-link"
                                  href={buildAddToCalendarUrl(op)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  &gt; ADD TO CALENDAR
                                </a>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="dossier-subscribe">
                  <a
                    className="subscribe-btn"
                    href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
                      CALENDAR_CONFIG.calendarId
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    + SUBSCRIBE TO CALENDAR
                  </a>
                  <a
                    className="subscribe-alt"
                    href={`webcal://calendar.google.com/calendar/ical/${encodeURIComponent(
                      CALENDAR_CONFIG.calendarId
                    )}/public/basic.ics`}
                  >
                    Apple / Outlook / other (.ics)
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="archive-panel ascii-box">
          <AsciiCorners />
          <div className="panel-bar">
            <span>&gt; FILE 02 — AFTER-ACTION ARCHIVE</span>
            <span className="rec-indicator">
              {pastOps.length > 0
                ? `${String(archiveIndex + 1).padStart(2, "0")} / ${String(pastOps.length).padStart(2, "0")}`
                : "NO RECORDS"}
            </span>
          </div>

          {CALENDAR_NOT_CONFIGURED && (
            <div className="tracker-notice">
              <p>
                <Placeholder>[CONNECT A GOOGLE CALENDAR TO POPULATE THE ARCHIVE]</Placeholder>
              </p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && status === "error" && (
            <div className="tracker-notice tracker-notice--error">
              <p>SIGNAL LOST — could not reach the calendar feed.</p>
              <p className="tracker-notice-sub">{errorMsg}</p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && status === "loading" && (
            <div className="tracker-notice">
              <p className="scan-line">SCANNING FREQUENCIES…</p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && (status === "ready" || status === "refreshing") && pastOps.length === 0 && (
            <div className="tracker-notice">
              <p>NO OPERATIONS ARCHIVED YET.</p>
              <p className="tracker-notice-sub">
                Once a calendar event's date passes, it'll show up here automatically — with its
                photo, if one was attached to the event in Google Calendar.
              </p>
            </div>
          )}

          {!CALENDAR_NOT_CONFIGURED && (status === "ready" || status === "refreshing") && pastOps.length > 0 && (
            <>
              <div className="coverflow-viewport">
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow--prev"
                  onClick={() => goToSlide(carouselIndex - 1)}
                  aria-label="Previous event"
                >
                  &lt;
                </button>

                <div
                  className="coverflow-track"
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                >
                  {pastOps.map((op, idx) => {
                    const offset = getOffset(idx, archiveIndex, pastOps.length);
                    const abs = Math.abs(offset);
                    if (abs > 2) return null;

                    const isActive = offset === 0;
                    const translateX = offset * 62;
                    const translateZ = -abs * 170;
                    const rotateY = offset * -30;
                    const scale = 1 - abs * 0.16;
                    const opacity = abs > 2 ? 0 : 1 - abs * 0.32;
                    const dateLabel = op.start
                      ? op.start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }).toUpperCase()
                      : "DATE UNKNOWN";

                    return (
                      <button
                        key={op.id}
                        type="button"
                        className={`coverflow-slide ascii-box ${isActive ? "is-active" : ""}`}
                        style={{
                          transform: `translate(-50%, -50%) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                          opacity,
                          zIndex: 10 - abs,
                          pointerEvents: isActive ? "none" : "auto",
                        }}
                        onClick={() => goToSlide(idx)}
                        aria-current={isActive ? "true" : undefined}
                        aria-label={isActive ? op.title : `Show ${op.title}`}
                        tabIndex={isActive ? -1 : 0}
                      >
                        <AsciiCorners />
                        <div className="slide-photo">
                          <Slide event={op} />
                          <span className="slide-code">CASE {String(idx + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="slide-info">
                          <h3 className="slide-title">{op.title}</h3>
                          <p className="slide-meta">{dateLabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="carousel-arrow carousel-arrow--next"
                  onClick={() => goToSlide(carouselIndex + 1)}
                  aria-label="Next event"
                >
                  &gt;
                </button>
              </div>

              <div className="carousel-dots" role="tablist" aria-label="Select event">
                {pastOps.map((op, idx) => (
                  <button
                    key={op.id}
                    type="button"
                    className={`carousel-dot ${idx === archiveIndex ? "is-active" : ""}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Show ${op.title}`}
                    aria-selected={idx === archiveIndex}
                    role="tab"
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}