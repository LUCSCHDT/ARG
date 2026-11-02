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

let myUsername = null;

button.disabled = true;

async function startChat() {
    await ready;

    const uid = auth.currentUser.uid;

    // Récupérer le profil du joueur
    const playerSnapshot = await get(ref(db, "players/" + uid));

    if (!playerSnapshot.exists()) {
        status.textContent = "IDENTITY REQUIRED";
        return;
    }

    myUsername = playerSnapshot.val().username;

    status.textContent = "CONNECTED AS " + myUsername;

    // Écouter les messages en direct
    const chatQuery = query(
        ref(db, "chat"),
        limitToLast(50)
    );

    onValue(chatQuery, async snapshot => {
        messagesBox.replaceChildren();

        const messageElements = [];

        for (const child of Object.values(snapshot.val() || {})) {
            const div = document.createElement("div");
            div.className = "message";

            // Ancien format : sender = UID Firebase
            const sender = child.sender;

            const senderSnapshot = await get(
                ref(db, "players/" + sender)
            );

            const username = senderSnapshot.exists()
                ? senderSnapshot.val().username
                : "UNKNOWN";

            div.textContent = `[${username}] ${child.text}`;
            messageElements.push(div);
        }

        messagesBox.replaceChildren(...messageElements);
        messagesBox.scrollTop = messagesBox.scrollHeight;

    }, error => {
        console.error(error);
        status.textContent = "CHAT ERROR";
    });

    button.disabled = false;
}

async function sendMessage() {
    const text = input.value.trim();

    if (!text || !myUsername) return;

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