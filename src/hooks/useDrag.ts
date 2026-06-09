import { useRef, useCallback, useState, useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";

/**
 * useDrag — handles dragging the Salem window around the screen.
 *
 * On mousedown, records the cursor offset within the window.
 * While dragging, repositions the Tauri window and computes vertical stretch (scaleY)
 * based on drag velocity using global window mouse listeners.
 * On mouseup, spring-animates scaleY back to 1.0.
 *
 * Exports: { isDragging, stretchY, dragHandlers }
 */
export const useDrag = () => {
  const [isDragging, setIsDragging] = useState(false);

  // Raw motion value for scaleY — we drive this imperatively
  const stretchRaw = useMotionValue(1.0);

  // Spring-smoothed version (used during release snap-back)
  const stretchY = useSpring(stretchRaw, {
    stiffness: 400,
    damping: 20,
  });

  // Refs to track drag state without re-renders
  const dragState = useRef({
    active: false,
    // Offset of cursor relative to window origin at drag start
    offsetX: 0,
    offsetY: 0,
    // Previous cursor screen position (for velocity calc)
    prevScreenX: 0,
    prevScreenY: 0,
    // Previous timestamp
    prevTime: 0,
  });

  const onMouseDown = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      try {
        const appWindow = getCurrentWindow();
        const pos = await appWindow.outerPosition();

        // The mouse event gives us client (within-window) coords.
        // The window's screen position + the client offset = where mouse is on screen.
        dragState.current = {
          active: true,
          offsetX: e.clientX,
          offsetY: e.clientY,
          prevScreenX: pos.x + e.clientX,
          prevScreenY: pos.y + e.clientY,
          prevTime: performance.now(),
        };

        setIsDragging(true);
        stretchRaw.set(1.0);
      } catch {
        // If Tauri APIs aren't available (e.g., in browser dev), silently skip
      }
    },
    [stretchRaw]
  );

  // Global mousemove and mouseup handler during drag to prevent slipping/freezing
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = async (e: MouseEvent) => {
      if (!dragState.current.active) return;

      try {
        const appWindow = getCurrentWindow();
        const pos = await appWindow.outerPosition();
        const screenX = pos.x + e.clientX;
        const screenY = pos.y + e.clientY;

        const newX = screenX - dragState.current.offsetX;
        const newY = screenY - dragState.current.offsetY;

        await appWindow.setPosition(new PhysicalPosition(newX, newY));

        // Compute velocity for stretch
        const now = performance.now();
        const dt = now - dragState.current.prevTime;

        if (dt > 0) {
          const dx = screenX - dragState.current.prevScreenX;
          const dy = screenY - dragState.current.prevScreenY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Velocity in px/frame (~16ms per frame)
          const velocityPxPerFrame = (dist / dt) * 16;

          // Interpolate scaleY: 1.0 at 0 velocity → 2.2 at ~30px/frame, clamped at 2.5
          const targetStretch = Math.min(
            2.5,
            1.0 + (velocityPxPerFrame / 30) * 1.2
          );
          stretchRaw.set(targetStretch);
        }

        dragState.current.prevScreenX = screenX;
        dragState.current.prevScreenY = screenY;
        dragState.current.prevTime = now;
      } catch {
        // Silently handle Tauri API errors
      }
    };

    const handleMouseUp = () => {
      if (!dragState.current.active) return;

      dragState.current.active = false;
      setIsDragging(false);
      stretchRaw.set(1.0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, stretchRaw]);

  // Keep no-ops for onMouseMove/onMouseUp so client code using them doesn't break
  const onMouseMove = useCallback(() => {}, []);
  const onMouseUp = useCallback(() => {}, []);

  return {
    isDragging,
    stretchY,
    dragHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
  };
};
