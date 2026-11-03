import { db, ready } from "./firebase.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login");
const status = document.getElementById("status");

loginButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!username || !password) {
        status.textContent = "MISSING CREDENTIALS";
        return;
    }

    loginButton.disabled = true;
    status.textContent = "VERIFYING IDENTITY...";

    try {
        await ready;

        const usernameSnapshot = await get(
            ref(db, "usernames/" + username)
        );

        if (!usernameSnapshot.exists()) {
            status.textContent = "ACCESS DENIED";
            return;
        }

        const uid = usernameSnapshot.val();

        const playerSnapshot = await get(
            ref(db, "players/" + uid)
        );

        if (!playerSnapshot.exists()) {
            status.textContent = "ACCESS DENIED";
            return;
        }

        const player = playerSnapshot.val();

        if (player.accessCode !== password) {
            status.textContent = "ACCESS DENIED";
            return;
        }

        localStorage.setItem("nexus_player_uid", uid);
        localStorage.setItem("nexus_username", player.username);

        status.textContent = "ACCESS GRANTED";

        window.location.href = "chat.html";

    } catch (error) {
        console.error(error);
        status.textContent = "LOGIN ERROR: " + error.message;
    } finally {
        loginButton.disabled = false;
    }
});