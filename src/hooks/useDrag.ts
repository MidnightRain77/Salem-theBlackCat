import { useRef, useCallback, useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";

const DRAG_THRESHOLD_MS = 150;
const MAX_SCALE_Y = 2.5;
const MIN_SCALE_X = 0.75;

/**
 * useDrag — handles drag-to-reposition Salem on screen with vertical stretch.
 *
 * Returns:
 * - salemRef: attach to the Salem SVG wrapper element
 * - scaleY / scaleX: Framer Motion motion values for body stretch
 */
export const useDrag = () => {
  const salemRef = useRef<HTMLDivElement>(null);

  // Track drag state
  const isDragging = useRef(false);
  const mouseDownTime = useRef(0);
  const mouseDownScreenPos = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });

  // Framer Motion values for stretch
  const rawScaleY = useMotionValue(1);
  const rawScaleX = useMotionValue(1);

  // Spring-animated values that snap back on release
  const scaleY = useSpring(rawScaleY, { stiffness: 400, damping: 20 });
  const scaleX = useSpring(rawScaleX, { stiffness: 400, damping: 20 });

  const handleMouseDown = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      mouseDownTime.current = Date.now();
      mouseDownScreenPos.current = { x: e.screenX, y: e.screenY };

      // Capture the window's current position at drag start.
      // outerPosition() returns PhysicalPosition — convert to logical
      // so it matches screenX/screenY from DOM MouseEvent (CSS pixels).
      try {
        const pos = await getCurrentWindow().outerPosition();
        const scale = window.devicePixelRatio || 1;
        windowStartPos.current = { x: pos.x / scale, y: pos.y / scale };
      } catch {
        windowStartPos.current = { x: 0, y: 0 };
      }

      isDragging.current = false;
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (mouseDownTime.current === 0) return;

      const elapsed = Date.now() - mouseDownTime.current;
      const deltaX = e.screenX - mouseDownScreenPos.current.x;
      const deltaY = e.screenY - mouseDownScreenPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Only start dragging after threshold time + some movement
      if (!isDragging.current) {
        if (elapsed >= DRAG_THRESHOLD_MS && distance > 3) {
          isDragging.current = true;
        } else {
          return;
        }
      }

      // --- Update window position ---
      // Use LogicalPosition so coordinates match the CSS-pixel screenX/screenY
      const newX = windowStartPos.current.x + deltaX;
      const newY = windowStartPos.current.y + deltaY;
      getCurrentWindow()
        .setPosition(new LogicalPosition(newX, newY))
        .catch(() => {});

      // --- Calculate stretch ---
      // Primary driver: Y-axis delta, secondary: X-axis contributes partially
      const absDeltaY = Math.abs(deltaY);
      const absDeltaX = Math.abs(deltaX);

      // Combine Y and X (X contributes at 40% weight for diagonal drags)
      const combinedDelta = absDeltaY + absDeltaX * 0.4;

      // Map combined delta (0..200px) to scaleY (1.0..2.5)
      const stretchFactor = Math.min(combinedDelta / 200, 1);
      const targetScaleY = 1.0 + stretchFactor * (MAX_SCALE_Y - 1.0);

      // Inverse compression on X: as scaleY grows, scaleX shrinks
      // Map scaleY range [1.0, 2.5] to scaleX range [1.0, 0.75]
      const compressionFactor = (targetScaleY - 1.0) / (MAX_SCALE_Y - 1.0);
      const targetScaleX = 1.0 - compressionFactor * (1.0 - MIN_SCALE_X);

      rawScaleY.set(Math.min(targetScaleY, MAX_SCALE_Y));
      rawScaleX.set(Math.max(targetScaleX, MIN_SCALE_X));
    },
    [rawScaleX, rawScaleY]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      // Spring snap-back: set raw values back to 1.0,
      // the useSpring will animate smoothly
      rawScaleY.set(1.0);
      rawScaleX.set(1.0);
    }

    isDragging.current = false;
    mouseDownTime.current = 0;
  }, [rawScaleX, rawScaleY]);

  // Attach event listeners
  useEffect(() => {
    const el = salemRef.current;
    if (!el) return;

    // mousedown on the Salem element only
    el.addEventListener("mousedown", handleMouseDown);

    // mousemove and mouseup on the window so we don't lose the drag
    // if the cursor leaves the element
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return { salemRef, scaleX, scaleY };
};
