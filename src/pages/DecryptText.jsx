import React, { useCallback, useEffect, useRef, useState } from "react";

const CHARSET = "!<>-_\\/[]{}—=+*^?#0123456789";

/**
 * DecryptText
 * Renders `text` scrambled, then resolves it left-to-right like a
 * decoding terminal readout. Zero external deps.
 *
 * Props:
 *  - text: string to reveal (required)
 *  - as: element/tag to render (default "span")
 *  - speed: ms between scramble frames (default 28)
 *  - delay: ms to wait before starting (default 0)
 *  - trigger: "mount" | "hover" | "visible" (default "mount")
 *  - className: extra class names
 */
export default function DecryptText({
  text,
  as: Tag = "span",
  speed = 28,
  delay = 0,
  trigger = "mount",
  className = "",
  ...rest
}) {
  const [display, setDisplay] = useState(trigger === "mount" ? "" : text);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const elRef = useRef(null);
  const hasRunRef = useRef(false);

  const scramble = useCallback(() => {
    clearInterval(intervalRef.current);
    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return text[index];
            return CHARSET[Math.floor(Math.random() * CHARSET.length)];
          })
          .join("")
      );
      iteration += 1 / 2.2;
      if (iteration >= text.length) {
        clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, speed);
  }, [text, speed]);

  useEffect(() => {
    if (trigger === "mount") {
      timeoutRef.current = setTimeout(scramble, delay);
    }

    if (trigger === "visible" && elRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasRunRef.current) {
            hasRunRef.current = true;
            timeoutRef.current = setTimeout(scramble, delay);
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(elRef.current);
      return () => observer.disconnect();
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, scramble, delay]);

  const hoverHandlers =
    trigger === "hover"
      ? {
          onMouseEnter: scramble,
          onFocus: scramble,
        }
      : {};

  return (
    <Tag
      ref={elRef}
      className={`decrypt-text ${className}`}
      {...hoverHandlers}
      {...rest}
    >
      {display}
    </Tag>
  );
}