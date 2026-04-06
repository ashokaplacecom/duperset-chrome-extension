/***
 * This file handles the modal UI for the verifications feature.
 */
import { sendOTP, verifyOTP } from "../api/client";

export function createVerifyModal() {
    let modal = document.getElementById("duperset-verify-modal");

    if (modal) {
        return {
            open: () => (modal.style.display = "flex"),
            close: () => (modal.style.display = "none")
        };
    }

    modal = document.createElement("div");
    modal.classList.add("modal-overlay");
    modal.id = "duperset-verify-modal";
    modal.style.display = "none"; // Hide by default

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close-btn";
    closeBtn.innerHTML = "✖";
    closeBtn.onclick = () => close();

    modalContent.innerHTML = `
    <div class="verify-modal">
      <h1 class="modal-title">Verify Your Email [DEV]</h1>
      <div id="verify-message"></div>

      <div class="step active" id="emailStep">
        <label>Your College Email</label>
        <input id="verify-email" type="email" placeholder="your.name@ashoka.edu.in" />
        <button id="otpBtn">Send OTP</button>
      </div>

      <div class="step" id="otpStep">
        <div style="background-color:#ffebee;color:#c62828;padding:10px;border-radius:4px;margin-bottom:15px;font-size:13px;">
          <strong>IMP:</strong> You can raise up to 3 emergency requests.
        </div>

        <label>Enter OTP</label>
        <input id="verify-otp" type="text" maxlength="4" />

        <div id="normal-message-section">
          <textarea id="verify-message-box" placeholder="Message (optional)"></textarea>
        </div>

        <div id="emergency-message-section" style="display:none;">
          <input id="emergency-company" placeholder="Company Name" />
          <textarea id="emergency-reason" placeholder="Reason"></textarea>
        </div>

        <button id="emergencyBtn">Submit as Emergency</button>
        <button id="verifyBtn">Verify & Submit</button>
        <a id="resendLink">Resend OTP</a>
      </div>
    </div>
  `;

    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // ==================== STATE ====================
    let currentEmail = "";

    // ==================== HELPERS ====================
    function showStep(step) {
        ["emailStep", "otpStep"].forEach(id => {
            document.getElementById(id).style.display =
                id === step ? "block" : "none";
        });
    }

    function setMessage(msg, type) {
        const div = document.getElementById("verify-message");
        div.innerHTML = msg;
        div.className = type;
    }

    function disable(btn, text) {
        btn.disabled = true;
        btn.innerText = text;
    }

    function enable(btn, text) {
        btn.disabled = false;
        btn.innerText = text;
    }

    // ==================== HANDLERS ====================

    document.getElementById("otpBtn").onclick = async () => {
        const email = document.getElementById("verify-email").value;
        const btn = document.getElementById("otpBtn");

        if (!email.includes("@")) {
            setMessage("Invalid email", "error");
            return;
        }

        disable(btn, "Sending...");

        const res = await sendOTP(email);

        if (res.success) {
            currentEmail = email;
            showStep("otpStep");
            setMessage("OTP sent", "success");
        } else {
            setMessage(res.message || "Failed", "error");
        }

        enable(btn, "Send OTP");
    };

    document.getElementById("verifyBtn").onclick = async () => {
        const otp = document.getElementById("verify-otp").value;
        const message = document.getElementById("verify-message-box").value;
        const btn = document.getElementById("verifyBtn");

        if (otp.length !== 4) {
            setMessage("Invalid OTP", "error");
            return;
        }

        disable(btn, "Verifying...");

        const res = await verifyOTP({
            email: currentEmail,
            otp,
            message,
            isEmergency: false
        });

        if (res.success) {
            setMessage("Verified!", "success-submitted");

            setTimeout(() => {
                close();
                reset();
            }, 2000);
        } else {
            setMessage(res.message, "error");
            enable(btn, "Verify & Submit");
        }
    };

    document.getElementById("emergencyBtn").onclick = async () => {
        const btn = document.getElementById("emergencyBtn");
        const otp = document.getElementById("verify-otp").value;
        const company = document.getElementById("emergency-company").value;
        const reason = document.getElementById("emergency-reason").value;

        if (!otp || !company || !reason) {
            setMessage("Fill all fields", "error");
            return;
        }

        disable(btn, "Submitting...");

        const message = `Company: ${company} | ${reason}`;

        const res = await verifyOTP({
            email: currentEmail,
            otp,
            message,
            isEmergency: true
        });

        if (res.success) {
            setMessage("Submitted!", "success-submitted");

            setTimeout(() => {
                close();
                reset();
            }, 2000);
        } else {
            setMessage(res.message, "error");
            enable(btn, "Submit as Emergency");
        }
    };

    document.getElementById("resendLink").onclick = async () => {
        if (!currentEmail) return;

        const res = await sendOTP(currentEmail);
        setMessage(res.success ? "OTP resent" : "Failed", "success");
    };

    // ==================== CONTROL ====================

    function open() {
        modal.style.display = "flex";
    }

    function close() {
        modal.style.display = "none";
    }

    function reset() {
        document.getElementById("verify-email").value = "";
        document.getElementById("verify-otp").value = "";
        showStep("emailStep");
    }

    return { open, close };
}