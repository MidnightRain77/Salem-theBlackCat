// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod event_server;
mod input_monitor;
mod tray;

/// Shows the pre-configured "settings" window.
/// Called from the tray menu and can also be invoked from the frontend.
#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    if let Some(win) = app.get_webview_window("settings") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Resets Salem's position to the bottom-right corner of the primary monitor.
#[tauri::command]
fn reset_position(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    if let Some(win) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = win.primary_monitor() {
            let screen = monitor.size();
            let scale = monitor.scale_factor();
            let logical_w = screen.width as f64 / scale;
            let logical_h = screen.height as f64 / scale;
            let x = logical_w - 220.0;
            let y = logical_h - 400.0;
            win.set_position(tauri::LogicalPosition::new(x, y))
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_settings_window,
            reset_position
        ])
        .setup(|app| {
            // Transparency is configured via tauri.conf.json:
            //   "transparent": true  +  "macOSPrivateApi": true
            // and CSS: background: transparent

            // Start global keyboard monitor (rdev) on a background thread
            input_monitor::start_input_monitor(app.handle().clone());

            // Start local HTTP event server (Axum) for Chrome extension events
            tokio::spawn(event_server::start_event_server(app.handle().clone()));

            // Set up system tray icon and menu
            tray::setup_tray(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
