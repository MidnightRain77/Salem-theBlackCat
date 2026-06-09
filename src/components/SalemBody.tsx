import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import type { SalemState } from "../hooks/useSalemState.ts";

interface SalemBodyProps {
  state: SalemState;
  /** Vertical stretch factor, driven by drag velocity. Defaults to 1.0. */
  stretchY?: MotionValue<number>;
}

/**
 * SalemBody — Pure inline SVG of Salem the black cat.
 * Front-facing view, ~120px tall. All key elements have IDs for future animation.
 * Currently static; `state` prop accepted but unused until animation is wired.
 * `stretchY` applies a vertical scaleY transform to #salem-body during drag.
 */
export const SalemBody: React.FC<SalemBodyProps> = ({ stretchY }) => {
  const defaultStretch = useMotionValue(1.0);
  const sy = stretchY ?? defaultStretch;

  // The paws are at cy="96", while the body center is at cy="78" with ry="22".
  // The bottom of the body shifts down by 22 * (scaleY - 1).
  // Translate the paws vertically by this amount so they stay attached.
  const pawY = useTransform(sy, (v: number) => 22 * (v - 1));

  return (
    <svg
      id="salem-svg"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Tail ── curved path extending to the right */}
      <path
        id="salem-tail"
        d="M70 78 Q90 72, 100 60 Q110 48, 108 38"
        fill="none"
        stroke="#000000"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* ── Body ── main torso ellipse, with drag stretch */}
      <motion.ellipse
        id="salem-body"
        cx="60"
        cy="78"
        rx="26"
        ry="22"
        fill="#000000"
        style={{ scaleY: sy, transformOrigin: "center" }}
      />

      {/* ── Paws ── small ellipses at the bottom front, moving vertically with stretch */}
      <motion.g style={{ y: pawY }}>
        <ellipse
          id="paw-left"
          cx="48"
          cy="96"
          rx="7"
          ry="4"
          fill="#000000"
        />
        <ellipse
          id="paw-right"
          cx="72"
          cy="96"
          rx="7"
          ry="4"
          fill="#000000"
        />
      </motion.g>

      {/* ── Head ── circle */}
      <circle
        id="salem-head"
        cx="60"
        cy="48"
        r="22"
        fill="#000000"
      />

      {/* ── Ears ── triangular paths */}
      <path
        id="ear-left"
        d="M42 38 L36 18 L52 32 Z"
        fill="#000000"
      />
      <path
        id="ear-right"
        d="M78 38 L84 18 L68 32 Z"
        fill="#000000"
      />

      {/* ── Eyes ── ellipses, half-closed/neutral (short vertical axis) */}
      <ellipse
        id="eye-left"
        cx="51"
        cy="46"
        rx="4"
        ry="2.5"
        fill="#39ff14"
      />
      <ellipse
        id="eye-right"
        cx="69"
        cy="46"
        rx="4"
        ry="2.5"
        fill="#39ff14"
      />

      {/* ── Mouth ── small curved path, neutral */}
      <path
        id="mouth"
        d="M55 56 Q60 60, 65 56"
        fill="none"
        stroke="#333333"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
