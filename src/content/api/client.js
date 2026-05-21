const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://connect-placecom.vercel.app/api";
const API_KEY = import.meta.env.VITE_PLACECOM_API_KEY;

/**
 * Thin wrapper around fetch that:
 *   1. Always sends JSON
 *   2. Always returns a parsed JSON object
 *   3. Never throws – network/parse errors are surfaced as { success: false }
 *
 * @param {string} path  - Path relative to BASE_URL, e.g. "/duperset/otp/generate"
 * @param {object} body  - Request payload (will be JSON-stringified)
 * @returns {Promise<object>}
 */
async function post(path, body) {
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY
            },
            body: JSON.stringify(body)
        });

        let data;
        try {
            data = await res.json();
        } catch {
            // Non-JSON body (e.g. plain-text error from a proxy)
            data = { success: false, message: `Server error (${res.status})` };
        }

        // If the server returned a non-2xx status but still has a JSON body,
        // make sure `success` is false so callers don't act on a failed response.
        if (!res.ok && data.success !== false) {
            data.success = false;
            data.message = data.message || `Request failed (${res.status})`;
        }

        return data;
    } catch (err) {
        // Network failure, CORS, etc.
        console.error(`[DupeSet API] POST ${path} failed:`, err);
        return { success: false, message: "Network error. Please check your connection." };
    }
}

/**
 * Sends an OTP to the given student email.
 *
 * Maps to: POST /api/duperset/otp/generate
 *
 * @param {string} email - Student's college email address
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendOTP(email) {
    return post("/duperset/otp/generate", { email });
}

/**
 * Verifies the OTP **and** immediately creates a verification request.
 *
 * This function is a two-step sequence that the UI treats as a single action:
 *   Step 1 – POST /api/duperset/otp/verify       → confirms the OTP is correct
 *   Step 2 – POST /api/duperset/verifications/create → raises the actual request
 *
 * The modal passes { email, otp, message, isEmergency } for both the normal
 * verify flow and the emergency flow.
 *
 * @param {{ email: string, otp: string|number, message?: string, isEmergency?: boolean }} data
 * @returns {Promise<{ success: boolean, message: string, requestId?: number, studentId?: number }>}
 */
export async function verifyOTP({ email, otp, message = "", isEmergency = false }) {
    // Ensure OTP is a number if it's a numeric string, as some backends are strict.
    const numericOtp = typeof otp === "string" ? parseInt(otp, 10) : otp;

    const otpRes = await post("/duperset/otp/verify", { email, otp: numericOtp });

    if (!otpRes.success) {
        return otpRes; // propagate error directly (wrong OTP, expired, etc.)
    }

    // ── Step 2: create the verification request ─────────────────────────────
    const verifyRes = await createVerification({ email, message, isEmergency });

    if (!verifyRes.success) {
        return verifyRes;
    }

    // Merge studentId from OTP step in case callers need it
    return {
        ...verifyRes,
        studentId: otpRes.studentId
    };
}

/**
 * Verifies OTP only — does NOT create a verification request.
 *
 * Used by flows (e.g. Major/Minor change) that need the studentId from OTP
 * verification before calling a separate creation endpoint.
 *
 * Maps to: POST /api/duperset/otp/verify
 *
 * @param {{ email: string, otp: string|number }} data
 * @returns {Promise<{ success: boolean, message: string, studentId?: number }>}
 */
export async function verifyOTPOnly({ email, otp }) {
    const numericOtp = typeof otp === "string" ? parseInt(otp, 10) : otp;
    return post("/duperset/otp/verify", { email, otp: numericOtp });
}

/**
 * Creates a verification request for a student.
 *
 * Maps to: POST /api/duperset/verifications/create
 *
 * - Regular request: 48-hour deadline, notifies mapped POC.
 * - Emergency request: 24-hour deadline, decrements emergency quota.
 *   Fails with 403 if the student has no emergencies remaining.
 *
 * @param {{ email: string, message?: string, isEmergency?: boolean }} options
 * @returns {Promise<{ success: boolean, message: string, requestId?: number }>}
 */
