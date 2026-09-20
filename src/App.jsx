import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Committee from "./pages/Committee";
import Events from "./pages/Events";
import Partnerships from "./pages/Partnerships";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import TacticalCursor from "./components/TacticalCursor";
import ScrollToTop from "./components/ScrollToTop"; // <-- Import ScrollToTop

export default () => (
  <BrowserRouter>
    {/* Scroll to top on route change */}
    <ScrollToTop />
    
    {/* Mount the cursor globally above all routes */}
    <TacticalCursor />
    
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/committee" element={<Committee />} />
      <Route path="/events" element={<Events />} />
      <Route path="/partnerships" element={<Partnerships />} />
      <Route path="/contact" element={<Contact />} />
      {/* Catch-all: must stay last so it only matches unknown addresses */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);