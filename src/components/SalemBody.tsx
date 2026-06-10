import React from "react";
import type { SalemState } from "../hooks/useSalemState";

interface SalemBodyProps {
  state: SalemState;
}

/**
 * SalemBody — Pure inline SVG of Salem the black cat.
 *
 * All named element IDs are consumed by the animation system.
 * This component renders the STATIC shape only; animations are
 * applied externally via Framer Motion variants.
 */
export const SalemBody: React.FC<SalemBodyProps> = ({ state: _state }) => {
  return (
    <svg
      id="salem"
      width="120"
      height="140"
      viewBox="0 0 120 140"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
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
      {/* Curved path extending to the right and curling upward */}
      <path
        id="salem-tail"
        d="M 68 105 C 85 108, 105 100, 112 85 C 118 72, 115 60, 108 55"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="6"
        strokeLinecap="round"
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
      <rect
        id="paw-left"
        x="40"
        y="122"
        width="14"
        height="8"
        rx="4"
        ry="4"
        fill="#1a1a1a"
      />
      {/* Left paw toe lines */}
      <line
        x1="45" y1="126" x2="45" y2="129"
        stroke="#2d2d2d" strokeWidth="0.5" opacity="0.5"
      />
      <line
        x1="49" y1="126" x2="49" y2="129"
        stroke="#2d2d2d" strokeWidth="0.5" opacity="0.5"
      />

      <rect
        id="paw-right"
        x="66"
        y="122"
        width="14"
        height="8"
        rx="4"
        ry="4"
        fill="#1a1a1a"
      />
      {/* Right paw toe lines */}
      <line
        x1="71" y1="126" x2="71" y2="129"
        stroke="#2d2d2d" strokeWidth="0.5" opacity="0.5"
      />
      <line
        x1="75" y1="126" x2="75" y2="129"
        stroke="#2d2d2d" strokeWidth="0.5" opacity="0.5"
      />

      {/* ── HEAD ── */}
      <circle
        id="salem-head"
        cx="60"
        cy="55"
        r="26"
        fill="url(#head-gradient)"
      />

      {/* ── EARS ── */}
      {/* Left ear */}
      <path
        id="ear-left"
        d="M 40 40 L 30 12 L 50 32 Z"
        fill="#1a1a1a"
      />
      {/* Left ear inner detail */}
      <path
        d="M 39 37 L 33 18 L 47 33 Z"
        fill="url(#ear-inner-gradient)"
        opacity="0.6"
        style={{ pointerEvents: "none" }}
      />

      {/* Right ear */}
      <path
        id="ear-right"
        d="M 80 40 L 90 12 L 70 32 Z"
        fill="#1a1a1a"
      />
      {/* Right ear inner detail */}
      <path
        d="M 81 37 L 87 18 L 73 33 Z"
        fill="url(#ear-inner-gradient)"
        opacity="0.6"
        style={{ pointerEvents: "none" }}
      />

      {/* ── EYES ── */}
      {/* Half-closed / neutral: ry smaller than rx for a sleepy-cat look */}
      <ellipse
        id="eye-left"
        cx="50"
        cy="52"
        rx="5"
        ry="3.5"
        fill="url(#eye-glow)"
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

      <ellipse
        id="eye-right"
        cx="70"
        cy="52"
        rx="5"
        ry="3.5"
        fill="url(#eye-glow)"
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
      <path
        d="M 58 61 L 60 64 L 62 61 Z"
        fill="#3a2a2a"
        opacity="0.7"
      />

      {/* ── MOUTH ── */}
      {/* Neutral expression: gentle downward curve from nose */}
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
        x1="45" y1="60" x2="22" y2="56"
        stroke="#2d2d2d" strokeWidth="0.7" opacity="0.5"
      />
      <line
        x1="45" y1="62" x2="20" y2="62"
        stroke="#2d2d2d" strokeWidth="0.7" opacity="0.5"
      />
      <line
        x1="45" y1="64" x2="22" y2="68"
        stroke="#2d2d2d" strokeWidth="0.7" opacity="0.5"
      />

      {/* Right whiskers */}
      <line
        x1="75" y1="60" x2="98" y2="56"
        stroke="#2d2d2d" strokeWidth="0.7" opacity="0.5"
      />
      <line
        x1="75" y1="62" x2="100" y2="62"
        stroke="#2d2d2d" strokeWidth="0.7" opacity="0.5"
      />
      <line
        x1="75" y1="64" x2="98" y2="68"
        stroke="#2d2d2d" strokeWidth="0.7" opacity="0.5"
      />
    </svg>
  );
};
