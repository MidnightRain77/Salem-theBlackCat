use rdev::{listen, EventType};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::Emitter;

/// Spawns a background thread that listens for global keyboard events via rdev.
///
/// On each `KeyPress`, emits the Tauri event `"input:keydown"` to all frontend
/// windows, debounced to at most once every 50ms to avoid flooding React.
///
/// If rdev fails to start (e.g. missing Accessibility permissions on macOS),
/// emits `"input:permission_error"` to the frontend and logs to stderr.
pub fn start_input_monitor(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let last_emit: Arc<Mutex<Instant>> = Arc::new(Mutex::new(
            Instant::now() - std::time::Duration::from_millis(100),
        ));

        // Clone the handle so we still have one after listen() consumes the closure
        let error_handle = app_handle.clone();

        let result = listen(move |event| {
            if let EventType::KeyPress(_) = event.event_type {
                let mut last = last_emit.lock().unwrap();
                if last.elapsed() >= std::time::Duration::from_millis(50) {
                    *last = Instant::now();
                    // Drop the lock before emitting to avoid holding it during IPC
                    drop(last);
                    let _ = app_handle.emit("input:keydown", ());
                }
            }
        });

        if let Err(error) = result {
            eprintln!("[input_monitor] rdev::listen failed: {:?}", error);
            let _ = error_handle.emit("input:permission_error", ());
        }
    });
}
