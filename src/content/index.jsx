/***
 * Main entrypoint for the content script.
 *
 * - The sidebar is still vanilla DOM (no React needed for simple buttons).
 * - The verify modal and major/minor modal are React components rendered into a dedicated root.
 * - Communication between the two: the React App exposes { openVerify, openMajorMinor, … }
 *   via a callback, which the sidebar hooks into.
 */
import { createRoot } from "react-dom/client";
import App from "./App";
import { createSidebar } from "./ui/sidebar";

// Create a container for the React tree
const reactRoot = document.createElement("div");
reactRoot.id = "duperset-react-root";
document.body.appendChild(reactRoot);

// We need a mutable reference the sidebar can close over
let reactApi = {};

// Render React
const root = createRoot(reactRoot);
root.render(
  <App onMounted={(api) => { reactApi = api; }} />
);

// Create the vanilla DOM sidebar — wire buttons to the React API
const sidebar = createSidebar({
  onVerifyClick:      () => reactApi.openVerify?.(),
  onMajorMinorClick:  () => reactApi.openMajorMinor?.(),
});