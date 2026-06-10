import type { Variants, Transition } from "framer-motion";

/**
 * Framer Motion variant objects for every SalemState.
 *
 * Naming convention:
 *   `<elementId>Variants` — variants keyed by SalemState value.
 *
 * Elements animate by setting `animate={state}` and `variants={…Variants}`.
 * Unlisted states inherit the implicit "idle" pose (no transform).
 */

// ─── Shared transitions ─────────────────────────────────────────────
const easeEntry: Transition = { duration: 0.15, ease: "easeOut" };
const thinkingEntry: Transition = { duration: 0.3, ease: "easeInOut" };

// ─── TAIL (#salem-tail) ─────────────────────────────────────────────
export const tailVariants: Variants = {
  IDLE: {
    rotate: [-15, 15, -15],
    transition: {
      rotate: { duration: 2, ease: "easeInOut", repeat: Infinity },
    },
  },
  TYPING: {
    rotate: 0,
    transition: easeEntry,
  },
  THINKING: {
    rotate: 0,
    transition: thinkingEntry,
  },
  SLEEPING: {
    rotate: 0,
    transition: { duration: 0.4 },
  },
  CELEBRATING: {
    rotate: 0,
  },
  DISAPPOINTED: {
    rotate: 0,
    transition: { duration: 0.3 },
  },
  STARTLED: {
    scaleX: [1, 1.8, 1],
    transition: {
      scaleX: { duration: 0.4, ease: "easeOut" },
    },
  },
  BEING_PETTED: {
    rotate: [-25, 25, -25],
    transition: {
      rotate: { duration: 2.5, ease: "easeInOut", repeat: Infinity },
    },
  },
  BEING_DRAGGED: {
    rotate: 0,
  },
};

