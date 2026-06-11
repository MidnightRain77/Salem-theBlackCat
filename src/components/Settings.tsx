import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { load } from "@tauri-apps/plugin-store";

/** Persisted settings shape — matches SPEC.md */
interface SalemSettings {
  soundEnabled: boolean;
  startOnLogin: boolean;
  catSize: number; // 0.5 – 1.5
}

const DEFAULT_SETTINGS: SalemSettings = {
  soundEnabled: false,
  startOnLogin: false,
  catSize: 1.0,
};

const STORE_KEY = "salem-settings";

/**
 * Settings — A clean, minimal settings panel rendered inside the secondary
 * Tauri window (detected via `?window=settings` URL param).
 *
 * All settings are persisted with tauri-plugin-store and emit a
 * "settings:updated" Tauri event on every change so Salem.tsx can react.
 */
export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SalemSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load settings from store on mount
  useEffect(() => {
    (async () => {
      try {
        const store = await load("salem-settings.json", { autoSave: true, defaults: {} });
        const saved = await store.get<SalemSettings>(STORE_KEY);
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
      setLoaded(true);
    })();
  }, []);

  // Persist and emit whenever settings change (skip the initial load)
  const persist = useCallback(async (next: SalemSettings) => {
    try {
      const store = await load("salem-settings.json", { autoSave: true, defaults: {} });
      await store.set(STORE_KEY, next);
      await store.save();
      await emit("settings:updated", next);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<SalemSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const handleReset = useCallback(async () => {
    try {
      await invoke("reset_position");
    } catch (err) {
      console.error("Failed to reset position:", err);
    }
  }, []);

  if (!loaded) return null;

  return (
    <div style={styles.root}>
      <h2 style={styles.title}>Salem Settings</h2>

      {/* ─── Sound effects toggle ─── */}
      <label style={styles.row}>
        <span style={styles.label}>Enable sound effects</span>
        <input
          type="checkbox"
          checked={settings.soundEnabled}
          onChange={(e) => update({ soundEnabled: e.target.checked })}
          style={styles.checkbox}
        />
      </label>

      {/* ─── Start on login toggle ─── */}
      <label style={styles.row}>
        <span style={styles.label}>Start Salem on system login</span>
        <input
          type="checkbox"
          checked={settings.startOnLogin}
          onChange={(e) => update({ startOnLogin: e.target.checked })}
          style={styles.checkbox}
        />
      </label>

      {/* ─── Cat size slider ─── */}
      <div style={styles.sliderGroup}>
        <span style={styles.label}>Cat size</span>
        <div style={styles.sliderRow}>
          <input
            type="range"
            min={50}
            max={150}
            value={Math.round(settings.catSize * 100)}
            onChange={(e) =>
              update({ catSize: parseInt(e.target.value, 10) / 100 })
            }
            style={styles.slider}
          />
          <span style={styles.sliderValue}>
            {Math.round(settings.catSize * 100)}%
          </span>
        </div>
      </div>

      {/* ─── Reset position button ─── */}
      <button onClick={handleReset} style={styles.button}>
        Reset position to corner
      </button>

      {/* ─── Version ─── */}
      <p style={styles.version}>Salem v1.0.0</p>
    </div>
  );
};

/* ─── Inline styles ─── */

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
    boxSizing: "border-box",
    background: "#1e1e1e",
    color: "#e0e0e0",
    userSelect: "none",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#ffffff",
    letterSpacing: "0.3px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    padding: "6px 0",
  },
  label: {
    fontSize: "13px",
    color: "#c8c8c8",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#a8c24a",
    cursor: "pointer",
  },
  sliderGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "6px 0",
  },
  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  slider: {
    flex: 1,
    accentColor: "#a8c24a",
    cursor: "pointer",
  },
  sliderValue: {
    fontSize: "12px",
    fontVariantNumeric: "tabular-nums",
    color: "#888",
    minWidth: "38px",
    textAlign: "right" as const,
  },
  button: {
    padding: "8px 16px",
    border: "1px solid #444",
    borderRadius: "6px",
    background: "#2a2a2a",
    color: "#e0e0e0",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background 0.15s",
    marginTop: "4px",
  },
  version: {
    marginTop: "auto",
    fontSize: "11px",
    color: "#666",
    textAlign: "center" as const,
  },
};
