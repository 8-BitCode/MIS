import React from "react";
import Nav from "./Nav";

export default () => (
  <div style={{ 
    background: "#07090a", 
    minHeight: "100vh",
    fontFamily: "'IBM Plex Mono', monospace"
  }}>
    <Nav />
    <div style={{ padding: "2rem" }}>
      <h1 style={{ color: "#cdd8d2" }}>Contact Us</h1>
    </div>
  </div>
);