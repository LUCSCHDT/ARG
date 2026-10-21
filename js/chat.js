import { auth, db, ready } from "./firebase.js";

import {
    ref,
    push,
    onValue,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const messagesBox = document.getElementById("messages");
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const status = document.getElementById("status");

button.disabled = true;

async function startChat() {
    await ready;

    const chatQuery = query(
        ref(db, "chat"),
        limitToLast(50)
    );

    onValue(chatQuery, snapshot => {
        messagesBox.replaceChildren();

        snapshot.forEach(child => {
            const message = child.val();

            const div = document.createElement("div");
            div.className = "message";

            const name = message.sender === auth.currentUser.uid
                ? "YOU"
                : "ANON";

            div.textContent = `[${name}] ${message.text}`;

            messagesBox.appendChild(div);
        });

        messagesBox.scrollTop = messagesBox.scrollHeight;
        status.textContent = "CONNECTED";
    }, error => {
        console.error(error);
        status.textContent = "READ ERROR";
    });

    button.disabled = false;
}

async function sendMessage() {
    const text = input.value.trim();

    if (!text || text.length > 300) return;

    button.disabled = true;

    try {
        await ready;

        await push(ref(db, "chat"), {
            sender: auth.currentUser.uid,
            text: text
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
    if (event.key === "Enter") {
        sendMessage();
    }
});

startChat().catch(error => {
    console.error(error);
    status.textContent = "CONNECTION ERROR";
});