import { useState, useCallback, useEffect, useRef } from "react";

export type SalemState =
  | "IDLE"
  | "TYPING"
  | "THINKING"
  | "SLEEPING"
  | "CELEBRATING"
  | "DISAPPOINTED"
  | "STARTLED"
  | "BEING_PETTED"
  | "BEING_DRAGGED";

/** Milliseconds of no input before entering THINKING */
const THINKING_DELAY = 5_000;
/** Milliseconds of no input before entering SLEEPING */
const SLEEPING_DELAY = 120_000;

/** Auto-exit durations (ms) */
const DISAPPOINTED_DURATION = 3_000;
const STARTLED_DURATION = 1_500;

/**
 * useSalemState — Central state machine for Salem.
 *
 * Manages the single active SalemState and all internal timers.
 * Components must only call `transitionTo` — never set state directly.
 *
 * Timer rules (from SPEC.md):
 * - Any keypress resets both idle timers (5s → THINKING, 2min → SLEEPING)
 * - Timers are implemented with useRef + useEffect, NOT setTimeout
 * - CELEBRATING auto-exits to IDLE via onAnimationComplete (handled by animation layer)
 * - DISAPPOINTED auto-exits to IDLE after 3s
 * - STARTLED auto-exits to IDLE after 1.5s
 */
export const useSalemState = (): {
  state: SalemState;
  transitionTo: (s: SalemState) => void;
} => {
  const [state, setState] = useState<SalemState>("IDLE");

  // --- Refs for idle timers (useRef, not setTimeout) ---
  const lastKeypressTime = useRef<number>(0);
  const thinkingFrameId = useRef<number>(0);
  const sleepingFrameId = useRef<number>(0);

  // --- Refs for auto-exit timers ---
  const autoExitFrameId = useRef<number>(0);
  const autoExitStart = useRef<number>(0);
  const autoExitDuration = useRef<number>(0);

  // --- Cancel any running auto-exit timer ---
  const cancelAutoExit = useCallback(() => {
    if (autoExitFrameId.current) {
      cancelAnimationFrame(autoExitFrameId.current);
      autoExitFrameId.current = 0;
    }
  }, []);

  // --- Cancel idle timers ---
  const cancelIdleTimers = useCallback(() => {
    if (thinkingFrameId.current) {
      cancelAnimationFrame(thinkingFrameId.current);
      thinkingFrameId.current = 0;
    }
    if (sleepingFrameId.current) {
      cancelAnimationFrame(sleepingFrameId.current);
      sleepingFrameId.current = 0;
    }
  }, []);

  // --- rAF-based polling timer for idle transitions ---
  const startIdleTimers = useCallback(() => {
    cancelIdleTimers();

    // THINKING timer: check if 5s elapsed since last keypress
    const tickThinking = () => {
      const elapsed = performance.now() - lastKeypressTime.current;
      if (elapsed >= THINKING_DELAY) {
        setState((prev) => {
          // Only transition if we're in TYPING or IDLE
          if (prev === "TYPING" || prev === "IDLE") return "THINKING";
          return prev;
        });
        // Don't schedule next frame — we'll let the sleeping timer continue
      } else {
        thinkingFrameId.current = requestAnimationFrame(tickThinking);
      }
    };

    // SLEEPING timer: check if 2min elapsed since last keypress
    const tickSleeping = () => {
      const elapsed = performance.now() - lastKeypressTime.current;
      if (elapsed >= SLEEPING_DELAY) {
        setState((prev) => {
          // Only transition if in a passive state
          if (
            prev === "TYPING" ||
            prev === "IDLE" ||
            prev === "THINKING"
          ) {
            return "SLEEPING";
          }
          return prev;
        });
        // Stop polling once sleeping
      } else {
        sleepingFrameId.current = requestAnimationFrame(tickSleeping);
      }
    };

    thinkingFrameId.current = requestAnimationFrame(tickThinking);
    sleepingFrameId.current = requestAnimationFrame(tickSleeping);
  }, [cancelIdleTimers]);

  // --- rAF-based auto-exit timer ---
  const startAutoExit = useCallback(
    (duration: number) => {
      cancelAutoExit();
      autoExitStart.current = performance.now();
      autoExitDuration.current = duration;

      const tick = () => {
        const elapsed = performance.now() - autoExitStart.current;
        if (elapsed >= autoExitDuration.current) {
          setState("IDLE");
          autoExitFrameId.current = 0;
          // Restart idle timers since we're returning to IDLE
          lastKeypressTime.current = performance.now();
          startIdleTimers();
        } else {
          autoExitFrameId.current = requestAnimationFrame(tick);
        }
      };

      autoExitFrameId.current = requestAnimationFrame(tick);
    },
    [cancelAutoExit, startIdleTimers]
  );

  // --- The main transition function exposed to consumers ---
  const transitionTo = useCallback(
    (nextState: SalemState) => {
      setState((prev) => {
        // If we're already in the requested state, no-op (except TYPING resets timers)
        if (prev === nextState && nextState !== "TYPING") return prev;

        // Cancel any pending auto-exit from a previous transient state
        cancelAutoExit();

        switch (nextState) {
          case "TYPING": {
            // Reset idle timers on every keypress
            lastKeypressTime.current = performance.now();
            cancelIdleTimers();
            startIdleTimers();
            return "TYPING";
          }

          case "THINKING":
          case "SLEEPING":
          case "IDLE": {
            return nextState;
          }

          case "CELEBRATING": {
            // Auto-exit is handled by onAnimationComplete in the animation layer,
            // but we still cancel idle timers during celebration
            cancelIdleTimers();
            return "CELEBRATING";
          }

          case "DISAPPOINTED": {
            cancelIdleTimers();
            startAutoExit(DISAPPOINTED_DURATION);
            return "DISAPPOINTED";
          }

          case "STARTLED": {
            cancelIdleTimers();
            startAutoExit(STARTLED_DURATION);
            return "STARTLED";
          }

          case "BEING_PETTED": {
            cancelIdleTimers();
            return "BEING_PETTED";
          }

          case "BEING_DRAGGED": {
            cancelIdleTimers();
            return "BEING_DRAGGED";
          }

          default:
            return prev;
        }
      });
    },
    [cancelAutoExit, cancelIdleTimers, startIdleTimers, startAutoExit]
  );

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      cancelIdleTimers();
      cancelAutoExit();
    };
  }, [cancelIdleTimers, cancelAutoExit]);

  return { state, transitionTo };
};
