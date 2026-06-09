# Salem-theBlackCat — Project Specification

## What it is
A transparent always-on-top desktop pet (black cat named Salem) built with Tauri v2
and React 18. Salem reacts to the user's coding activity in real time.

## Tech Stack
- Tauri v2 (Rust backend, WebView2/WebKit frontend shell)
- React 18 + TypeScript
- rdev crate (global keyboard/mouse input monitoring in Rust)
- Axum (local HTTP server in Rust for browser extension events, port 7821)
- Framer Motion (React animation)
- SVG-based Salem (no external animation runtime, no asset files)

## Window Requirements
- Transparent background, no frame, no chrome
- Always on top of all other windows
- Click-through on non-Salem areas (only Salem's shape is interactive)
- Default position: bottom-right corner, draggable anywhere
- Size: 220x220px

## Salem's States (State Machine)
One active state at a time:
1. IDLE          — slow tail sway, occasional blink/yawn
2. TYPING        — types on tiny laptop prop, ears alert
3. THINKING      — paw on chin, head tilt
4. SLEEPING      — curled up, zzz bubbles (triggers after 2min idle)
5. CELEBRATING   — jump + spin + confetti burst
6. DISAPPOINTED  — droop ears, slow head shake, slouch
7. STARTLED      — sharp jump, puffed tail (fast click/poke)
8. BEING_PETTED  — eyes close, purr lines, floating hearts
9. BEING_DRAGGED — body stretches horizontally, stress lines

## Event → State Transition Table
| Event                              | → Salem State   |
|------------------------------------|-----------------|
| keydown (global hook)              | → TYPING        |
| No input for 5s                    | → THINKING      |
| No input for 2min                  | → SLEEPING      |
| Extension: LeetCode Accepted       | → CELEBRATING   |
| Extension: LeetCode Wrong Answer   | → DISAPPOINTED  |
| Extension: LeetCode Runtime Error  | → DISAPPOINTED  |
| Extension: InterviewBit correct    | → CELEBRATING   |
| Extension: InterviewBit wrong      | → DISAPPOINTED  |
| Mouse slow hover on Salem          | → BEING_PETTED  |
| Fast click on Salem                | → STARTLED      |
| Click + drag Salem                 | → BEING_DRAGGED |
| Release drag                       | → IDLE (spring snap) |

## IPC Architecture
Rust (rdev) → Tauri emit() → React useTauriEvents hook → useSalemState
Chrome extension → POST localhost:7821/event → Axum → Tauri emit() → React

## Salem's Visual Design
- Black cat, pure inline SVG, ~120px tall
- Named SVG element IDs: #salem-body, #salem-head, #salem-tail,
  #ear-left, #ear-right, #eye-left, #eye-right, #mouth
- Drag stretch: scaleX from 1.0 to max 2.5 based on drag distance
- Snap back on release: Framer Motion spring (stiffness 400, damping 20)

## Interaction Details
- Petting: hover + mouse velocity < 5px/frame sustained for > 0.5s, no button held
- Dragging: mousedown held > 150ms + movement detected
- Poking: mousedown with previous mousemove velocity > 20px/frame

## File Structure
src-tauri/src/
  main.rs             — app entry, window setup, spawn threads
  input_monitor.rs    — global keyboard/mouse via rdev
  event_server.rs     — Axum HTTP server on port 7821
  tray.rs             — system tray icon and menu

src/
  components/
    Salem.tsx         — main Salem component, wires state to animation
    SalemBody.tsx     — the SVG cat with morph support
    SalemExpressions.tsx — face/emotion SVG variants
  hooks/
    useSalemState.ts  — central state machine
    useDrag.ts        — drag, stretch, petting detection
    useTauriEvents.ts — Tauri event listeners → state transitions
  animations/
    states.ts         — Framer Motion variant definitions per state

extension/
  manifest.json
  content.ts          — MutationObserver for LeetCode + InterviewBit
  background.ts       — POSTs events to localhost:7821
