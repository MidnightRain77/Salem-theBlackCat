use axum::{
    extract::State,
    http::{HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{options, post},
    Json, Router,
};
use serde::Deserialize;
use tauri::Emitter;

#[derive(Deserialize)]
struct CatEvent {
    event_type: String,
}

/// Starts the local HTTP event server on 127.0.0.1:7821.
///
/// Exposes a single `POST /event` endpoint that accepts a JSON body with an
/// `event_type` field. Recognised values:
/// - `"celebrate"` → emits Tauri event `cat:celebrate`
/// - `"disappoint"` → emits Tauri event `cat:disappoint`
///
/// All other values return 400 Bad Request.
///
/// CORS headers are attached to every response so the Chrome extension can
/// POST from a `chrome-extension://` origin.
pub async fn start_event_server(app_handle: tauri::AppHandle) {
    let app = Router::new()
        .route("/event", post(handle_event))
        .route("/event", options(handle_preflight))
        .with_state(app_handle);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:7821")
        .await
        .expect("failed to bind event server to 127.0.0.1:7821");

    eprintln!("[event_server] listening on 127.0.0.1:7821");

    axum::serve(listener, app)
        .await
        .expect("event server crashed");
}

/// Handles POST /event — deserialises the body and emits the corresponding
/// Tauri event to all frontend windows.
async fn handle_event(
    State(app_handle): State<tauri::AppHandle>,
    Json(payload): Json<CatEvent>,
) -> impl IntoResponse {
    let result = match payload.event_type.as_str() {
        "celebrate" => {
            let _ = app_handle.emit("cat:celebrate", ());
            Ok(StatusCode::OK)
        }
        "disappoint" => {
            let _ = app_handle.emit("cat:disappoint", ());
            Ok(StatusCode::OK)
        }
        _ => Err(StatusCode::BAD_REQUEST),
    };

    let status = match result {
        Ok(s) => s,
        Err(s) => s,
    };

    let mut response = (status, "").into_response();
    response.headers_mut().insert(
        "Access-Control-Allow-Origin",
        HeaderValue::from_static("*"),
    );
    response
}

/// Handles OPTIONS /event — returns 200 with CORS preflight headers so the
/// Chrome extension can issue cross-origin POST requests.
async fn handle_preflight() -> impl IntoResponse {
    let mut response = StatusCode::OK.into_response();
    let headers = response.headers_mut();
    headers.insert(
        "Access-Control-Allow-Origin",
        HeaderValue::from_static("*"),
    );
    headers.insert(
        "Access-Control-Allow-Methods",
        HeaderValue::from_static("POST, OPTIONS"),
    );
    headers.insert(
        "Access-Control-Allow-Headers",
        HeaderValue::from_static("Content-Type"),
    );
    response
}
