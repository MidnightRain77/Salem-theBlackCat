import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { load } from "@tauri-apps/plugin-store";
import { useDrag } from "../hooks/useDrag";
import { useSalemState } from "../hooks/useSalemState";
import { useTauriEvents } from "../hooks/useTauriEvents";
import { SalemBody } from "./SalemBody";

interface SalemSettings {
  soundEnabled: boolean;
  startOnLogin: boolean;
  catSize: number;
}

const STORE_KEY = "salem-settings";

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

  // Track the size multiplier applied to Salem's SVG
  const [catSize, setCatSize] = useState<number>(1.0);

  // Wire up Tauri global input/behavior event listeners
  useTauriEvents(transitionTo);

  // isPetting and isPoked are available for child components / future use
  void isPetting;
  void isPoked;

  // Handle celebration sequence complete → auto-transition back to IDLE
  const handleCelebrationComplete = useCallback(() => {
    transitionTo("IDLE");
  }, [transitionTo]);

  // Load settings and listen to settings:updated events
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;

    const initSettings = async () => {
      try {
        const store = await load("salem-settings.json", { autoSave: true, defaults: {} });
        const saved = await store.get<SalemSettings>(STORE_KEY);
        if (saved && typeof saved.catSize === "number") {
          setCatSize(saved.catSize);
        }
      } catch (err) {
        console.error("Failed to load settings in Salem:", err);
      }

      try {
        const unlisten = await listen<SalemSettings>("settings:updated", (event) => {
          if (event.payload && typeof event.payload.catSize === "number") {
            setCatSize(event.payload.catSize);
          }
        });
        unlistenFn = unlisten;
      } catch (err) {
        console.error("Failed to register settings:updated listener:", err);
      }
    };

    initSettings();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

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
      <div
        style={{
          transform: `scale(${catSize})`,
          transformOrigin: "center bottom",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
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
    </div>
  );
};
