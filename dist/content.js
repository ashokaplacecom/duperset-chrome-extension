function e({onVerifyClick:e,onMajorMinorClick:t}){let n=document.getElementById(`duperset-sidebar`),r={open:()=>n.style.right=`0px`,close:()=>n.style.right=`-320px`,toggle:()=>{n.style.right=n.style.right===`0px`?`-320px`:`0px`}};if(n)return r;n=document.createElement(`div`),n.id=`duperset-sidebar`,Object.assign(n.style,{position:`fixed`,top:`0`,right:`-320px`,width:`300px`,height:`100%`,backgroundColor:`white`,color:`#3B32B3`,boxShadow:`-2px 0px 10px rgba(0, 0, 0, 0.1)`,transition:`right 0.3s ease-in-out`,zIndex:`9999`,padding:`20px`,borderRadius:`12px 0 0 12px`,overflowY:`auto`});let i=document.createElement(`button`);i.innerHTML=`✖`,Object.assign(i.style,{position:`absolute`,top:`15px`,right:`15px`,border:`none`,background:`none`,color:`#3B32B3`,fontSize:`20px`,cursor:`pointer`}),i.onclick=()=>{n.style.right=`-320px`},n.appendChild(i);let a=document.createElement(`div`);a.innerHTML=`
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
  `,n.appendChild(a),document.body.appendChild(n);let o=document.createElement(`button`);o.id=`duperset-menu-btn`,o.innerHTML=`☰`,Object.assign(o.style,{position:`fixed`,bottom:`20px`,right:`20px`,background:`#3B32B3`,color:`white`,fontSize:`20px`,border:`none`,borderRadius:`20px`,width:`50px`,height:`50px`,cursor:`pointer`,zIndex:`10001`,boxShadow:`0px 4px 10px rgba(0, 0, 0, 0.2)`}),o.onclick=()=>{let e=n.style.right===`0px`;n.style.right=e?`-320px`:`0px`},document.body.appendChild(o);let s=document.getElementById(`duperset-verify-btn`),c=document.getElementById(`duperset-mm-btn`);return s?.addEventListener(`click`,t=>{t.preventDefault(),e?.()}),c?.addEventListener(`click`,e=>{e.preventDefault(),t?.()}),r}function t(){if(document.getElementById(`duperset-styles`))return;let e=document.createElement(`style`);e.id=`duperset-styles`,e.textContent=`
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
  `,document.head.appendChild(e)}async function n(e){return console.log(`Sending OTP to:`,e),{success:!0,message:`OTP sent successfully`}}async function r(e){return console.log(`Verifying OTP:`,e),{success:!0,message:`Verified successfully`}}function i(){let e=document.getElementById(`duperset-verify-modal`);if(e)return{open:()=>e.style.display=`flex`,close:()=>e.style.display=`none`};e=document.createElement(`div`),e.classList.add(`modal-overlay`),e.id=`duperset-verify-modal`,e.style.display=`none`;let t=document.createElement(`div`);t.classList.add(`modal-content`);let i=document.createElement(`button`);i.className=`modal-close-btn`,i.innerHTML=`✖`,i.onclick=()=>d(),t.innerHTML=`
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
  `,t.appendChild(i),e.appendChild(t),document.body.appendChild(e);let a=``;function o(e){[`emailStep`,`otpStep`].forEach(t=>{document.getElementById(t).style.display=t===e?`block`:`none`})}function s(e,t){let n=document.getElementById(`verify-message`);n.innerHTML=e,n.className=t}function c(e,t){e.disabled=!0,e.innerText=t}function l(e,t){e.disabled=!1,e.innerText=t}document.getElementById(`otpBtn`).onclick=async()=>{let e=document.getElementById(`verify-email`).value,t=document.getElementById(`otpBtn`);if(!e.includes(`@`)){s(`Invalid email`,`error`);return}c(t,`Sending...`);let r=await n(e);r.success?(a=e,o(`otpStep`),s(`OTP sent`,`success`)):s(r.message||`Failed`,`error`),l(t,`Send OTP`)},document.getElementById(`verifyBtn`).onclick=async()=>{let e=document.getElementById(`verify-otp`).value,t=document.getElementById(`verify-message-box`).value,n=document.getElementById(`verifyBtn`);if(e.length!==4){s(`Invalid OTP`,`error`);return}c(n,`Verifying...`);let i=await r({email:a,otp:e,message:t,isEmergency:!1});i.success?(s(`Verified!`,`success-submitted`),setTimeout(()=>{d(),f()},2e3)):(s(i.message,`error`),l(n,`Verify & Submit`))},document.getElementById(`emergencyBtn`).onclick=async()=>{let e=document.getElementById(`emergencyBtn`),t=document.getElementById(`verify-otp`).value,n=document.getElementById(`emergency-company`).value,i=document.getElementById(`emergency-reason`).value;if(!t||!n||!i){s(`Fill all fields`,`error`);return}c(e,`Submitting...`);let o=`Company: ${n} | ${i}`,u=await r({email:a,otp:t,message:o,isEmergency:!0});u.success?(s(`Submitted!`,`success-submitted`),setTimeout(()=>{d(),f()},2e3)):(s(u.message,`error`),l(e,`Submit as Emergency`))},document.getElementById(`resendLink`).onclick=async()=>{a&&s((await n(a)).success?`OTP resent`:`Failed`,`success`)};function u(){e.style.display=`flex`}function d(){e.style.display=`none`}function f(){document.getElementById(`verify-email`).value=``,document.getElementById(`verify-otp`).value=``,o(`emailStep`)}return{open:u,close:d}}var a=i();t(),e({onVerifyClick:()=>{a.open()},onMajorMinorClick:()=>{console.log(`MM clicked`)}});