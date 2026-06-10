# Salem-theBlackCat — Project Specification

## What it is
A transparent always-on-top desktop pet — a black cat named Salem — built with
Tauri v2 and React 18 TypeScript. Salem lives on the screen all day, reacts to
the user's coding activity in real time, and can be physically interacted with
via mouse.

---

## Tech Stack
- Tauri v2 — Rust backend, WebView2 (Windows) / WebKit (macOS/Linux) frontend shell
- React 18 + TypeScript — all UI and animation
- rdev (Rust crate) — global keyboard and mouse input monitoring
- Axum (Rust crate) — local HTTP server on port 7821 for browser extension events
- tokio (Rust crate) — async runtime for Axum
- Framer Motion — all React animations, no other animation library
- tauri-plugin-store — persisting user settings
- Pure inline SVG — Salem's body, no external image assets

---

## Window Requirements
- Transparent background, no frame, no title bar, no decorations
- Always on top of all other windows
- Non-Salem areas of the window are click-through
  (only Salem's SVG shape captures mouse events)
- Default position: bottom-right corner of screen
- Draggable to anywhere on screen by clicking and dragging Salem
- Size: 220 × 220px, not resizable
- Hidden from taskbar (skipTaskbar: true)
- Window title: "Salem"

---

## Salem's Visual Design

### SVG Structure
Salem is a pure inline SVG, approximately 120px tall, black fill.

Named element IDs (used by animation system — do not rename):
- `#salem-body`    — main torso ellipse
- `#salem-head`    — circle
- `#salem-tail`    — curved path, curls to the right
- `#ear-left`      — triangular path, left ear
- `#ear-right`     — triangular path, right ear
- `#eye-left`      — ellipse, default half-closed, yellow-green fill #a8c24a
- `#eye-right`     — ellipse, default half-closed, yellow-green fill #a8c24a
- `#mouth`         — small curved path, neutral expression
- `#paw-left`      — small rounded rectangle, front left paw
- `#paw-right`     — small rounded rectangle, front right paw

Color palette:
- Body: #1a1a1a (main black)
- Subtle highlight edges: #2d2d2d
- Eyes: #a8c24a (yellow-green)

### Drag Stretch Behaviour
When Salem is dragged, her body stretches vertically (like being picked up by the scruff):
- Primary axis: scaleY, driven by Y-axis drag delta
  - Interpolate from 1.0 (stationary) up to max 2.5 (far/fast drag)
  - Diagonal drags also contribute to scaleY proportionally
- Secondary axis: scaleX compresses inversely as scaleY grows
  - At max stretch (scaleY 2.5), scaleX is at minimum 0.75
  - This makes Salem look tall and thin — pulled like taffy
- On drag release: both axes spring back to 1.0
  - Framer Motion spring: stiffness 400, damping 20

---

## Salem's State Machine

Salem has exactly one active state at a time.

### States
| State | Description |
|---|---|
| `IDLE` | Slow tail sway, occasional blink and yawn. Default state. |
| `TYPING` | Types on tiny laptop prop, ears perk forward |
| `THINKING` | Paw on chin, slow head tilt. Entered after 5s of no input. |
| `SLEEPING` | Curled up, floating zzz bubbles. Entered after 2min of no input. |
| `CELEBRATING` | Jump, spin, confetti burst |
| `DISAPPOINTED` | Drooped ears, slow head shake, heavy-lidded eyes, slouch |
| `STARTLED` | Sharp jump, puffed tail, wide eyes |
| `BEING_PETTED` | Eyes close, purr lines, floating hearts |
| `BEING_DRAGGED` | Vertical body stretch, stress lines near head |

### Event → State Transition Table
| Event | Source | → Salem State |
|---|---|---|
| Any keydown | Global rdev hook | → `TYPING` |
| No input for 5s | Idle timer | → `THINKING` |
| No input for 2 minutes | Idle timer | → `SLEEPING` |
| Any keydown while SLEEPING | Global rdev hook | → `TYPING` |
| Submission: Accepted | LeetCode (extension) | → `CELEBRATING` |
| Submission: Wrong Answer | LeetCode (extension) | → `DISAPPOINTED` |
| Submission: Runtime Error | LeetCode (extension) | → `DISAPPOINTED` |
| Submission: Time Limit Exceeded | LeetCode (extension) | → `DISAPPOINTED` |
| Submission: Correct | InterviewBit (extension) | → `CELEBRATING` |
| Submission: Wrong | InterviewBit (extension) | → `DISAPPOINTED` |
| Mouse slow hover (< 5px/frame for > 0.5s, no button) | useDrag.ts | → `BEING_PETTED` |
| Fast click (mousedown, prev velocity > 20px/frame) | useDrag.ts | → `STARTLED` |
| Click + drag (mousedown held > 150ms + movement) | useDrag.ts | → `BEING_DRAGGED` |
| Drag released | useDrag.ts | → `IDLE` |

### Auto-exit Timers
- `CELEBRATING` → `IDLE` automatically after animation completes (onAnimationComplete)
- `DISAPPOINTED` → `IDLE` automatically after 3s
- `STARTLED` → `IDLE` automatically after 1.5s
- `BEING_PETTED` → `IDLE` when mouse leaves or velocity rises above 8px/frame

### Timer Rules
- Both idle timers (5s and 2min) reset on any keydown event
- Timers are implemented with useRef, not setTimeout
- Do not use setTimeout anywhere for state transitions

---

## Animation Specifications (per state)

### IDLE
- `#salem-tail`: rotate −15deg ↔ +15deg, 2s ease-in-out, infinite loop
- `#eye-left`, `#eye-right`: random blink (scaleY to 0.1 and back) every 3–7s

### TYPING
- `#paw-left`, `#paw-right`: alternate translateY(−6px / 0px) at 180ms intervals
- `#ear-left`, `#ear-right`: rotate +8deg toward centre
- Entry transition: 0.15s ease

### THINKING
- `#paw-right`: translate up and inward to chin position
- `#salem-head`: rotate −8deg ↔ 0deg, 3s loop

### SLEEPING
- Whole Salem group: scale 0.92
- `#eye-left`, `#eye-right`: scaleY 0.05 (fully closed, stays closed)
- Floating "z" text: appears, translateY −20px, fades out, every 3s infinite

### CELEBRATING
- Whole Salem: translateY(−45px) + rotate(+15deg then −15deg), 0.5s, repeat once
- Then: rotate 360deg spin, 0.4s
- 8 confetti dots burst radially from Salem's centre, fade out over 0.6s
- Auto-exit to IDLE via onAnimationComplete

### DISAPPOINTED
- `#ear-left`: rotate −35deg
- `#ear-right`: rotate +35deg
- `#salem-head`: shake −6deg → +6deg → −6deg → 0deg over 1.2s
- `#eye-left`, `#eye-right`: scaleY 0.35 (heavy lidded)
- Whole Salem: translateY(+4px) (slouch)
- Auto-exit to IDLE after 3s via onAnimationComplete

### STARTLED
- Whole Salem: translateY(−30px) in 0.08s, spring back (stiffness 500, damping 15)
- `#salem-tail`: scaleX 1.8 then back to 1.0 over 0.4s
- `#eye-left`, `#eye-right`: scaleY 1.4 (wide) for 0.5s then normal
- Auto-exit to IDLE after 1.5s via onAnimationComplete

### BEING_PETTED
- `#eye-left`, `#eye-right`: scaleY to 0.05 over 0.6s (slowly close)
- `#salem-tail`: rotate −25deg ↔ +25deg, 2.5s loop
- 3 × ♡ SVG elements float up 25px and fade out, staggered 0.4s apart, repeat every 3s

### BEING_DRAGGED
- scaleY/scaleX stretch is handled entirely by useDrag.ts — do not duplicate here
- 3 short diagonal stress lines (`<line>` elements) near Salem's head:
  appear (opacity 0 → 1) on drag start, disappear on release
  wiggle ±5deg while drag is active

---

## Interaction System (useDrag.ts)

All mouse interaction with Salem is handled in `src/hooks/useDrag.ts`.

### Dragging
- Trigger: mousedown held > 150ms + movement detected
- Update Salem's screen position via Tauri `window.setPosition` (invoked each mousemove)
- Apply vertical stretch as described in Visual Design → Drag Stretch Behaviour above
- Call `transitionTo("BEING_DRAGGED")` on drag start
- Call `transitionTo("IDLE")` on mouseup, trigger spring snap-back

### Petting
- Trigger: mouseover Salem, no button held, average velocity of last 10 mousemove
  events < 5px/frame sustained for > 500ms
- Call `transitionTo("BEING_PETTED")`
- Exit: velocity > 8px/frame or mouseleave → `transitionTo("IDLE")`
- Store velocity history in useRef (rolling buffer of 10 values)

### Poking
- Trigger: mousedown on Salem when velocity of most recent mousemove > 20px/frame
- Call `transitionTo("STARTLED")`
- Auto-return to IDLE after 1.5s (handled in animation variant, not setTimeout)

### Click-through
- The outer transparent window container has `setIgnoreCursorEvents(true)`
- Only the Salem SVG element has `setIgnoreCursorEvents(false)`
- This ensures clicks pass through empty areas to windows underneath

---

## IPC Architecture

```
┌─────────────────────────────────────────────────────┐
│  Global input (rdev)                                │
│  KeyPress → debounce 50ms → emit "input:keydown"    │
└────────────────────┬────────────────────────────────┘
                     │ Tauri emit_all()
                     ▼
┌─────────────────────────────────────────────────────┐
│  Chrome Extension                                   │
│  MutationObserver on LeetCode / InterviewBit DOM    │
│  → chrome.runtime.sendMessage → background.ts       │
│  → POST localhost:7821/event { event_type: "..." }  │
└────────────────────┬────────────────────────────────┘
                     │ Axum handler
                     ▼
┌─────────────────────────────────────────────────────┐
│  Axum server (port 7821)                            │
│  "celebrate"  → emit "cat:celebrate"               │
│  "disappoint" → emit "cat:disappoint"              │
└────────────────────┬────────────────────────────────┘
                     │ Tauri emit_all()
                     ▼
┌─────────────────────────────────────────────────────┐
│  React: useTauriEvents.ts                           │
│  Tauri event listeners → calls transitionTo()       │
│                                                     │
│  React: useSalemState.ts                            │
│  Central state machine, single source of truth      │
│                                                     │
│  React: Salem.tsx                                   │
│  Reads state → applies Framer Motion variants       │
└─────────────────────────────────────────────────────┘
```

### Tauri Event Names (canonical — do not change)
| Event name | Direction | Meaning |
|---|---|---|
| `input:keydown` | Rust → React | Global key was pressed |
| `input:permission_error` | Rust → React | rdev couldn't get input access |
| `cat:celebrate` | Rust → React | Submission accepted |
| `cat:disappoint` | Rust → React | Submission rejected or error |
| `cat:startled` | Rust → React | (reserved for future use) |
| `open:settings` | React → Rust | Open settings window |
| `settings:updated` | React → React | Settings changed, re-read store |

### HTTP Event Body (extension → Axum)
```json
{ "event_type": "celebrate" }
{ "event_type": "disappoint" }
```
Field name is `event_type` (not `type`). The Axum handler deserialises this struct:
```rust
struct CatEvent { event_type: String }
```

---

## File Structure

```
Salem-theBlackCat/
├── SPEC.md                          ← this file
├── extension/
│   ├── manifest.json                ← Chrome extension manifest V3
│   ├── content.ts                   ← MutationObserver for LeetCode + InterviewBit
│   ├── background.ts                ← Service worker, POSTs to localhost:7821
│   └── README.md                    ← How to compile and load unpacked
├── src/
│   ├── App.tsx                      ← Root: renders Salem or Settings based on URL param
│   ├── animations/
│   │   └── states.ts                ← All Framer Motion variant objects, one per state
│   ├── components/
│   │   ├── Salem.tsx                ← Main component: reads state, applies variants
│   │   ├── SalemBody.tsx            ← The SVG cat, accepts state prop
│   │   ├── SalemExpressions.tsx     ← SVG face/emotion element variants
│   │   └── Settings.tsx             ← Settings panel UI
│   └── hooks/
│       ├── useSalemState.ts         ← State machine: SalemState type + transitionTo
│       ├── useDrag.ts               ← Drag, stretch, petting, poke detection
│       └── useTauriEvents.ts        ← Tauri event listeners → transitionTo calls
└── src-tauri/
    ├── tauri.conf.json              ← Window config (transparent, alwaysOnTop, etc.)
    └── src/
        ├── main.rs                  ← App entry, setup(), spawns all threads/tasks
        ├── input_monitor.rs         ← rdev global hook, emits input:keydown
        ├── event_server.rs          ← Axum HTTP server on port 7821
        └── tray.rs                  ← System tray icon and menu
```

---

## Settings (tauri-plugin-store, key: "salem-settings")

| Setting | Type | Default | Effect |
|---|---|---|---|
| `soundEnabled` | boolean | false | Enable/disable audio reactions |
| `startOnLogin` | boolean | false | Register as login item |
| `catSize` | number (0.5–1.5) | 1.0 | Scale multiplier applied to Salem's SVG |
| `windowPosition` | {x, y} | bottom-right | Persisted drag position |

Settings window: 300 × 340px, decorations on, not transparent, not always-on-top.
Opened from tray menu. Rendered when URL contains `?window=settings`.

---

## Cargo.toml Dependencies (src-tauri)
```toml
rdev = "0.5"
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

## npm Dependencies (root)
```
framer-motion
```
Tauri plugin store is added via `npm run tauri add store`.

---

## Platform Notes
- **macOS**: rdev requires Accessibility permissions. If denied, emit
  `input:permission_error` — do not panic.
- **Windows**: rdev works without special permissions.
- **Linux**: rdev requires X11; Wayland support is limited.