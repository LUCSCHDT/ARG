import { auth, db, ready } from "./firebase.js";

import {
    ref,
    get,
    push,
    onValue,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const messagesBox = document.getElementById("messages");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const status = document.getElementById("status");

let currentPlayer = null;

button.disabled = true;

async function startChat() {
    await ready;

    const playerUid = localStorage.getItem("nexus_player_uid");

    if (!playerUid) {
        status.textContent = "IDENTITY REQUIRED";
        return;
    }

    const playerSnapshot = await get(
        ref(db, "players/" + playerUid)
    );

    if (!playerSnapshot.exists()) {
        status.textContent = "IDENTITY NOT FOUND";
        return;
    }

    currentPlayer = playerSnapshot.val();
    status.textContent = "CONNECTED AS " + currentPlayer.username;

    const chatQuery = query(
        ref(db, "chat"),
        limitToLast(50)
    );

    onValue(chatQuery, async snapshot => {
        const elements = [];

        for (const message of Object.values(snapshot.val() || {})) {
            const senderSnapshot = await get(
                ref(db, "players/" + message.sender)
            );

            const senderName = senderSnapshot.exists()
                ? senderSnapshot.val().username
                : "UNKNOWN";

            const div = document.createElement("div");
            div.className = "message";
            div.textContent = `[${senderName}] ${message.text}`;

            elements.push(div);
        }

        messagesBox.replaceChildren(...elements);
        messagesBox.scrollTop = messagesBox.scrollHeight;

    }, error => {
        console.error(error);
        status.textContent = "CHAT ERROR";
    });

    button.disabled = false;
}

async function sendMessage() {
    const text = input.value.trim();

    if (!text || !currentPlayer || text.length > 300) return;

    button.disabled = true;

    try {
        await push(ref(db, "chat"), {
            sender: auth.currentUser.uid,
            text
        });

        input.value = "";

    } catch (error) {
        console.error(error);
        status.textContent = "SEND ERROR";
    } finally {
        button.disabled = false;
    }
}

button.addEventListener("click", sendMessage);

input.addEventListener("keydown", event => {
    if (event.key === "Enter") sendMessage();
});

startChat().catch(error => {
    console.error(error);
    status.textContent = "CONNECTION ERROR";
});