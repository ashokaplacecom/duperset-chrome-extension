/***
 * This file injects the sidebar onto the superset interface.
 */
export function createSidebar({ onVerifyClick, onMajorMinorClick }) {
  let sidebar = document.getElementById("duperset-sidebar");

  const api = {
    open: () => (sidebar.style.right = "0px"),
    close: () => (sidebar.style.right = "-320px"),
    toggle: () => {
      sidebar.style.right =
        sidebar.style.right === "0px" ? "-320px" : "0px";
    }
  };

  if (sidebar) return api;

  sidebar = document.createElement("div");
  sidebar.id = "duperset-sidebar";

  Object.assign(sidebar.style, {
    position: "fixed",
    top: "0",
    right: "-320px",
    width: "300px",
    height: "100%",
    backgroundColor: "white",
    color: "#3B32B3",
    boxShadow: "-2px 0px 10px rgba(0, 0, 0, 0.1)",
    transition: "right 0.3s ease-in-out",
    zIndex: "9999",
    padding: "20px",
    borderRadius: "12px 0 0 12px",
    overflowY: "auto"
  });

  // ==================== CLOSE BUTTON ====================
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "✖";

  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "15px",
    right: "15px",
    border: "none",
    background: "none",
    color: "#3B32B3",
    fontSize: "20px",
    cursor: "pointer"
  });

  closeBtn.onclick = () => {
    sidebar.style.right = "-320px";
  };

  sidebar.appendChild(closeBtn);

  // ==================== CONTENT ====================
  const content = document.createElement("div");

  content.innerHTML = `
    <div style="text-align:center;">
      <h2 style="margin-bottom:6px;">Duperset</h2>
      <p style="font-size:13px; opacity:0.7;">Brought to you by <strong>Placecom</strong></p>
    </div>

    <hr style="margin:12px 0;" />

    <button id="duperset-verify-btn" class="duperset-btn">
      Verify My Profile
    </button>

    <button id="duperset-mm-btn" class="duperset-btn">
      Request Major Minor Change
    </button>

    <button class="duperset-btn">
      View Latest Request
    </button>

    <button class="duperset-btn">
      View Request History
    </button>

    <hr style="margin:12px 0;" />

    <button class="duperset-btn">
      Visit our Website!
    </button>
    
    <button class="duperset-btn">
      Access our Resources
    </button>
  `;

  sidebar.appendChild(content);
  document.body.appendChild(sidebar);

  // ==================== HAMBURGER BUTTON ====================
  const menuButton = document.createElement("button");
  menuButton.id = "duperset-menu-btn";
  menuButton.innerHTML = "☰";

  Object.assign(menuButton.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#3B32B3",
    color: "white",
    fontSize: "20px",
    border: "none",
    borderRadius: "20px",
    width: "50px",
    height: "50px",
    cursor: "pointer",
    zIndex: "10001",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)"
  });

  menuButton.onclick = () => {
    const isOpen = sidebar.style.right === "0px";
    sidebar.style.right = isOpen ? "-320px" : "0px";
  };

  document.body.appendChild(menuButton);

  // ==================== EVENT HOOKS ====================
  const verifyBtn = document.getElementById("duperset-verify-btn");
  const mmBtn = document.getElementById("duperset-mm-btn");

  verifyBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    onVerifyClick?.();
  });

  mmBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    onMajorMinorClick?.();
  });

  // ==================== PUBLIC API ====================
  return api;
}