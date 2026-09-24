import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Nav.css";
import { useEvidenceSFX } from "./useEvidenceSFX";

// ── SITE ROUTE TABLE ──────────────────────────────────────────────
// This is the single source of truth for site navigation.
// Add a page once here and it appears in the desktop bar, the mobile
// drawer, and can be reused anywhere else (e.g. a footer sitemap)
// by importing SITE_LINKS from this file.
export const SITE_LINKS = [
  { to: "/", label: "HOME", code: "00", end: true },
  { to: "/committee", label: "COMMITTEE", code: "01" },
  { to: "/events", label: "EVENTS", code: "02" },
  { to: "/partnerships", label: "PARTNERSHIPS", code: "03" },
  { to: "/contact", label: "CONTACT", code: "04" },
];

// The blog is its own site on its own domain, so it's a plain <a>, not a
// router link. It's kept out of SITE_LINKS on purpose: those are the pages
// of this site (boxed together in the bar); this one sits outside the box.
export const BLOG_LINK = {
  href: "https://blog.manchesterintelligencesociety.com",
  label: "BLOG",
};

// The podcast (Dispatches) is likewise its own site on its own subdomain, so
// it follows the same pattern as the blog: a plain <a>, outside the box, in
// its own colour (see --pod in Nav.css).
export const PODCAST_LINK = {
  href: "https://podcast.manchesterintelligencesociety.com",
  label: "PODCAST",
};

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { playDossierOpen, playPinThud } = useEvidenceSFX();

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Give the bar a "sealed" look once the page has scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleOpen = () => {
    playPinThud();
    setOpen((v) => !v);
  };

  return (
    <header className={`site-nav ${scrolled ? "is-sealed" : ""}`}>
      <div className="site-nav-bar">
        <NavLink to="/" className="site-nav-brand" onClick={() => playDossierOpen()}>
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-code">MIS</span>
          <span className="brand-sub">//SOCIETY</span>
        </NavLink>

        <nav className="site-nav-links" aria-label="Primary">
          <div className="site-nav-group">
            {SITE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `site-nav-link ${isActive ? "is-active" : ""}`
                }
                onClick={() => playDossierOpen()}
              >
                <span className="link-code">{link.code}</span>
                <span className="link-label">{link.label}</span>
              </NavLink>
            ))}
          </div>

          <a
            className="site-nav-link site-nav-link--external"
            href={BLOG_LINK.href}
            title="Reports, analysis and field notes — opens the Dispatches blog"
            onClick={() => playDossierOpen()}
          >
            <span className="link-code" aria-hidden="true">↗</span>
            <span className="link-label">{BLOG_LINK.label}</span>
          </a>

          <a
            className="site-nav-link site-nav-link--external site-nav-link--podcast"
            href={PODCAST_LINK.href}
            title="Reports, briefings and field recordings — opens the Dispatches podcast"
            onClick={() => playDossierOpen()}
          >
            <span className="link-code" aria-hidden="true">↗</span>
            <span className="link-label">{PODCAST_LINK.label}</span>
          </a>
        </nav>

        <div className="site-nav-status" aria-hidden="true">
          <span className="status-dot" />
          FEED LIVE
        </div>

        <button
          className={`site-nav-toggle ${open ? "is-open" : ""}`}
          onClick={toggleOpen}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <span>{open ? "[ CLOSE ]" : "[ MENU ]"}</span>
        </button>
      </div>

      <div className={`site-nav-drawer ${open ? "is-open" : ""}`}>
        <ul>
          {SITE_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `drawer-link ${isActive ? "is-active" : ""}`
                }
                onClick={() => playDossierOpen()}
              >
                <span className="link-code">{link.code}</span>
                <span className="link-label">{link.label}</span>
                <span className="link-arrow">&gt;</span>
              </NavLink>
            </li>
          ))}
          <li className="drawer-external">
            <a
              className="drawer-link drawer-link--external"
              href={BLOG_LINK.href}
              onClick={() => playDossierOpen()}
            >
              <span className="link-code" aria-hidden="true">↗</span>
              <span className="link-label">{BLOG_LINK.label}</span>
              <span className="link-arrow">&gt;</span>
            </a>
          </li>
          <li className="drawer-external">
            <a
              className="drawer-link drawer-link--external drawer-link--podcast"
              href={PODCAST_LINK.href}
              onClick={() => playDossierOpen()}
            >
              <span className="link-code" aria-hidden="true">↗</span>
              <span className="link-label">{PODCAST_LINK.label}</span>
              <span className="link-arrow">&gt;</span>
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}