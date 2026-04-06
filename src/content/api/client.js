/***
 * This file makes the API calls and processes the content. 
 */

export async function sendOTP(email) {
    console.log("Sending OTP to:", email);
    return { success: true, message: "OTP sent successfully" };
}

export async function verifyOTP(data) {
    console.log("Verifying OTP:", data);
    return { success: true, message: "Verified successfully" };
}