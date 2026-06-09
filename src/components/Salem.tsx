import React, { useEffect, useCallback, useRef } from "react";
import { SalemBody } from "./SalemBody.tsx";
import { useDrag } from "../hooks/useDrag.ts";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const Salem: React.FC = () => {
  const { isDragging, stretchY, dragHandlers } = useDrag();
  const isHoveringRef = useRef(false);

  // Click-through: on mouseenter Salem, disable ignore so Salem is interactive;
  // on mouseleave, re-enable ignore so the rest of the window is click-through.
  const handleMouseEnter = useCallback(async () => {
    isHoveringRef.current = true;
    try {
      await getCurrentWindow().setIgnoreCursorEvents(false);
    } catch {
      // Tauri API not available in browser dev
    }
  }, []);

  const handleMouseLeave = useCallback(async () => {
    isHoveringRef.current = false;
    // Do not ignore cursor events while dragging, otherwise the drag freezes
    if (isDragging) return;

    try {
      await getCurrentWindow().setIgnoreCursorEvents(true);
    } catch {
      // Tauri API not available in browser dev
    }
  }, [isDragging]);

  // Restore ignore cursor events if the mouse left the pet during drag, and drag has now ended
  useEffect(() => {
    if (!isDragging && !isHoveringRef.current) {
      getCurrentWindow().setIgnoreCursorEvents(true).catch(() => {});
    }
  }, [isDragging]);

  // Set initial cursor ignore on mount (transparent areas are click-through)
  useEffect(() => {
    const init = async () => {
      try {
        await getCurrentWindow().setIgnoreCursorEvents(true);
      } catch {
        // Tauri API not available in browser dev
      }
    };
    init();
  }, []);

  return (
    <div
      id="salem-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={dragHandlers.onMouseDown}
      onMouseMove={dragHandlers.onMouseMove}
      onMouseUp={dragHandlers.onMouseUp}
      style={{ cursor: "grab", userSelect: "none" }}
    >
      <SalemBody state="IDLE" stretchY={stretchY} />
    </div>
  );
};
