import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Nav, { SITE_LINKS, BLOG_LINK, PODCAST_LINK } from "./Nav";
import DecryptText from "./DecryptText";
import { useEvidenceSFX } from "./useEvidenceSFX";
import "./NotFound.css";

/* ══════════════════════════════════════════════════════════════════
   NOTFOUND — "no record on file"
   Catch-all page for any address the router doesn't know. It reads the
   address the visitor asked for, and offers the closest real pages
   (typo-tolerant), so a dead end always leads somewhere.
   Uses the same case-file / stamp / redaction language as the rest of
   the site, with red as its accent (like every page has its own).
   ══════════════════════════════════════════════════════════════════ */

// Every place a visitor could sensibly have meant, with the words that
// should lead to it. The blog is external, so it's flagged as such.
const CANDIDATES = [
  ...SITE_LINKS.map((l) => ({
    key: l.to,
    to: l.to,
    label: l.label,
    code: l.code,
    words: [l.label.toLowerCase(), l.to.replace(/^\//, "")].filter(Boolean),
  })),
  {
    key: "blog",
    href: BLOG_LINK.href,
    label: BLOG_LINK.label,
    code: "↗",
    words: ["dispatches", "blog", "news", "posts", "articles", "field notes"],
  },
  {
    key: "podcast",
    href: PODCAST_LINK.href,
    label: PODCAST_LINK.label,
    code: "↗",
    words: ["podcast", "episodes", "episode", "audio", "listen", "recordings"],
  },
];

const bigrams = (s) => {
  const out = new Map();
  const t = s.replace(/[^a-z0-9]+/g, " ").trim();
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
};

// Dice coefficient on character pairs: forgiving of typos and missing letters.
function dice(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  let total = 0;
  A.forEach((n) => (total += n));
  B.forEach((n) => (total += n));
  A.forEach((n, g) => {
    if (B.has(g)) inter += Math.min(n, B.get(g));
  });
  return total ? (2 * inter) / total : 0;
}

function score(want, words) {
  return Math.max(
    ...words.map((w) => {
      if (want.length >= 3 && (w.includes(want) || want.includes(w))) return 0.7;
      return dice(want, w);
    })
  );
}

const Corners = () => (
  <>
    <span className="nf-corner tl" aria-hidden="true">+</span>
    <span className="nf-corner tr" aria-hidden="true">+</span>
    <span className="nf-corner bl" aria-hidden="true">+</span>
    <span className="nf-corner br" aria-hidden="true">+</span>
  </>
);

const Redacted = ({ w }) => (
  <span className="nf-bar" style={{ "--w": w }} role="img" aria-label="redacted" />
);

export default function NotFound() {
  const { pathname } = useLocation();
  const { playDossierOpen } = useEvidenceSFX();

  // The SPA answers every address with the app shell, so tell search
  // engines not to index this, and give the tab a truthful title.
  useEffect(() => {
    const prev = document.title;
    document.title = "404 // Manchester Intelligence Society";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.title = prev;
      meta.remove();
    };
  }, []);

  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    /* keep raw */
  }
  const shown = path.length > 40 ? `${path.slice(0, 39)}…` : path;
  const want = path.replace(/^\/+|\/+$/g, "").toLowerCase();
  const short = want.slice(0, 22) || "unknown";

  const matches = useMemo(() => {
    if (!want) return [];
    return CANDIDATES.map((c) => ({ c, s: score(want, c.words) }))
      .filter((r) => r.s >= 0.3)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((r) => r.c);
  }, [want]);

  const suggestions = matches.length ? matches : CANDIDATES;
  const suggestTitle = matches.length ? "DID YOU MEAN" : "AVAILABLE RECORDS";

  return (
    <>
      <Nav />
      <main className="nf-page">
        <div className="nf-noise" aria-hidden="true" />

        <section className="nf-wrap">
          <div className="nf-titlebar">
            <span className="nf-titlepath">~/records/{short}</span>
            <span className="nf-rule" aria-hidden="true" />
            <span className="nf-flag">ERROR 404</span>
          </div>

          <div className="nf-grid">
            {/* ── the case file ───────────────────────────────── */}
            <aside className="nf-card" aria-label="Case file">
              <Corners />
              <div className="nf-card-head">
                <span>CASE FILE</span>
                <span>MIS//RECORDS</span>
              </div>

              <dl className="nf-rows">
                <div>
                  <dt>REQUESTED</dt>
                  <dd className="nf-req">{shown}</dd>
                </div>
                <div>
                  <dt>SUBJECT</dt>
                  <dd><Redacted w="9ch" /></dd>
                </div>
                <div>
                  <dt>FILED BY</dt>
                  <dd><Redacted w="12ch" /></dd>
                </div>
                <div>
                  <dt>LAST SEEN</dt>
                  <dd>NEVER</dd>
                </div>
              </dl>

              <div className="nf-stamp-zone">
                <span className="nf-stamp" aria-hidden="true">NO RECORD</span>
              </div>
            </aside>

            {/* ── the explanation ─────────────────────────────── */}
            <div className="nf-copy">
              <p className="nf-code" aria-hidden="true">
                <DecryptText text="404" trigger="mount" delay={100} />
              </p>
              <h1 className="nf-title">Record not found</h1>
              <p className="nf-text">
                Nothing is filed at this address. It may have been moved or
                removed, or the link has a typo.
              </p>

              <div className="nf-term">
                <p className="nf-line" style={{ "--i": 0 }}>
                  <span className="nf-key">REQUEST</span>
                  <span className="nf-val">{shown}</span>
                </p>
                <p className="nf-line" style={{ "--i": 1 }}>
                  <span className="nf-key">SEARCHED</span>
                  <span className="nf-val">{SITE_LINKS.length} sections</span>
                </p>
                <p className="nf-line" style={{ "--i": 2 }}>
                  <span className="nf-key">RESULT</span>
                  <span className="nf-val nf-val--bad">NO RECORD</span>
                </p>
              </div>

              <div className="nf-suggest">
                <p className="nf-suggest-title">{suggestTitle}</p>
                <ul className="nf-suggest-list">
                  {suggestions.map((c) => (
                    <li key={c.key}>
                      {c.to ? (
                        <Link to={c.to} onClick={() => playDossierOpen()}>
                          <b>{c.code}</b>
                          <span>{c.label}</span>
                        </Link>
                      ) : (
                        <a href={c.href} onClick={() => playDossierOpen()}>
                          <b>{c.code}</b>
                          <span>{c.label}</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="nf-actions">
                <Link
                  className="nf-btn nf-btn--solid"
                  to="/"
                  onClick={() => playDossierOpen()}
                >
                  RETURN HOME
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}