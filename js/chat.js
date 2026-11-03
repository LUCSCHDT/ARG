import { db, ready } from "./firebase.js";

import {
    ref,
    get,
    push,
    onValue,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// ==========================================
// NEXUS CHAT — CONFIGURATION
// ==========================================

const messagesBox = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const status = document.getElementById("status");

const logoutButton = document.getElementById("logoutButton");
const accountLinks = document.getElementById("accountLinks");

let currentPlayer = null;
let playerUid = null;

// Désactiver l'envoi avant la connexion
sendButton.disabled = true;

// ==========================================
// INITIALISATION
// ==========================================

async function startChat() {
    await ready;

    // Récupérer l'identité fictive NEXUS
    playerUid = localStorage.getItem("nexus_player_uid");

    if (!playerUid) {
        status.textContent = "IDENTITY REQUIRED";

        if (accountLinks) {
            accountLinks.hidden = false;
        }

        return;
    }

    // Chercher le profil dans Firebase
    const playerSnapshot = await get(
        ref(db, "players/" + playerUid)
    );

    if (!playerSnapshot.exists()) {
        status.textContent = "IDENTITY NOT FOUND";

        localStorage.removeItem("nexus_player_uid");
        localStorage.removeItem("nexus_username");

        return;
    }

    currentPlayer = playerSnapshot.val();

    status.textContent =
        "CONNECTED AS " + currentPlayer.username;

    // Masquer les liens LOGIN / REGISTER
    if (accountLinks) {
        accountLinks.hidden = true;
    }

    // Afficher le bouton LOGOUT
   // Afficher le bouton LOGOUT
const logout = document.getElementById("logoutButton");

if (logout) {
    logout.removeAttribute("hidden");
    console.log("NEXUS: LOGOUT ACTIVATED");
} else {
    console.error("NEXUS: LOGOUT BUTTON NOT FOUND");
}

    // ======================================
    // MESSAGES EN TEMPS RÉEL
    // ======================================

    const chatQuery = query(
        ref(db, "chat"),
        limitToLast(50)
    );

    onValue(
        chatQuery,

        async snapshot => {
            const elements = [];

            // Parcourir les messages
            for (const message of Object.values(snapshot.val() || {})) {

                let senderName = "UNKNOWN";

                // Chercher le pseudo de l'expéditeur
                if (message.sender) {
                    const senderSnapshot = await get(
                        ref(db, "players/" + message.sender)
                    );

                    if (senderSnapshot.exists()) {
                        senderName = senderSnapshot.val().username;
                    }
                }

                const div = document.createElement("div");
                div.className = "message";

                // textContent évite d'exécuter du HTML envoyé par un joueur
                div.textContent =
                    `[${senderName}] ${message.text}`;

                elements.push(div);
            }

            messagesBox.replaceChildren(...elements);

            // Défiler automatiquement vers le bas
            messagesBox.scrollTop = messagesBox.scrollHeight;
        },

        error => {
            console.error("CHAT READ ERROR:", error);
            status.textContent = "CHAT ERROR";
        }
    );

    sendButton.disabled = false;
}

// ==========================================
// ENVOYER UN MESSAGE
// ==========================================

async function sendMessage() {
    const text = input.value.trim();

    if (!text || !currentPlayer || !playerUid) {
        return;
    }

    if (text.length > 300) {
        status.textContent = "MESSAGE TOO LONG";
        return;
    }

    sendButton.disabled = true;

    try {
        await push(ref(db, "chat"), {
            sender: playerUid,
            text: text
        });

        input.value = "";

    } catch (error) {
        console.error("SEND ERROR:", error);
        status.textContent = "SEND ERROR: " + error.message;

    } finally {
        sendButton.disabled = false;
    }
}

// ==========================================
// LOGOUT
// ==========================================

function logout() {
    // Effacer uniquement la session fictive
    localStorage.removeItem("nexus_player_uid");
    localStorage.removeItem("nexus_username");

    // Retourner à la page de connexion
    window.location.replace("login.html");
}

// ==========================================
// ÉVÉNEMENTS
// ==========================================

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

// ==========================================
// DÉMARRAGE
// ==========================================

startChat().catch(error => {
    console.error("NEXUS START ERROR:", error);
    status.textContent = "CONNECTION ERROR: " + error.message;
});