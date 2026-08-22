import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Committee from "./pages/Committee";
import Events from "./pages/Events";
import Partnerships from "./pages/Partnerships";
import Contact from "./pages/Contact";

export default () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/committee" element={<Committee />} />
      <Route path="/events" element={<Events />} />
      <Route path="/partnerships" element={<Partnerships />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  </BrowserRouter>
);