export async function createVerification({ email, message = "", isEmergency = false }) {
    return post("/duperset/verifications/create", {
        email,
        message: message.trim(),
        isEmergency
    });
}

/**
 * Returns the most recent verification request status for the student.
 * Returns `data: null` if there is no request or the latest is older than 7 days.
 *
 * Maps to: POST /api/duperset/verifications/status
 *
 * @param {string} email - Student email
 * @returns {Promise<{
 *   success: boolean,
 *   data: null | {
 *     raised_at:   string,
 *     modified_at: string | null,
 *     modified_by: number | null,
 *     status:      "pending" | "approved" | "rejected"
 *   }
 * }>}
 */
export async function getVerificationStatus(email) {
    return post("/duperset/verifications/status", { email });
}

/**
 * Returns all archived (non-pending) verification requests for the student.
 *
 * Maps to: POST /api/duperset/verifications/archives
 *
 * @param {string} email - Student email
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{
 *     raised_at:   string,
 *     modified_at: string | null,
 *     modified_by: number | null,
 *     status:      "approved" | "rejected"
 *   }>
 * }>}
 */
export async function getVerificationArchives(email) {
    return post("/duperset/verifications/archives", { email });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Major / Minor Change API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Creates a major/minor change request for a student.
 *
 * Maps to: POST /api/duperset/major-minor-change/create
 *
 * At least one of the four major/minor fields must be non-empty.
 * The backend validates studentId against the email, enforces a pending-request
 * lock, and decrements the change quota.
 *
 * @param {{
 *   studentId:        number,
 *   email:            string,
 *   currentMajor?:    string,
 *   prospectiveMajor?: string,
 *   currentMinor?:    string,
 *   prospectiveMinor?: string
 * }} options
 * @returns {Promise<{ success: boolean, message: string, requestId?: number }>}
 */
export async function createMajorMinorChange({
    studentId,
    email,
    currentMajor,
    prospectiveMajor,
    currentMinor,
    prospectiveMinor,
}) {
    return post("/duperset/major-minor-change/create", {
        studentId,
        email,
        ...(currentMajor     ? { currentMajor }     : {}),
        ...(prospectiveMajor ? { prospectiveMajor } : {}),
        ...(currentMinor     ? { currentMinor }     : {}),
        ...(prospectiveMinor ? { prospectiveMinor } : {}),
    });
}

/**
 * Returns the most recent major/minor change request status for a student.
 * Returns `data: null` if there is no request or the latest is older than 7 days.
 *
 * Maps to: POST /api/duperset/major-minor-change/status
 *
 * @param {string} email - Student email
 * @returns {Promise<{
 *   success: boolean,
 *   data: null | {
 *     raised_at:   string,
 *     modified_at: string | null,
 *     modified_by: number | null,
 *     status:      "pending" | "approved" | "rejected"
 *   }
 * }>}
 */
export async function getMajorMinorStatus(email) {
    return post("/duperset/major-minor-change/status", { email });
}

/**
 * Returns all archived (non-pending) major/minor change requests for the student.
 *
 * Maps to: POST /api/duperset/major-minor-change/archives
 *
 * @param {string} email - Student email
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{
 *     raised_at:   string,
 *     modified_at: string | null,
 *     modified_by: number | null,
 *     status:      "approved" | "rejected"
 *   }>
 * }>}
 */
export async function getMajorMinorArchives(email) {
    return post("/duperset/major-minor-change/archives", { email });
}

/* ═══════════════════════════════════════════════════════════════════════════
   External Opportunities API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generic GET helper — no request body, no API key (public endpoint).
 *
 * @param {string} path - Path relative to BASE_URL
 * @returns {Promise<object>}
 */
async function get(path) {
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json"
            },
        });

        let data;
        try {
            data = await res.json();
        } catch {
            data = { success: false, message: `Server error (${res.status})` };
        }

        if (!res.ok && data.success !== false) {
            data.success = false;
            data.message = data.message || `Request failed (${res.status})`;
        }

        return data;
    } catch (err) {
        console.error(`[DupeSet API] GET ${path} failed:`, err);
        return { success: false, message: "Network error. Please check your connection." };
    }
}