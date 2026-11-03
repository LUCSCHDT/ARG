import { auth, db, ready } from "./firebase.js";

import {
    ref,
    get,
    set,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const registerButton = document.getElementById("register");
const status = document.getElementById("status");

registerButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const accessCode = passwordInput.value;
    const normalized = username.toLowerCase();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        status.textContent = "INVALID USERNAME";
        return;
    }

    if (accessCode.length < 4 || accessCode.length > 32) {
        status.textContent = "ACCESS CODE MUST BE 4-32 CHARACTERS";
        return;
    }

    registerButton.disabled = true;
    status.textContent = "CREATING IDENTITY...";

    try {
        await ready;

        const uid = auth.currentUser.uid;
        const playerRef = ref(db, "players/" + uid);
        const existing = await get(playerRef);

        if (existing.exists()) {
            status.textContent =
                "IDENTITY ALREADY REGISTERED: " +
                existing.val().username;
            return;
        }

        const usernameRef = ref(db, "usernames/" + normalized);

        const result = await runTransaction(
            usernameRef,
            current => current === null ? uid : undefined,
            { applyLocally: false }
        );

        if (!result.committed) {
            status.textContent = "USERNAME ALREADY TAKEN";
            return;
        }

        await set(playerRef, {
            username,
            accessCode,
            createdAt: serverTimestamp()
        });

        localStorage.setItem("nexus_player_uid", uid);
        localStorage.setItem("nexus_username", username);

        status.textContent = "IDENTITY CREATED: " + username;

        window.location.href = "chat.html";

    } catch (error) {
        console.error(error);
        status.textContent = "REGISTRATION ERROR: " + error.message;
    } finally {
        registerButton.disabled = false;
    }
});