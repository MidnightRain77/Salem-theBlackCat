import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { SalemState } from "./useSalemState";

/**
 * useTauriEvents — Listens to Tauri events emitted from the Rust backend
 * and calls transitionTo to update Salem's state accordingly.
 *
 * Canonical event names (from SPEC.md):
 * - "input:keydown"   → TYPING
 * - "cat:celebrate"   → CELEBRATING
 * - "cat:disappoint"  → DISAPPOINTED
 * - "cat:startled"    → STARTLED
 */
export const useTauriEvents = (
  transitionTo: (s: SalemState) => void
): void => {
  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    const setup = async () => {
      const unlisten1 = await listen("input:keydown", () => {
        transitionTo("TYPING");
      });
      unlisteners.push(unlisten1);

      const unlisten2 = await listen("cat:celebrate", () => {
        transitionTo("CELEBRATING");
      });
      unlisteners.push(unlisten2);

      const unlisten3 = await listen("cat:disappoint", () => {
        transitionTo("DISAPPOINTED");
      });
      unlisteners.push(unlisten3);

      const unlisten4 = await listen("cat:startled", () => {
        transitionTo("STARTLED");
      });
      unlisteners.push(unlisten4);
    };

    setup();

    return () => {
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [transitionTo]);
};