// ─── EYE LEFT (#eye-left) ───────────────────────────────────────────
export const eyeLeftVariants: Variants = {
  IDLE: {
    scaleY: 1,
    transition: { duration: 0.15 },
  },
  TYPING: {
    scaleY: 1,
    transition: easeEntry,
  },
  THINKING: {
    scaleY: 1,
    transition: thinkingEntry,
  },
  SLEEPING: {
    scaleY: 0.05,
    transition: { duration: 0.4 },
  },
  CELEBRATING: {
    scaleY: 1,
  },
  DISAPPOINTED: {
    scaleY: 0.35,
    transition: { duration: 0.3 },
  },
  STARTLED: {
    scaleY: [1, 1.4, 1.4, 1],
    transition: {
      scaleY: { duration: 0.8, times: [0, 0.1, 0.6, 1], ease: "easeOut" },
    },
  },
  BEING_PETTED: {
    scaleY: 0.05,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  BEING_DRAGGED: {
    scaleY: 1,
  },
};

// ─── EYE RIGHT (#eye-right) ─────────────────────────────────────────
export const eyeRightVariants: Variants = {
  IDLE: {
    scaleY: 1,
    transition: { duration: 0.15 },
  },
  TYPING: {
    scaleY: 1,
    transition: easeEntry,
  },
  THINKING: {
    scaleY: 1,
    transition: thinkingEntry,
  },
  SLEEPING: {
    scaleY: 0.05,
    transition: { duration: 0.4 },
  },
  CELEBRATING: {
    scaleY: 1,
  },
  DISAPPOINTED: {
    scaleY: 0.35,
    transition: { duration: 0.3 },
  },
  STARTLED: {
    scaleY: [1, 1.4, 1.4, 1],
    transition: {
      scaleY: { duration: 0.8, times: [0, 0.1, 0.6, 1], ease: "easeOut" },
    },
  },
  BEING_PETTED: {
    scaleY: 0.05,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  BEING_DRAGGED: {
    scaleY: 1,
  },
};

// ─── PAW LEFT (#paw-left) ───────────────────────────────────────────
export const pawLeftVariants: Variants = {
  IDLE: {
    y: 0,
    x: 0,
    transition: { duration: 0.2 },
  },
  TYPING: {
    y: [0, -6, 0],
    transition: {
      y: {
        duration: 0.36,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0,
      },
    },
  },
  THINKING: {
    y: 0,
    transition: thinkingEntry,
  },
  SLEEPING: {
    y: 0,
    transition: { duration: 0.4 },
  },
  CELEBRATING: { y: 0 },
  DISAPPOINTED: { y: 0, transition: { duration: 0.3 } },
  STARTLED: { y: 0 },
  BEING_PETTED: { y: 0 },
  BEING_DRAGGED: { y: 0 },
};

// ─── PAW RIGHT (#paw-right) ─────────────────────────────────────────
export const pawRightVariants: Variants = {
  IDLE: {
    y: 0,
    x: 0,
    transition: { duration: 0.2 },
  },
  TYPING: {
    y: [-6, 0, -6],
    transition: {
      y: {
        duration: 0.36,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0,
      },
    },
  },
  THINKING: {
    // Paw moves to chin position (up and inward)
    y: -30,
    x: -10,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  SLEEPING: {
    y: 0,
    x: 0,
    transition: { duration: 0.4 },
  },
  CELEBRATING: { y: 0, x: 0 },
  DISAPPOINTED: { y: 0, x: 0, transition: { duration: 0.3 } },
  STARTLED: { y: 0, x: 0 },
  BEING_PETTED: { y: 0, x: 0 },
  BEING_DRAGGED: { y: 0, x: 0 },
};

// ─── EAR LEFT (#ear-left) ───────────────────────────────────────────
export const earLeftVariants: Variants = {
  IDLE: {
    rotate: 0,
    transition: { duration: 0.3 },
  },
  TYPING: {
    // Rotate toward centre (+8deg because left ear rotates clockwise toward middle)
    rotate: 8,
    transition: easeEntry,
  },
  THINKING: {
    rotate: 0,
    transition: thinkingEntry,
  },
  SLEEPING: {
    rotate: 0,
    transition: { duration: 0.4 },
  },
  CELEBRATING: { rotate: 0 },
  DISAPPOINTED: {
    rotate: -35,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  STARTLED: { rotate: 0 },
  BEING_PETTED: { rotate: 0 },
  BEING_DRAGGED: { rotate: 0 },
};

// ─── EAR RIGHT (#ear-right) ─────────────────────────────────────────
export const earRightVariants: Variants = {
  IDLE: {
    rotate: 0,
    transition: { duration: 0.3 },
  },
  TYPING: {
    // Rotate toward centre (-8deg because right ear rotates counter-clockwise toward middle)
    rotate: -8,
    transition: easeEntry,
  },
  THINKING: {
    rotate: 0,
    transition: thinkingEntry,
  },
  SLEEPING: {
    rotate: 0,
    transition: { duration: 0.4 },
  },
  CELEBRATING: { rotate: 0 },
  DISAPPOINTED: {
    rotate: 35,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  STARTLED: { rotate: 0 },
  BEING_PETTED: { rotate: 0 },
  BEING_DRAGGED: { rotate: 0 },
};

// ─── HEAD (#salem-head) ─────────────────────────────────────────────
export const headVariants: Variants = {
  IDLE: {
    rotate: 0,
    transition: { duration: 0.3 },
  },
  TYPING: {
    rotate: 0,
    transition: easeEntry,
  },
  THINKING: {
    rotate: [-8, 0, -8],
    transition: {
      rotate: { duration: 3, ease: "easeInOut", repeat: Infinity },
    },
  },
  SLEEPING: {
    rotate: 0,
    transition: { duration: 0.4 },
  },
  CELEBRATING: { rotate: 0 },
  DISAPPOINTED: {
    rotate: [-6, 6, -6, 0],
    transition: {
      rotate: { duration: 1.2, ease: "easeInOut" },
    },
  },
  STARTLED: { rotate: 0 },
  BEING_PETTED: { rotate: 0 },
  BEING_DRAGGED: { rotate: 0 },
};

// ─── WHOLE SALEM GROUP (wrapper) ─────────────────────────────────────
export const salemGroupVariants: Variants = {
  IDLE: {
    scale: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  TYPING: {
    scale: 1,
    y: 0,
    rotate: 0,
    transition: easeEntry,
  },
  THINKING: {
    scale: 1,
    y: 0,
    rotate: 0,
    transition: thinkingEntry,
  },
  SLEEPING: {
    scale: 0.92,
    y: 0,
    rotate: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  CELEBRATING: {
    y: [0, -45, 0, -45, 0],
    rotate: [0, 15, -15, 15, -15, 0],
    scale: 1,
    transition: {
      y: { duration: 1.0, ease: "easeInOut" },
      rotate: { duration: 1.0, ease: "easeInOut" },
    },
  },
  DISAPPOINTED: {
    y: 4,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  STARTLED: {
    y: -30,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
      duration: 0.08,
    },
  },
  BEING_PETTED: {
    scale: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.3 },
  },
  BEING_DRAGGED: {
    scale: 1,
    y: 0,
    rotate: 0,
  },
};

// ─── CELEBRATING SPIN (second phase — applied after jump) ────────────
export const celebrateSpinVariants: Variants = {
  spin: {
    rotate: 360,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  rest: {
    rotate: 0,
    transition: { duration: 0 },
  },
};

// ─── STRESS LINES (BEING_DRAGGED) ────────────────────────────────────
export const stressLineVariants: Variants = {
  hidden: {
    opacity: 0,
    rotate: 0,
    transition: { duration: 0.15 },
  },
  visible: {
    opacity: 1,
    rotate: [-5, 5, -5],
    transition: {
      opacity: { duration: 0.15 },
      rotate: { duration: 0.3, ease: "easeInOut", repeat: Infinity },
    },
  },
};

// ─── SLEEPING Z TEXT ──────────────────────────────────────────────────
export const sleepingZVariants: Variants = {
  float: {
    y: [0, -20],
    opacity: [1, 0],
    transition: {
      duration: 3,
      ease: "easeOut",
      repeat: Infinity,
    },
  },
  hidden: {
    y: 0,
    opacity: 0,
    transition: { duration: 0 },
  },
};

// ─── CONFETTI PARTICLE ───────────────────────────────────────────────
export const confettiVariants: Variants = {
  burst: (i: number) => {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 50;
    return {
      x: [0, Math.cos(angle) * radius],
      y: [0, Math.sin(angle) * radius],
      opacity: [1, 0],
      transition: { duration: 0.6, ease: "easeOut" },
    };
  },
  hidden: {
    x: 0,
    y: 0,
    opacity: 0,
  },
};

// ─── HEART (BEING_PETTED) ────────────────────────────────────────────
export const heartVariants: Variants = {
  float: (i: number) => ({
    y: [0, -25],
    opacity: [1, 0],
    transition: {
      duration: 1.2,
      ease: "easeOut",
      delay: i * 0.4,
      repeat: Infinity,
      repeatDelay: 3 - 1.2 - i * 0.4, // align all hearts to 3s cycle
    },
  }),
  hidden: {
    y: 0,
    opacity: 0,
  },
};
