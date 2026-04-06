export function injectStyles() {
    if (document.getElementById("duperset-styles")) return;

    const style = document.createElement("style");
    style.id = "duperset-styles";

    style.textContent = `
    .duperset-btn {
      display: block;
      background: #f4f5ff;
      color: #2e2b91;
      padding: 12px 20px;
      margin: 12px 0;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      border: 1px solid rgba(46, 43, 145, 0.2);
      cursor: pointer;
    }

    .duperset-btn:hover {
      background: #e8e9ff;
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: none;
      justify-content: center;
      align-items: center;
      color: #3B32B3;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .modal-content {
      background: white;
      padding: 32px;
      border-radius: 20px;
      position: relative;
      width: 420px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-close-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #3B32B3;
      opacity: 0.6;
    }

    .modal-close-btn:hover {
      opacity: 1;
    }

    .verify-modal .modal-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
      text-align: center;
    }

    .verify-modal label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .verify-modal input, .verify-modal textarea {
      width: 100%;
      padding: 12px;
      margin-bottom: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
    }

    .verify-modal button {
      width: 100%;
      padding: 12px;
      background: #3B32B3;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 10px;
    }

    .verify-modal button:hover {
      background: #2e2b91;
    }

    .verify-modal .step {
      display: none;
    }

    .verify-modal .step.active {
      display: block;
    }

    #verify-message {
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: none;
    }

    #verify-message:not(:empty) {
      display: block;
    }

    #verify-message.success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    #verify-message.error {
      background-color: #ffebee;
      color: #c62828;
    }
  `;

    document.head.appendChild(style);
}