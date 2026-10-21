import { auth, db, ready } from "./firebase.js";

import {
    ref,
    get,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const usernameInput = document.getElementById("username");
const registerButton = document.getElementById("register");
const status = document.getElementById("status");

registerButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        status.textContent = "INVALID USERNAME";
        return;
    }

    registerButton.disabled = true;

    try {
        await ready;

        const uid = auth.currentUser.uid;
        const playerRef = ref(db, "players/" + uid);

        const existing = await get(playerRef);

        if (existing.exists()) {
            status.textContent = "IDENTITY ALREADY REGISTERED";
            return;
        }

        await set(playerRef, {
            username: username,
            createdAt: serverTimestamp()
        });

        localStorage.setItem("nexus_username", username);

        status.textContent = "IDENTITY CREATED: " + username;

    } catch (error) {
        console.error(error);
        status.textContent = "REGISTRATION FAILED";
    } finally {
        registerButton.disabled = false;
    }
});