// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod input_monitor;
mod event_server;
mod tray;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|_app| {
            // Transparency is configured via tauri.conf.json:
            //   "transparent": true  +  "macOSPrivateApi": true
            // and CSS: background: transparent
            // No additional runtime setup needed.
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
