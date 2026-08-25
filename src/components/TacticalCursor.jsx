import React, { useEffect, useRef, useState } from "react";
import "./TacticalCursor.css";

// Adjust this value to control drag intensity:
// 0.05 = Heavy, floating inertia
// 0.12 = Balanced tactical drag
// 0.25 = Light / snappy trailing
const DRAG_FACTOR = 0.1;

export default function TacticalCursor() {
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorRef = useRef(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      const target = e.target;
      setIsHovering(
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("ph")
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId;

    const render = () => {
      // Linear Interpolation (LERP) formula
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * DRAG_FACTOR;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * DRAG_FACTOR;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`hud-crosshair ${isHovering ? "is-locked" : ""}`}
      aria-hidden="true"
    >
      <div className="xhair-x" />
      <div className="xhair-y" />
      <div className="xhair-box" />
    </div>
  );
}