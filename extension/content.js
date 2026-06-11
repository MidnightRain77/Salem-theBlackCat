"use strict";
/**
 * Salem – Salem Connector: Content Script
 *
 * Monitors LeetCode and InterviewBit pages for submission results
 * using MutationObserver. Routes events through the background service
 * worker via chrome.runtime.sendMessage (content scripts can't fetch
 * localhost directly in Manifest V3).
 */
// ─── Messaging ────────────────────────────────────────────────────────────────
function sendSalemEvent(type) {
    chrome.runtime.sendMessage({ action: "salemEvent", type });
}
// ─── Debounce ─────────────────────────────────────────────────────────────────
let lastTriggerTime = 0;
const DEBOUNCE_MS = 3000;
function debounced(fn) {
    const now = Date.now();
    if (now - lastTriggerTime < DEBOUNCE_MS)
        return;
    lastTriggerTime = now;
    fn();
}
// ─── LeetCode Detection ──────────────────────────────────────────────────────
const LEETCODE_ACCEPTED = ["accepted"];
const LEETCODE_REJECTED = ["wrong answer", "runtime error", "time limit exceeded"];
function checkLeetCodeResult(text) {
    const lower = text.toLowerCase();
    if (LEETCODE_ACCEPTED.some((kw) => lower.includes(kw))) {
        debounced(() => sendSalemEvent("celebrate"));
    }
    else if (LEETCODE_REJECTED.some((kw) => lower.includes(kw))) {
        debounced(() => sendSalemEvent("disappoint"));
    }
}
function observeLeetCode() {
    // Watch for the submission result element to appear or change
    const observer = new MutationObserver(() => {
        const resultEl = document.querySelector('[data-e2e-locator="submission-result"]');
        if (resultEl && resultEl.textContent) {
            checkLeetCodeResult(resultEl.textContent);
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}
// ─── InterviewBit Detection ──────────────────────────────────────────────────
const IB_SELECTORS = [".submitted", ".result-container", ".snackbar"];
const IB_ACCEPTED = ["correct", "accepted"];
const IB_REJECTED = ["wrong", "incorrect"];
function checkInterviewBitResult(text) {
    const lower = text.toLowerCase();
    if (IB_ACCEPTED.some((kw) => lower.includes(kw))) {
        debounced(() => sendSalemEvent("celebrate"));
    }
    else if (IB_REJECTED.some((kw) => lower.includes(kw))) {
        debounced(() => sendSalemEvent("disappoint"));
    }
}
function observeInterviewBit() {
    const observer = new MutationObserver(() => {
        for (const selector of IB_SELECTORS) {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
                if (el.textContent) {
                    checkInterviewBitResult(el.textContent);
                }
            });
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}
// ─── Site Detection & Initialization ─────────────────────────────────────────
function isLeetCode() {
    return window.location.hostname === "leetcode.com";
}
function isInterviewBit() {
    return window.location.hostname === "www.interviewbit.com";
}
function init() {
    if (isLeetCode()) {
        observeLeetCode();
    }
    else if (isInterviewBit()) {
        observeInterviewBit();
    }
}
// Run on DOMContentLoaded (for initial page loads)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
}
else {
    // DOM is already ready (script injected after load, or SPA navigation)
    init();
}
