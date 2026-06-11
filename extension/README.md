# Salem Connector (Chrome Extension)

A Chrome extension that connects **LeetCode** and **InterviewBit** submission
results to Salem the desktop cat. When you get a correct answer, Salem
celebrates! When you get it wrong, Salem is disappointed.

## How It Works

```
LeetCode / InterviewBit page
        │
        │  MutationObserver detects result
        ▼
  content.js  ── chrome.runtime.sendMessage ──▶  background.js
                                                      │
                                                      │  POST http://127.0.0.1:7821/event
                                                      │  { "event_type": "celebrate" | "disappoint" }
                                                      ▼
                                                Salem Desktop App (Axum server)
```

The content script watches the DOM for submission results using
`MutationObserver`. Because content scripts in Manifest V3 cannot directly
`fetch` to `localhost`, events are routed through the background service worker
which has `host_permissions` for `127.0.0.1:7821`.

## Detected Signals

| Site         | Result                                            | Salem Event   |
|--------------|---------------------------------------------------|---------------|
| LeetCode     | "Accepted"                                        | `celebrate`   |
| LeetCode     | "Wrong Answer", "Runtime Error", "Time Limit Exceeded" | `disappoint`  |
| InterviewBit | "Correct", "Accepted"                             | `celebrate`   |
| InterviewBit | "Wrong", "Incorrect"                              | `disappoint`  |

A 3-second debounce prevents duplicate triggers from rapid DOM updates.

## Compile

TypeScript must be compiled to JavaScript before loading:

```bash
cd extension/
tsc --outDir . content.ts background.ts
```

> You may need to install TypeScript globally: `npm install -g typescript`

## Load in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder

## Requirements

- Salem's desktop app must be running for events to reach the cat
- The Axum server listens on **port 7821** (`http://127.0.0.1:7821/event`)
- If Salem isn't running, the fetch fails silently — no errors in the console
