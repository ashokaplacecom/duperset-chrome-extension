/***
 * This is the main entrypoint for the content script.
 * replaces content.js
 */
import { createSidebar } from "./ui/sidebar";
import { injectStyles } from "./ui/styles";
import { createVerifyModal } from "./ui/modal_verify";

const verifyModal = createVerifyModal();

injectStyles();

const sidebar = createSidebar({
    onVerifyClick: () => {
        verifyModal.open();
    },
    onMajorMinorClick: () => {
        console.log("MM clicked");
    }
});