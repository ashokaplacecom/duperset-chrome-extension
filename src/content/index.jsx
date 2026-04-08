/***
 * Main entrypoint for the content script.
 * Now fully React-based.
 */
import { createRoot } from "react-dom/client";
import App from "./App";

// Create a container for the React tree
const reactRoot = document.createElement("div");
reactRoot.id = "duperset-react-root";
document.body.appendChild(reactRoot);

// Render React
const root = createRoot(reactRoot);
root.render(
  <App onMounted={(api) => { window.duperset = api; }} />
);