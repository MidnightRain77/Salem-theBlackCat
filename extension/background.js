"use strict";
/**
 * Salem – Salem Connector: Background Service Worker
 *
 * Listens for messages from the content script and POSTs events
 * to Salem's local Axum server on port 7821.
 */
const SALEM_EVENT_URL = "http://127.0.0.1:7821/event";
/**
 * Posts a Salem event to the local Axum HTTP server.
 * Fails silently if Salem's desktop app isn't running.
 */
async function postSalemEvent(type) {
    try {
        await fetch(SALEM_EVENT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_type: type }),
        });
    }
    catch {
        // Salem's app isn't running — fail silently
    }
}
// Listen for messages from the content script and route them to postSalemEvent.
// Content scripts cannot fetch localhost directly in MV3, so they send a message
// to the background service worker which has host_permissions for 127.0.0.1.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "salemEvent") {
        postSalemEvent(message.type).then(() => sendResponse({ ok: true }));
        // Return true to indicate we will call sendResponse asynchronously
        return true;
    }
});
