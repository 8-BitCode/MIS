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
        </ul>
      </div>
    </header>
  );
}