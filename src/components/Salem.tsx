import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDrag } from "../hooks/useDrag";
import { useSalemState } from "../hooks/useSalemState";
import { SalemBody } from "./SalemBody";

/**
 * Salem — main component that renders the cat, applies drag interaction,
 * and configures click-through behavior for the transparent window.
 *
 * Click-through strategy:
 * On macOS with `transparent: true` + `macOSPrivateApi: true`, fully transparent
 * pixels are natively click-through. We reinforce this by toggling
 * setIgnoreCursorEvents on mouseenter/mouseleave of the Salem element.
 * The window starts with cursor events ENABLED (so the webview can detect
 * mouseenter in the first place), and the native transparency handles
 * pass-through on empty areas.
 */
export const Salem: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, transitionTo } = useSalemState();
  const { salemRef, dragStretch, isPetting, isPoked } = useDrag(transitionTo);
  const { scaleX, scaleY } = dragStretch;

  // isPetting and isPoked are available for child components / future use
  void isPetting;
  void isPoked;

  // Handle celebration sequence complete → auto-transition back to IDLE
  const handleCelebrationComplete = useCallback(() => {
    transitionTo("IDLE");
  }, [transitionTo]);

  // Toggle cursor event handling based on whether mouse is over Salem
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const salemEl = salemRef.current;
    if (!salemEl) return;

    // When mouse enters Salem, ensure cursor events are captured
    const handleMouseEnter = () => {
      appWindow.setIgnoreCursorEvents(false).catch(() => {});
    };

    // When mouse leaves Salem, make window click-through
    const handleMouseLeave = () => {
      appWindow.setIgnoreCursorEvents(true).catch(() => {});
    };

    salemEl.addEventListener("mouseenter", handleMouseEnter);
    salemEl.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      salemEl.removeEventListener("mouseenter", handleMouseEnter);
      salemEl.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [salemRef]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <motion.div
        ref={salemRef}
        style={{
          scaleX,
          scaleY,
          transformOrigin: "center bottom",
          cursor: "grab",
          pointerEvents: "auto",
        }}
      >
        <SalemBody
          state={state}
          onCelebrationComplete={handleCelebrationComplete}
        />
      </motion.div>
    </div>
  );
};
