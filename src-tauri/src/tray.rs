use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager,
};

/// Visibility state tracked across tray toggle actions.
pub struct WindowVisible(pub Mutex<bool>);

/// Generate a 32×32 RGBA cat-silhouette icon at compile time.
///
/// The icon is a minimal black circle with two triangular ear bumps on a
/// transparent background — just enough to read as "cat" at 32 px.
fn generate_cat_icon() -> Vec<u8> {
    const SIZE: usize = 32;
    let mut rgba = vec![0u8; SIZE * SIZE * 4];

    let cx = 16.0_f64;
    let cy = 18.0_f64;
    let r = 11.0_f64;

    for y in 0..SIZE {
        for x in 0..SIZE {
            let px = x as f64 + 0.5;
            let py = y as f64 + 0.5;

            let mut inside = false;

            // Main head circle
            let dx = px - cx;
            let dy = py - cy;
            if dx * dx + dy * dy <= r * r {
                inside = true;
            }

            // Left ear — triangle roughly at (7,4)-(4,12)-(12,12)
            if is_in_triangle(px, py, 6.0, 3.0, 3.0, 13.0, 12.0, 13.0) {
                inside = true;
            }

            // Right ear — triangle roughly at (25,4)-(20,12)-(28,12)
            if is_in_triangle(px, py, 26.0, 3.0, 20.0, 13.0, 29.0, 13.0) {
                inside = true;
            }

            if inside {
                let idx = (y * SIZE + x) * 4;
                // #1a1a1a fully opaque
                rgba[idx] = 0x1a;
                rgba[idx + 1] = 0x1a;
                rgba[idx + 2] = 0x1a;
                rgba[idx + 3] = 0xff;
            }
        }
    }

    rgba
}

/// Point-in-triangle test (barycentric method).
fn is_in_triangle(
    px: f64,
    py: f64,
    x1: f64,
    y1: f64,
    x2: f64,
    y2: f64,
    x3: f64,
    y3: f64,
) -> bool {
    let denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if denom.abs() < 1e-10 {
        return false;
    }
    let a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
    let b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
    let c = 1.0 - a - b;
    a >= 0.0 && b >= 0.0 && c >= 0.0
}

/// Build and register the system-tray icon and menu.
///
/// Must be called inside the Tauri `.setup()` closure.
pub fn setup_tray(app: &mut tauri::App) -> tauri::Result<()> {
    // Manage window-visibility state (starts visible)
    app.manage(WindowVisible(Mutex::new(true)));

    // --- icon ---
    let icon_rgba = generate_cat_icon();
    let icon = Image::new_owned(icon_rgba, 32, 32);

    // --- menu items ---
    let label = MenuItemBuilder::new("Salem")
        .enabled(false)
        .build(app)?;

    let toggle = MenuItemBuilder::new("Show / Hide Salem")
        .id("toggle")
        .build(app)?;

    let settings = MenuItemBuilder::new("Settings...")
        .id("settings")
        .build(app)?;

    let quit = MenuItemBuilder::new("Quit")
        .id("quit")
        .build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&label)
        .separator()
        .item(&toggle)
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    // --- tray ---
    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("Salem")
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "toggle" => {
                    if let Some(win) = app.get_webview_window("main") {
                        let state = app.state::<WindowVisible>();
                        let mut visible = state.0.lock().unwrap();
                        if *visible {
                            let _ = win.hide();
                            *visible = false;
                        } else {
                            let _ = win.show();
                            let _ = win.set_focus();
                            *visible = true;
                        }
                    }
                }
                "settings" => {
                    let _ = super::open_settings_window(app.clone());
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
