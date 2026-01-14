const apiKey = "your-secret-api-key";
const baseUrlScript = "https://script.google.com/macros/s/AKfycbw0jr5_om4qiSoHt1SVX2eflnBjMaHEcNDvJb6PhE1Ea7Wi1bEwxNStuCbUQZR22KVnRA/exec";

// ==================== API CALLS ====================

function sendOTP(email) {
  const params = new URLSearchParams({
    action: "sendOTP",
    key: apiKey,
    email: email
  });

  return fetch(baseUrlScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  })
    .then(res => res.json())
    .catch(err => {
      console.error("sendOTP fetch error:", err);
      return { success: false, message: "Network error" };
    });
}

function verifyOTP(email, otp, message) {
  const params = new URLSearchParams({
    action: "verifyOTP",
    key: apiKey,
    email: email,
    otp: otp,
    message: message || ""
  });

  return fetch(baseUrlScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  })
    .then(res => res.json())
    .catch(err => {
      console.error("verifyOTP fetch error:", err);
      return { success: false, message: "Network error" };
    });
}


// ==================== SIDEBAR INJECTION ====================
function injectSidebar() {
  if (document.getElementById("my-sidebar")) return;

  // Sidebar
  let sidebar = document.createElement("div");
  sidebar.id = "my-sidebar";
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
    overflowY: "auto",
  });

  let closeBtn = document.createElement("button");
  closeBtn.innerHTML = "✖";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "15px",
    right: "15px",
    border: "none",
    background: "none",
    color: "#3B32B3",
    fontSize: "20px",
    cursor: "pointer",
  });
  closeBtn.addEventListener("click", () => {
    sidebar.style.right = "-320px";
    closeModal(modal1);
    closeModal(modal2);
  });
  sidebar.appendChild(closeBtn);

  // Sidebar content
  let contentHTML = `
        <div id="chrome-extension-title">
            <h2 id="chrome-extension-h2">Duperset</h2>
        </div>
        <hr style="border: 0; height: 1px; background: #3B32B3; margin: 10px 0;" />
        <p id="chrome-extension-branding">Brought to you by <strong>Placecom</strong></p>
        <a href="#" id="verify-button" class="duperset-button">Verify My Profile</a>
        <a href="#" id="major-minor-button" class="duperset-button">Request Major Minor Change</a>
        <a href="/students/external-opportunities" class="duperset-button">External Opportunities</a>
        <br />
        <hr style="border: 0; height: 1px; background: #3B32B3; margin: 10px 0;" />
        <br />
        <p id="chrome-extension-branding">Coming Soon</p>
        <a href="#" class="duperset-button">Deadline Calendar</a>
        <a href="#" class="duperset-button">FAQs</a>
        `
    ;
  let contentDiv = document.createElement("div");
  contentDiv.innerHTML = contentHTML;
  sidebar.appendChild(contentDiv);

  document.body.appendChild(sidebar);

  // Hamburger Button
  let menuButton = document.createElement("button");
  menuButton.id = "my-hamburger-button";
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
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
  });
  menuButton.addEventListener("click", () => {
    const isOpen = sidebar.style.right === "0px";
    sidebar.style.right = isOpen ? "-320px" : "0px";
    if (isOpen) {
      closeModal(modal1);
      closeModal(modal2);
    }
  });
  document.body.appendChild(menuButton);

  // ==================== MODAL 1 – Verify My Profile ====================
  // Modal 1 - Verify My Profile
  let modal1 = document.createElement("div");
  modal1.classList.add("modal-overlay");
  modal1.id = "modal1";

  let modal1Content = document.createElement("div");
  modal1Content.classList.add("modal-content");

  // Close button
  let closeBtn1 = document.createElement("button");
  closeBtn1.className = "modal-close-btn";
  closeBtn1.innerHTML = "✖";
  closeBtn1.addEventListener("click", () => closeModal(modal1));

  modal1Content.innerHTML = `
<div class="verify-modal">
  <h1 class="modal-title">Verify Your Email</h1>
  <div id="verify-message"></div>
  
  <div class="step active" id="emailStep">
    <label for="verify-email">Your College Email</label>
    <input id="verify-email" type="email" placeholder="your.name_batch@ashoka.edu.in" />
    <button id="otpBtn">Send OTP</button>
  </div>

  <div class="step" id="otpStep">
    <label for="verify-otp">Enter OTP</label>
    <input id="verify-otp" type="text" maxlength="4" placeholder="4-digit code" />
    <label for="verify-message-box" style="margin-top:10px;display:block;">Message to PoC (optional)</label>
    <textarea id="verify-message-box" rows="2" style="width:100%;margin-bottom:8px;resize:vertical;" placeholder="Add a message for your PoC (optional)"></textarea>
    <button id="verifyBtn">Verify & Submit</button>
    <a class="resend-link" id="resendLink">Didn’t get OTP? Resend</a>
  </div>
  </div>
`;

  modal1.appendChild(modal1Content);
  document.body.appendChild(modal1);
  modal1Content.appendChild(closeBtn1);




  let currentVerifyEmail = "";
  function showVerifyStep(stepId) {
    ["emailStep", "otpStep"].forEach(id => {
      document.getElementById(id).style.display = (id === stepId ? "block" : "none");
    });
  }

  function setVerifyMessage(msg, type) {
    const div = document.getElementById("verify-message");
    div.innerHTML = msg;
    div.className = type;
  }

  function disableBtn(btn, text) {
    btn.disabled = true;
    btn.innerText = text;
  }

  function enableBtn(btn, text) {
    btn.disabled = false;
    btn.innerText = text;
  }

  document.getElementById("otpBtn").onclick = () => {
    const email = document.getElementById("verify-email").value;
    const btn = document.getElementById("otpBtn");
    if (!email || !email.includes("@")) {
      setVerifyMessage("Please enter a valid email", "error");
      return;
    }

    disableBtn(btn, "Sending...");

    sendOTP(email).then(res => {
      if (res.success) {
        currentVerifyEmail = email;
        showVerifyStep("otpStep");
        setVerifyMessage("OTP sent to your email", "success");
      } else {
        setVerifyMessage(res.message || "Failed to send OTP", "error");
      }
      enableBtn(btn, "Send OTP");
    }).catch(() => {
      setVerifyMessage("Failed to connect", "error");
      enableBtn(btn, "Send OTP");
    });
  };

  document.getElementById("verifyBtn").onclick = () => {
    const otp = document.getElementById("verify-otp").value;
    const message = document.getElementById("verify-message-box").value;
    const btn = document.getElementById("verifyBtn");

    if (!otp || otp.length !== 4) {
      setVerifyMessage("Please enter a valid 4-digit OTP", "error");
      return;
    }

    disableBtn(btn, "Verifying...");

    verifyOTP(currentVerifyEmail, otp, message).then(res => {
      if (res.success) {
        setVerifyMessage(res.message || "Verified successfully!", "success-submitted");

        // Keep button disabled and close modal after delay
        setTimeout(() => {
          document.getElementById("verify-email").value = "";
          document.getElementById("verify-otp").value = "";
          document.getElementById("verify-message-box").value = "";
          showVerifyStep("emailStep");
          document.getElementById("modal1").style.display = "none";
        }, 3000);
      } else {
        setVerifyMessage(res.message || "Verification failed", "error");
        enableBtn(btn, "Verify & Submit");  // re-enable only on failure
      }
    }).catch(() => {
      setVerifyMessage("Failed to connect", "error");
      enableBtn(btn, "Verify & Submit");
    });
  };

  document.getElementById("resendLink").onclick = () => {
    const btn = document.getElementById("resendLink");
    if (!currentVerifyEmail) return;
    btn.innerText = "Sending...";
    sendOTP(currentVerifyEmail).then(res => {
      setVerifyMessage(res.success ? "OTP resent" : res.message, res.success ? "success" : "error");
      btn.innerText = "Didn’t get OTP? Resend";
    }).catch(() => {
      setVerifyMessage("Failed to resend OTP", "error");
      btn.innerText = "Didn’t get OTP? Resend";
    });
  };


  // ==================== END MODAL 1 ====================



  // ==================== MODAL 2 – Major/Minor Change ====================
  let modal2 = document.createElement("div");
  modal2.classList.add("modal-overlay");
  modal2.id = "modal2";

  let modal2Content = document.createElement("div");
  modal2Content.classList.add("modal2-content");

  let closeBtn2 = document.createElement("button");
  closeBtn2.className = "modal-close-btn";
  closeBtn2.innerHTML = "✖";
  closeBtn2.addEventListener("click", () => closeModal(modal2));

  let iframe2 = document.createElement("iframe");
  iframe2.src = "https://script.google.com/macros/s/AKfycbzy6oo0GFxrQVH_ouol-NyuUV-S6MRvUvxVZ0y1HBWFz1l3murt2s1FbPplsc47EfW1oQ/exec";
  iframe2.className = "modal-iframe";

  modal2Content.appendChild(closeBtn2);
  modal2Content.appendChild(iframe2);
  modal2.appendChild(modal2Content);
  document.body.appendChild(modal2);

  // Modal helpers
  function openModal(modal) {
    modal.style.display = "flex";
  }
  function closeModal(modal) {
    modal.style.display = "none";
  }

  // Button listeners
  document.getElementById("verify-button").addEventListener("click", (event) => {
    event.preventDefault();
    openModal(modal1);
    closeModal(modal2);
  });

  document.getElementById("major-minor-button").addEventListener("click", (event) => {
    event.preventDefault();
    openModal(modal2);
    closeModal(modal1);
  });

  // ===== STYLES =====
  let style = document.createElement("style");
  style.innerHTML = `
  /* Main button: subtle, calm, but polished */
  .duperset-button {
    display: block;
    background: #f4f5ff;
    color: #2e2b91;
    padding: 12px 20px;
    margin: 12px 0;
    border-radius: 10px;
    text-decoration: none;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s ease;
    border: 1px solid rgba(46, 43, 145, 0.2);
  }

  .duperset-button:hover {
    background: #e8e9ff;
    border-color: rgba(46, 43, 145, 0.3);
  }

  #chrome-extension-title {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin-bottom: 6px;
  }

  #chrome-extension-h2 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.6px;
    color: rgb(67, 57, 209);
    padding-bottom: 2px;
  }

  #chrome-extension-branding {
    font-size: 13px;
    font-weight: 500;
    color: rgb(72, 67, 199);
    text-align: center;
    font-style: italic;
    margin-bottom: 20px;
    letter-spacing: 0.5px;
    opacity: 0.75;
    position: relative;
  }

  #chrome-extension-branding::after {
    content: " • v3 is live";
    color: rgb(101, 84, 233);
    font-style: normal;
    font-weight: 500;
    margin-left: 4px;
    opacity: 0.9;
  }

  /* Modal overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  }

  .modal-content,
  .modal2-content {
    background: white;
    color: #3B32B3;
    border-radius: 12px;
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
    position: relative;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    box-sizing: border-box;
  }

  .modal-content {
    width: 420px;
    height: auto;
    max-height: 90vh;
  }

  .modal2-content {
    width: 900px;
    height: 90vh;
  }

  .modal-close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    border: none;
    background: none;
    color: #3B32B3;
    font-size: 20px;
    cursor: pointer;
    z-index: 1000;
  }

  .modal-iframe {
    flex-grow: 1;
    border: none;
    margin-top: 50px;
    border-radius: 0 0 12px 12px;
  }

  .verify-modal {
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  padding: 30px;
  border-radius: 16px;
  background: white;
  font-family: Arial, sans-serif;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;   /* ✅ CRUCIAL */
  box-sizing: border-box;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.07);
  margin: 0 auto;        /* ✅ horizontally center */
}

.verify-modal * {
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-x: hidden;
}

/* Optional: limit input width if needed */
.verify-modal input,.verify-modal textarea,
.verify-modal button {
  width: 100%;
  max-width: 100%;
}

/* Fix body scroll when modal is open */
body.modal-open {
  overflow: hidden;
}


  .modal-header-bar {
    height: 5px;
    background: linear-gradient(90deg, #f72585, #1a237e);
    border-radius: 8px 8px 0 0;
  }

 .modal-title {
  text-align: center;
  font-size: 20px;
  color: rgb(4, 4, 5);
  margin-bottom: 15px;

  width: 100%;
  height: auto;                /* ✅ Let it grow naturally */
  overflow: hidden;            /* ✅ Hide accidental overflow */
  white-space: normal;         /* ✅ Allow wrapping */
  word-break: break-word;      /* ✅ Break long words if needed */
  box-sizing: border-box;      /* ✅ Consistent sizing */
}


  .logo img {
    display: block;
    margin: 0 auto;
    width: 60px;
    height: 60px;
  }

  #verify-message {
    padding: 10px;
    margin-bottom: 10px;
    font-weight: bold;
    text-align: center;
    font-size: 13px;
    border-radius: 8px;
  }

  #verify-message.success {
    background-color: #e3f7fd;
    color: #0077b6;
    border-left: 4px solid #0077b6;
  }

  #verify-message.error {
    background-color: #fde3f0;
    color: #f72585;
    border-left: 4px solid #f72585;
  }

  #verify-message.success-submitted {
    background-color: rgb(216, 243, 227);
    color: rgb(57, 97, 46);
    border-left: 4px solid rgb(57, 97, 46);
  }

  .step {
    display: none;
  }

  .step.active {
    display: block;
  }

  .verify-modal input,.verify-modal textarea,
  .verify-modal button,
  .verify-modal .resend-link {
    width: 100%;
    box-sizing: border-box;
  }

  .verify-modal input,.verify-modal textarea {
    padding: 12px 14px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f8f9fa;
  }

  .verify-modal button {
    background: #1a237e;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
  }

  .verify-modal button:disabled {
    background: #c4c4c4;
    cursor: not-allowed;
  }

  .resend-link {
    display: block;
    text-align: center;
    margin-top: 10px;
    color: #1a237e;
    font-size: 13px;
    cursor: pointer;
  }

  .resend-link:hover {
    text-decoration: underline;
  }
`;

  document.head.appendChild(style);
}

// Inject sidebar on load
injectSidebar();
