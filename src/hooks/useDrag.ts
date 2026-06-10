import { useRef, useState, useCallback, useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import type { SalemState } from "./useSalemState";

const DRAG_THRESHOLD_MS = 150;
const MAX_SCALE_Y = 2.5;
const MIN_SCALE_X = 0.75;

// --- Petting / Poke thresholds ---
const VELOCITY_BUFFER_SIZE = 10;
/** Average velocity must stay below this to count as petting (px/frame) */
const PETTING_VELOCITY_MAX = 5;
/** Petting must be sustained for this many ms before triggering state */
const PETTING_SUSTAIN_MS = 500;
/** If velocity rises above this while petting, exit to IDLE (px/frame) */
const PETTING_EXIT_VELOCITY = 8;
/** Velocity above this on mousedown = poke (px/frame) */
const POKE_VELOCITY_MIN = 20;

/** A single mousemove sample used for velocity computation */
interface MoveSample {
  x: number;
  y: number;
  t: number; // performance.now() timestamp
}

/**
 * useDrag — handles drag-to-reposition Salem on screen with vertical stretch,
 * petting detection, and poke detection.
 *
 * @param transitionTo — callback from useSalemState to trigger state changes
 *
 * Returns:
 * - salemRef: attach to the Salem SVG wrapper element
 * - dragStretch: { scaleX, scaleY } Framer Motion motion values for body stretch
 * - isPetting: true while Salem is being petted
 * - isPoked: true for the duration of the startled animation
 */
export const useDrag = (transitionTo: (s: SalemState) => void) => {
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

  // --- Petting state ---
  const [isPetting, setIsPetting] = useState(false);
  const isPettingRef = useRef(false); // mirror for use in event handlers

  // --- Poke state ---
  const [isPoked, setIsPoked] = useState(false);

  // --- Velocity tracking ---
  /** Rolling buffer of the last N mousemove samples */
  const moveSamples = useRef<MoveSample[]>([]);
  /** The most recent single-frame velocity (px/frame) */
  const lastVelocity = useRef(0);
  /** Whether the mouse is currently hovering over Salem (no button held) */
  const isHovering = useRef(false);
  /** Timestamp when petting velocity first dropped below threshold */
  const pettingSustainStart = useRef(0);
  /** rAF id for the petting check loop */
  const pettingCheckId = useRef(0);

  // ─── Velocity helpers ───────────────────────────────────────────────

  /**
   * Record a mousemove sample and compute instantaneous velocity.
   * Velocity = distance between consecutive points / time between them,
   * normalised to px per ~16.67ms frame (≈ 60 fps).
   */
  const recordSample = useCallback((x: number, y: number) => {
    const now = performance.now();
    const samples = moveSamples.current;
    const prev = samples.length > 0 ? samples[samples.length - 1] : null;

    if (prev) {
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = now - prev.t; // ms
      // Normalise to "px per frame" where 1 frame ≈ 16.67ms
      lastVelocity.current = dt > 0 ? (dist / dt) * 16.67 : 0;
    }

    samples.push({ x, y, t: now });
    // Keep only the last VELOCITY_BUFFER_SIZE samples
    if (samples.length > VELOCITY_BUFFER_SIZE) {
      samples.shift();
    }
  }, []);

  /**
   * Compute the average velocity across the current sample buffer.
   * Returns px/frame (normalised to 60 fps).
   */
  const averageVelocity = useCallback((): number => {
    const samples = moveSamples.current;
    if (samples.length < 2) return 0;

    let totalVelocity = 0;
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = curr.t - prev.t;
      totalVelocity += dt > 0 ? (dist / dt) * 16.67 : 0;
    }

    return totalVelocity / (samples.length - 1);
  }, []);

  // ─── Petting logic ─────────────────────────────────────────────────

  const stopPetting = useCallback(() => {
    if (isPettingRef.current) {
      isPettingRef.current = false;
      setIsPetting(false);
      transitionTo("IDLE");
    }
    pettingSustainStart.current = 0;
    if (pettingCheckId.current) {
      cancelAnimationFrame(pettingCheckId.current);
      pettingCheckId.current = 0;
    }
  }, [transitionTo]);

  const startPettingCheck = useCallback(() => {
    // Continuous rAF loop that checks average velocity while hovering
    const tick = () => {
      if (!isHovering.current || mouseDownTime.current !== 0) {
        // Mouse left or button is held — stop checking
        stopPetting();
        return;
      }

      const avgVel = averageVelocity();

      if (isPettingRef.current) {
        // Already petting — check exit condition
        if (avgVel > PETTING_EXIT_VELOCITY) {
          stopPetting();
          return;
        }
      } else {
        // Not yet petting — check if velocity is low enough
        if (avgVel < PETTING_VELOCITY_MAX && avgVel > 0) {
          if (pettingSustainStart.current === 0) {
            pettingSustainStart.current = performance.now();
          }
          const sustained = performance.now() - pettingSustainStart.current;
          if (sustained >= PETTING_SUSTAIN_MS) {
            isPettingRef.current = true;
            setIsPetting(true);
            transitionTo("BEING_PETTED");
          }
        } else {
          // Velocity too high or no movement — reset sustain timer
          pettingSustainStart.current = 0;
        }
      }

      pettingCheckId.current = requestAnimationFrame(tick);
    };

    // Cancel any existing loop before starting a new one
    if (pettingCheckId.current) {
      cancelAnimationFrame(pettingCheckId.current);
    }
    pettingCheckId.current = requestAnimationFrame(tick);
  }, [averageVelocity, stopPetting, transitionTo]);

  // ─── Mouse event handlers ──────────────────────────────────────────

  const handleMouseDown = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // --- Poke detection ---
      // If the cursor was moving fast when clicked, it's a poke
      if (lastVelocity.current > POKE_VELOCITY_MIN) {
        setIsPoked(true);
        transitionTo("STARTLED");
        // isPoked resets when the STARTLED state auto-exits (1.5s),
        // which is handled by the animation variant in the state machine.
        // We mirror the 1.5s duration here via rAF for the boolean flag.
        const pokeStart = performance.now();
        const resetPoke = () => {
          if (performance.now() - pokeStart >= 1500) {
            setIsPoked(false);
          } else {
            requestAnimationFrame(resetPoke);
          }
        };
        requestAnimationFrame(resetPoke);
        return; // Don't start a drag on a poke
      }

      // --- Stop petting if we're petting ---
      if (isPettingRef.current) {
        stopPetting();
      }

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
    [transitionTo, stopPetting]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Always record the sample for velocity tracking (petting / poke need it)
      recordSample(e.screenX, e.screenY);

      // If no button held, nothing more to do for drag logic
      if (mouseDownTime.current === 0) return;

      const elapsed = Date.now() - mouseDownTime.current;
      const deltaX = e.screenX - mouseDownScreenPos.current.x;
      const deltaY = e.screenY - mouseDownScreenPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Only start dragging after threshold time + some movement
      if (!isDragging.current) {
        if (elapsed >= DRAG_THRESHOLD_MS && distance > 3) {
          isDragging.current = true;
          transitionTo("BEING_DRAGGED");
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
    [rawScaleX, rawScaleY, recordSample, transitionTo]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      // Spring snap-back: set raw values back to 1.0,
      // the useSpring will animate smoothly
      rawScaleY.set(1.0);
      rawScaleX.set(1.0);
      transitionTo("IDLE");
    }

    isDragging.current = false;
    mouseDownTime.current = 0;
  }, [rawScaleX, rawScaleY, transitionTo]);

  // --- Hover enter/leave handlers for petting ---
  const handleMouseEnter = useCallback(() => {
    isHovering.current = true;
    // Reset the sample buffer so we start fresh
    moveSamples.current = [];
    pettingSustainStart.current = 0;
    startPettingCheck();
  }, [startPettingCheck]);

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false;
    stopPetting();
  }, [stopPetting]);

  // Attach event listeners
  useEffect(() => {
    const el = salemRef.current;
    if (!el) return;

    // mousedown on the Salem element only
    el.addEventListener("mousedown", handleMouseDown);

    // mouseenter / mouseleave on Salem for petting detection
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    // mousemove and mouseup on the window so we don't lose the drag
    // if the cursor leaves the element
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      // Clean up any running petting rAF
      if (pettingCheckId.current) {
        cancelAnimationFrame(pettingCheckId.current);
      }
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseEnter, handleMouseLeave]);

  return {
    salemRef,
    dragStretch: { scaleX, scaleY },
    isPetting,
    isPoked,
  };
};
