import { Salem } from "./components/Salem";
import { Settings } from "./components/Settings";
import "./App.css";

/**
 * App — Root component that renders either the Salem desktop pet or the
 * Settings panel based on the URL query parameter `?window=settings`.
 */
function App() {
  const params = new URLSearchParams(window.location.search);
  const isSettings = params.get("window") === "settings";

  if (isSettings) {
    return <Settings />;
  }

  return (
    <div id="salem-container">
      <Salem />
    </div>
  );
}

export default App;
