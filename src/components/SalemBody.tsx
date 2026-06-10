import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import type { SalemState } from "../hooks/useSalemState";
import {
  tailVariants,
  eyeLeftVariants,
  eyeRightVariants,
  pawLeftVariants,
  pawRightVariants,
  earLeftVariants,
  earRightVariants,
  headVariants,
  salemGroupVariants,
  stressLineVariants,
  sleepingZVariants,
  confettiVariants,
  heartVariants,
} from "../animations/states";

interface SalemBodyProps {
  state: SalemState;
  onCelebrationComplete?: () => void;
}

/** Confetti colors for the CELEBRATING state */
const CONFETTI_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

/**
 * SalemBody — Animated inline SVG of Salem the black cat.
 *
 * All named element IDs are driven by Framer Motion variants from states.ts.
 * The `state` prop controls which variant set is active across all elements.
 */
export const SalemBody: React.FC<SalemBodyProps> = ({
  state,
  onCelebrationComplete,
}) => {
  // ── Blink system (IDLE only): random interval between 3–7s ──
  const blinkControls = useAnimation();
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleBlink = useCallback(() => {
    const delay = 3000 + Math.random() * 4000; // 3–7s
    blinkTimerRef.current = setTimeout(async () => {
      if (state !== "IDLE") return;
      // Quick blink: close and reopen
      await blinkControls.start({
        scaleY: 0.1,
        transition: { duration: 0.08 },
      });
      await blinkControls.start({
        scaleY: 1,
        transition: { duration: 0.1 },
      });
      scheduleBlink();
    }, delay);
  }, [blinkControls, state]);

  useEffect(() => {
    if (state === "IDLE") {
      scheduleBlink();
    } else {
      // Clear any pending blink when not idle
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
        blinkTimerRef.current = null;
      }
    }
    return () => {
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
        blinkTimerRef.current = null;
      }
    };
  }, [state, scheduleBlink]);

  // ── Celebrating sequence tracking ──
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratePhase, setCelebratePhase] = useState<
    "idle" | "jump" | "spin"
  >("idle");
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (state === "CELEBRATING") {
      setCelebratePhase("jump");
      setShowConfetti(true);
      // After jump animation completes (~1.0s), spin
      celebrationTimerRef.current = setTimeout(() => {
        setCelebratePhase("spin");
      }, 1000);
    } else {
      setCelebratePhase("idle");
      setShowConfetti(false);
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    }
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    };
  }, [state]);

  // Handle celebration complete — called after spin finishes
  const handleSpinComplete = useCallback(() => {
    if (celebratePhase === "spin" && onCelebrationComplete) {
      onCelebrationComplete();
    }
  }, [celebratePhase, onCelebrationComplete]);

  return (
    <motion.svg
      id="salem"
      width="120"
      height="140"
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
      variants={salemGroupVariants}
      animate={state}
    >
      <defs>
        {/* Subtle highlight gradient for body depth */}
        <radialGradient id="body-gradient" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#2d2d2d" />
          <stop offset="70%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#111111" />
        </radialGradient>

        {/* Head gradient — slight highlight on forehead */}
        <radialGradient id="head-gradient" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#2d2d2d" />
          <stop offset="60%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#141414" />
        </radialGradient>

        {/* Ear inner gradient */}
        <linearGradient id="ear-inner-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a2a" />
          <stop offset="100%" stopColor="#2a1a1a" />
        </linearGradient>

        {/* Eye glow */}
        <radialGradient id="eye-glow" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#c4d94f" />
          <stop offset="60%" stopColor="#a8c24a" />
          <stop offset="100%" stopColor="#8aa83e" />
        </radialGradient>
      </defs>

      {/* ── TAIL ── */}
      <motion.path
        id="salem-tail"
        d="M 68 105 C 85 108, 105 100, 112 85 C 118 72, 115 60, 108 55"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="6"
        strokeLinecap="round"
        variants={tailVariants}
        animate={state}
        style={{ originX: "68px", originY: "105px" }}
      />
      {/* Tail highlight edge */}
      <path
        d="M 68 105 C 85 108, 105 100, 112 85 C 118 72, 115 60, 108 55"
        fill="none"
        stroke="#2d2d2d"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />

      {/* ── BODY ── */}
      <ellipse
        id="salem-body"
        cx="60"
        cy="100"
        rx="30"
        ry="28"
        fill="url(#body-gradient)"
      />
      {/* Body highlight arc */}
      <ellipse
        cx="60"
        cy="94"
        rx="18"
        ry="12"
        fill="none"
        stroke="#2d2d2d"
        strokeWidth="0.5"
        opacity="0.3"
        style={{ pointerEvents: "none" }}
      />

      {/* ── PAWS ── */}
      <motion.rect
        id="paw-left"
        x="40"
        y="122"
        width="14"
        height="8"
        rx="4"
        ry="4"
        fill="#1a1a1a"
        variants={pawLeftVariants}
        animate={state}
      />
      {/* Left paw toe lines */}
      <line
        x1="45"
        y1="126"
        x2="45"
        y2="129"
        stroke="#2d2d2d"
        strokeWidth="0.5"
        opacity="0.5"
      />
      <line
        x1="49"
        y1="126"
        x2="49"
        y2="129"
        stroke="#2d2d2d"
        strokeWidth="0.5"
        opacity="0.5"
      />

      <motion.rect
        id="paw-right"
        x="66"
        y="122"
        width="14"
        height="8"
        rx="4"
        ry="4"
        fill="#1a1a1a"
        variants={pawRightVariants}
        animate={state}
      />
      {/* Right paw toe lines */}
      <line
        x1="71"
        y1="126"
        x2="71"
        y2="129"
        stroke="#2d2d2d"
        strokeWidth="0.5"
        opacity="0.5"
      />
      <line
        x1="75"
        y1="126"
        x2="75"
        y2="129"
        stroke="#2d2d2d"
        strokeWidth="0.5"
        opacity="0.5"
      />

      {/* ── HEAD ── */}
      <motion.circle
        id="salem-head"
        cx="60"
        cy="55"
        r="26"
        fill="url(#head-gradient)"
        variants={headVariants}
        animate={state}
        style={{ originX: "60px", originY: "55px" }}
      />

      {/* ── EARS ── */}
      {/* Left ear */}
      <motion.path
        id="ear-left"
        d="M 40 40 L 30 12 L 50 32 Z"
        fill="#1a1a1a"
        variants={earLeftVariants}
        animate={state}
        style={{ originX: "40px", originY: "40px" }}
      />
      {/* Left ear inner detail */}
      <path
        d="M 39 37 L 33 18 L 47 33 Z"
        fill="url(#ear-inner-gradient)"
        opacity="0.6"
        style={{ pointerEvents: "none" }}
      />

      {/* Right ear */}
      <motion.path
        id="ear-right"
        d="M 80 40 L 90 12 L 70 32 Z"
        fill="#1a1a1a"
        variants={earRightVariants}
        animate={state}
        style={{ originX: "80px", originY: "40px" }}
      />
      {/* Right ear inner detail */}
      <path
        d="M 81 37 L 87 18 L 73 33 Z"
        fill="url(#ear-inner-gradient)"
        opacity="0.6"
        style={{ pointerEvents: "none" }}
      />

      {/* ── EYES ── */}
      {/* In IDLE state, eyes are driven by both variant + blink controller.
          The blink controller temporarily overrides scaleY. For other states,
          the variant controls scaleY directly. */}
      <motion.ellipse
        id="eye-left"
        cx="50"
        cy="52"
        rx="5"
        ry="3.5"
        fill="url(#eye-glow)"
        variants={eyeLeftVariants}
        animate={state === "IDLE" ? blinkControls : state}
        style={{ originX: "50px", originY: "52px" }}
      />
      {/* Left pupil */}
      <ellipse
        cx="50"
        cy="52"
        rx="2"
        ry="3"
        fill="#111"
        style={{ pointerEvents: "none" }}
      />

      <motion.ellipse
        id="eye-right"
        cx="70"
        cy="52"
        rx="5"
        ry="3.5"
        fill="url(#eye-glow)"
        variants={eyeRightVariants}
        animate={state === "IDLE" ? blinkControls : state}
        style={{ originX: "70px", originY: "52px" }}
      />
      {/* Right pupil */}
      <ellipse
        cx="70"
        cy="52"
        rx="2"
        ry="3"
        fill="#111"
        style={{ pointerEvents: "none" }}
      />

      {/* ── NOSE ── */}
      <path d="M 58 61 L 60 64 L 62 61 Z" fill="#3a2a2a" opacity="0.7" />

      {/* ── MOUTH ── */}
      <path
        id="mouth"
        d="M 55 65 Q 60 69, 65 65"
        fill="none"
        stroke="#2d2d2d"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* ── WHISKERS ── */}
      {/* Left whiskers */}
      <line
        x1="45"
        y1="60"
        x2="22"
        y2="56"
        stroke="#2d2d2d"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <line
        x1="45"
        y1="62"
        x2="20"
        y2="62"
        stroke="#2d2d2d"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <line
        x1="45"
        y1="64"
        x2="22"
        y2="68"
        stroke="#2d2d2d"
        strokeWidth="0.7"
        opacity="0.5"
      />

      {/* Right whiskers */}
      <line
        x1="75"
        y1="60"
        x2="98"
        y2="56"
        stroke="#2d2d2d"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <line
        x1="75"
        y1="62"
        x2="100"
        y2="62"
        stroke="#2d2d2d"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <line
        x1="75"
        y1="64"
        x2="98"
        y2="68"
        stroke="#2d2d2d"
        strokeWidth="0.7"
        opacity="0.5"
      />

      {/* ── SLEEPING Z ── */}
      {state === "SLEEPING" && (
        <motion.text
          x="85"
          y="30"
          fill="#a8c24a"
          fontSize="16"
          fontWeight="bold"
          fontFamily="sans-serif"
          variants={sleepingZVariants}
          animate="float"
          style={{ pointerEvents: "none" }}
        >
          z
        </motion.text>
      )}

      {/* ── CONFETTI (CELEBRATING) ── */}
      <AnimatePresence>
        {showConfetti &&
          CONFETTI_COLORS.map((color, i) => (
            <motion.circle
              key={`confetti-${i}`}
              cx="60"
              cy="70"
              r="3"
              fill={color}
              custom={i}
              variants={confettiVariants}
              initial="hidden"
              animate="burst"
              exit="hidden"
              style={{ pointerEvents: "none" }}
            />
          ))}
      </AnimatePresence>

      {/* ── HEARTS (BEING_PETTED) ── */}
      {state === "BEING_PETTED" &&
        [0, 1, 2].map((i) => (
          <motion.text
            key={`heart-${i}`}
            x={50 + i * 10}
            y="25"
            fill="#FF6B8A"
            fontSize="12"
            fontFamily="sans-serif"
            custom={i}
            variants={heartVariants}
            animate="float"
            style={{ pointerEvents: "none" }}
          >
            ♡
          </motion.text>
        ))}

      {/* ── STRESS LINES (BEING_DRAGGED) ── */}
      {/* 3 short diagonal lines near Salem's head that appear when dragging */}
      <motion.line
        x1="25"
        y1="38"
        x2="18"
        y2="32"
        stroke="#a8c24a"
        strokeWidth="1.5"
        strokeLinecap="round"
        variants={stressLineVariants}
        animate={state === "BEING_DRAGGED" ? "visible" : "hidden"}
        style={{ originX: "21px", originY: "35px", pointerEvents: "none" }}
      />
      <motion.line
        x1="22"
        y1="46"
        x2="14"
        y2="42"
        stroke="#a8c24a"
        strokeWidth="1.5"
        strokeLinecap="round"
        variants={stressLineVariants}
        animate={state === "BEING_DRAGGED" ? "visible" : "hidden"}
        style={{ originX: "18px", originY: "44px", pointerEvents: "none" }}
      />
      <motion.line
        x1="95"
        y1="38"
        x2="102"
        y2="32"
        stroke="#a8c24a"
        strokeWidth="1.5"
        strokeLinecap="round"
        variants={stressLineVariants}
        animate={state === "BEING_DRAGGED" ? "visible" : "hidden"}
        style={{ originX: "98px", originY: "35px", pointerEvents: "none" }}
      />

      {/* ── CELEBRATING SPIN OVERLAY ── */}
      {celebratePhase === "spin" && (
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          onAnimationComplete={handleSpinComplete}
          style={{ originX: "60px", originY: "70px" }}
        />
      )}
    </motion.svg>
  );
};
